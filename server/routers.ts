import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { callbackUrl, createAuthorizationUrl, fetchSegmentations, integrationStatus, syncNextContactPage, syncNextJulyConversionBatch, updateSegmentation } from "./rdstation/service";
import { isRdAccountKey, RD_ACCOUNTS, type RdAccountKey } from "./rdstation/types";
import { medsystemsBitrixCampaignAttributionDetail, medsystemsBitrixLeadChannelFunnel, medsystemsBitrixJulyDealAnalytics, medsystemsBitrixJulyTotals, medsystemsBitrixOperationsDashboard, medsystemsBitrixRdOpportunityDashboard, medsystemsBitrixStatus, medsystemsUtmReceiptCoverage } from "./bitrix24/service";
import { getUserByUsername, listDashboardAccessLogs, mediaDashboardAnalytics, recordDashboardAccess, rdStationOperationsDashboard, upsertUser } from "./db";
import { clearDashboardLoginFailures, isDashboardLoginBlocked, normalizeDashboardUsername, publicDashboardUser, registerDashboardLoginFailure, requestAuditMetadata, verifyDashboardPassword } from "./dashboardAuth";
import { bitrixExportSnapshot } from "./spreadsheet/bitrixExportSnapshot";
import { mediaChannelDashboard } from "./media/channelDashboard";

const accountInput = z.enum(RD_ACCOUNTS);
const analyticsBrandInput = z.enum(["all", "medsystems", "beautysystems"]);
const dashboardDateInput = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const optionalFilterInput = z.string().max(512).default("all");
const dashboardProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.loginMethod !== "password" || !ctx.user.username) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso exclusivo para usuários do dashboard." });
  }
  return next({ ctx });
});
const dashboardAdminProcedure = dashboardProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Acesso exclusivo do administrador." });
  return next({ ctx });
});

function requestOrigin(req: { protocol?: string; header: (name: string) => string | undefined }) {
  const browserOrigin = req.header("origin");
  if (browserOrigin && /^https:\/\//.test(browserOrigin)) return browserOrigin.replace(/\/$/, "");
  const referer = req.header("referer");
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      // Fallback para os cabeçalhos do proxy quando o referer não estiver em formato de URL.
    }
  }
  const protocol = req.header("x-forwarded-proto")?.split(",")[0] || req.protocol || "https";
  const host = req.header("x-forwarded-host") || req.header("host");
  if (!host) throw new Error("Não foi possível determinar a URL pública do callback.");
  return `${protocol}://${host}`;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user?.loginMethod === "password" && opts.ctx.user.username ? publicDashboardUser(opts.ctx.user) : null),
    login: publicProcedure.input(z.object({
      username: z.string().trim().min(1).max(64),
      password: z.string().min(1).max(256),
    })).mutation(async ({ input, ctx }) => {
      const username = normalizeDashboardUsername(input.username);
      const audit = requestAuditMetadata(ctx.req);
      const rateKey = `${audit.ipAddress ?? "unknown"}:${username}`;
      if (isDashboardLoginBlocked(rateKey)) {
        await recordDashboardAccess({ username, result: "failure", ...audit });
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Muitas tentativas. Aguarde 15 minutos e tente novamente." });
      }
      const user = await getUserByUsername(username);
      const valid = verifyDashboardPassword(input.password, user?.passwordHash);
      if (!user || !valid) {
        registerDashboardLoginFailure(rateKey);
        await recordDashboardAccess({ userId: user?.id ?? null, username, result: "failure", ...audit });
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário ou senha inválidos." });
      }
      clearDashboardLoginFailures(rateKey);
      const expiresInMs = 12 * 60 * 60 * 1000;
      const token = await sdk.createSessionToken(user.openId, { expiresInMs, name: user.name || user.username || "Dashboard" });
      ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: expiresInMs });
      await upsertUser({ openId: user.openId, lastSignedIn: new Date() });
      await recordDashboardAccess({ userId: user.id, username, result: "success", ...audit });
      return publicDashboardUser(user);
    }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      if (ctx.user?.loginMethod === "password" && ctx.user.username) {
        const audit = requestAuditMetadata(ctx.req);
        await recordDashboardAccess({ userId: ctx.user.id, username: ctx.user.username, result: "logout", ...audit });
      }
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
    accessLogs: dashboardAdminProcedure.input(z.object({ limit: z.number().int().min(1).max(500).default(200) }).optional()).query(({ input }) => listDashboardAccessLogs(input?.limit ?? 200)),
  }),
  rdstation: router({
    status: adminProcedure.query(async () => ({ accounts: await integrationStatus() })),
    callbackInfo: adminProcedure.query(({ ctx }) => ({ callbackUrl: callbackUrl(requestOrigin(ctx.req)) })),
    startAuthorization: adminProcedure.input(z.object({ accountKey: accountInput })).mutation(async ({ input, ctx }) => {
      return createAuthorizationUrl(input.accountKey as RdAccountKey, requestOrigin(ctx.req));
    }),
    updateSegmentation: adminProcedure.input(z.object({ accountKey: accountInput, segmentationId: z.string().max(128) })).mutation(async ({ input }) => {
      await updateSegmentation(input.accountKey as RdAccountKey, input.segmentationId);
      return { success: true };
    }),
    listSegmentations: adminProcedure.input(z.object({ accountKey: accountInput })).query(async ({ input }) => ({
      segmentations: await fetchSegmentations(input.accountKey as RdAccountKey),
    })),
    syncContacts: adminProcedure.input(z.object({ accountKey: accountInput })).mutation(async ({ input }) => (
      syncNextContactPage(input.accountKey as RdAccountKey)
    )),
    syncNextEvents: adminProcedure.input(z.object({ accountKey: accountInput })).mutation(async ({ input }) => (
      syncNextJulyConversionBatch(input.accountKey as RdAccountKey)
    )),
    operationsDashboard: dashboardProcedure.input(z.object({ brand: analyticsBrandInput, period: z.enum(["2026-07", "2026-08"]).default("2026-07") })).query(({ input }) => rdStationOperationsDashboard(input.brand, input.period)),
  }),
  bitrix24: router({
    medsystemsStatus: adminProcedure.query(() => medsystemsBitrixStatus()),
    medsystemsJulyTotals: adminProcedure.query(() => medsystemsBitrixJulyTotals()),
    medsystemsJulyDealAnalytics: dashboardProcedure.input(z.object({ status: z.enum(["all", "open", "won", "lost"]), brand: analyticsBrandInput, period: z.enum(["2026-07", "2026-08"]).default("2026-07") }).optional()).query(({ input }) => medsystemsBitrixJulyDealAnalytics(input?.status ?? "all", input?.brand ?? "all", input?.period ?? "2026-07")),
    medsystemsLeadChannelFunnel: dashboardProcedure.input(z.object({ status: z.enum(["all", "open", "won", "lost"]), brand: analyticsBrandInput, period: z.enum(["2026-07", "2026-08"]).default("2026-07") }).optional()).query(({ input }) => medsystemsBitrixLeadChannelFunnel(input?.status ?? "all", input?.brand ?? "all", input?.period ?? "2026-07")),
    medsystemsCampaignAttributionDetail: dashboardProcedure.input(z.object({ status: z.enum(["all", "open", "won", "lost"]), brand: analyticsBrandInput, period: z.enum(["2026-07", "2026-08"]).default("2026-07") }).optional()).query(({ input }) => medsystemsBitrixCampaignAttributionDetail(input?.status ?? "all", input?.brand ?? "all", input?.period ?? "2026-07")),
    medsystemsUtmReceiptCoverage: dashboardProcedure.input(z.object({ brand: analyticsBrandInput, period: z.enum(["2026-07", "2026-08"]).default("2026-07") }).optional()).query(({ input }) => medsystemsUtmReceiptCoverage(input?.brand ?? "all", input?.period ?? "2026-07")),
    operationsDashboard: dashboardProcedure.input(z.object({ status: z.enum(["all", "open", "won", "lost"]), brand: analyticsBrandInput, period: z.enum(["2026-07", "2026-08"]).default("2026-07") }).optional()).query(({ input }) => medsystemsBitrixOperationsDashboard(input?.status ?? "all", input?.brand ?? "all", input?.period ?? "2026-07")),
    rdOpportunityDashboard: dashboardProcedure.input(z.object({
      startDate: dashboardDateInput.default("2026-08-01"),
      endDate: dashboardDateInput.default("2026-08-25"),
      pipeline: z.string().max(32).default("all"),
      responsible: optionalFilterInput,
      source: optionalFilterInput,
      stage: optionalFilterInput,
      position: optionalFilterInput,
      product: optionalFilterInput,
      campaign: optionalFilterInput,
      adset: optionalFilterInput,
      creative: optionalFilterInput,
    }).optional()).query(({ input }) => medsystemsBitrixRdOpportunityDashboard({
      startDate: input?.startDate ?? "2026-08-01",
      endDate: input?.endDate ?? "2026-08-25",
      filters: {
        pipeline: input?.pipeline ?? "all",
        responsible: input?.responsible ?? "all",
        source: input?.source ?? "all",
        stage: input?.stage ?? "all",
        position: input?.position ?? "all",
        product: input?.product ?? "all",
        campaign: input?.campaign ?? "all",
        adset: input?.adset ?? "all",
        creative: input?.creative ?? "all",
      },
    })),
  }),
  analytics: router({
    dashboard: dashboardProcedure.input(z.object({ brand: analyticsBrandInput, period: z.enum(["2026-07", "2026-08"]).default("2026-07") })).query(({ input }) => mediaDashboardAnalytics(input.brand, input.period)),
    channelDashboard: dashboardProcedure.input(z.object({
      platform: z.enum(["google_ads", "meta_ads"]),
      brand: analyticsBrandInput.default("all"),
      startDate: dashboardDateInput.default("2026-08-01"),
      endDate: dashboardDateInput.default("2026-08-19"),
      campaignId: z.string().max(128).optional(),
    })).query(({ input }) => mediaChannelDashboard(input)),
  }),
  spreadsheet: router({
    bitrixExportDashboard: dashboardProcedure.query(() => bitrixExportSnapshot),
  }),
});

export type AppRouter = typeof appRouter;

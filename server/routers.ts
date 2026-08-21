import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { callbackUrl, createAuthorizationUrl, fetchSegmentations, integrationStatus, syncNextContactPage, syncNextJulyConversionBatch, updateSegmentation } from "./rdstation/service";
import { isRdAccountKey, RD_ACCOUNTS, type RdAccountKey } from "./rdstation/types";
import { medsystemsBitrixCampaignAttributionDetail, medsystemsBitrixLeadChannelFunnel, medsystemsBitrixJulyDealAnalytics, medsystemsBitrixJulyTotals, medsystemsBitrixOperationsDashboard, medsystemsBitrixRdOpportunityDashboard, medsystemsBitrixStatus, medsystemsUtmReceiptCoverage } from "./bitrix24/service";
import { mediaDashboardAnalytics, rdStationOperationsDashboard } from "./db";
import { bitrixExportSnapshot } from "./spreadsheet/bitrixExportSnapshot";
import { mediaChannelDashboard } from "./media/channelDashboard";

const accountInput = z.enum(RD_ACCOUNTS);
const analyticsBrandInput = z.enum(["all", "medsystems", "beautysystems"]);
const dashboardDateInput = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const optionalFilterInput = z.string().max(512).default("all");

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
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
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
    operationsDashboard: publicProcedure.input(z.object({ brand: analyticsBrandInput, period: z.enum(["2026-07", "2026-08"]).default("2026-07") })).query(({ input }) => rdStationOperationsDashboard(input.brand, input.period)),
  }),
  bitrix24: router({
    medsystemsStatus: adminProcedure.query(() => medsystemsBitrixStatus()),
    medsystemsJulyTotals: adminProcedure.query(() => medsystemsBitrixJulyTotals()),
    medsystemsJulyDealAnalytics: publicProcedure.input(z.object({ status: z.enum(["all", "open", "won", "lost"]), brand: analyticsBrandInput, period: z.enum(["2026-07", "2026-08"]).default("2026-07") }).optional()).query(({ input }) => medsystemsBitrixJulyDealAnalytics(input?.status ?? "all", input?.brand ?? "all", input?.period ?? "2026-07")),
    medsystemsLeadChannelFunnel: publicProcedure.input(z.object({ status: z.enum(["all", "open", "won", "lost"]), brand: analyticsBrandInput, period: z.enum(["2026-07", "2026-08"]).default("2026-07") }).optional()).query(({ input }) => medsystemsBitrixLeadChannelFunnel(input?.status ?? "all", input?.brand ?? "all", input?.period ?? "2026-07")),
    medsystemsCampaignAttributionDetail: publicProcedure.input(z.object({ status: z.enum(["all", "open", "won", "lost"]), brand: analyticsBrandInput, period: z.enum(["2026-07", "2026-08"]).default("2026-07") }).optional()).query(({ input }) => medsystemsBitrixCampaignAttributionDetail(input?.status ?? "all", input?.brand ?? "all", input?.period ?? "2026-07")),
    medsystemsUtmReceiptCoverage: publicProcedure.input(z.object({ brand: analyticsBrandInput, period: z.enum(["2026-07", "2026-08"]).default("2026-07") }).optional()).query(({ input }) => medsystemsUtmReceiptCoverage(input?.brand ?? "all", input?.period ?? "2026-07")),
    operationsDashboard: publicProcedure.input(z.object({ status: z.enum(["all", "open", "won", "lost"]), brand: analyticsBrandInput, period: z.enum(["2026-07", "2026-08"]).default("2026-07") }).optional()).query(({ input }) => medsystemsBitrixOperationsDashboard(input?.status ?? "all", input?.brand ?? "all", input?.period ?? "2026-07")),
    rdOpportunityDashboard: publicProcedure.input(z.object({
      startDate: dashboardDateInput.default("2026-08-01"),
      endDate: dashboardDateInput.default("2026-08-19"),
      pipeline: z.string().max(32).default("all"),
      responsible: optionalFilterInput,
      source: optionalFilterInput,
      stage: optionalFilterInput,
      position: optionalFilterInput,
      product: optionalFilterInput,
    }).optional()).query(({ input }) => medsystemsBitrixRdOpportunityDashboard({
      startDate: input?.startDate ?? "2026-08-01",
      endDate: input?.endDate ?? "2026-08-19",
      filters: {
        pipeline: input?.pipeline ?? "all",
        responsible: input?.responsible ?? "all",
        source: input?.source ?? "all",
        stage: input?.stage ?? "all",
        position: input?.position ?? "all",
        product: input?.product ?? "all",
      },
    })),
  }),
  analytics: router({
    dashboard: publicProcedure.input(z.object({ brand: analyticsBrandInput, period: z.enum(["2026-07", "2026-08"]).default("2026-07") })).query(({ input }) => mediaDashboardAnalytics(input.brand, input.period)),
    channelDashboard: publicProcedure.input(z.object({
      platform: z.enum(["google_ads", "meta_ads"]),
      brand: analyticsBrandInput.default("all"),
      startDate: dashboardDateInput.default("2026-08-01"),
      endDate: dashboardDateInput.default("2026-08-19"),
      campaignId: z.string().max(128).optional(),
    })).query(({ input }) => mediaChannelDashboard(input)),
  }),
  spreadsheet: router({
    bitrixExportDashboard: publicProcedure.query(() => bitrixExportSnapshot),
  }),
});

export type AppRouter = typeof appRouter;

import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { callbackUrl, createAuthorizationUrl, fetchSegmentations, integrationStatus, syncNextContactPage, syncNextJulyConversionBatch, updateSegmentation } from "./rdstation/service";
import { isRdAccountKey, RD_ACCOUNTS, type RdAccountKey } from "./rdstation/types";
import { medsystemsBitrixJulyDealAnalytics, medsystemsBitrixJulyTotals, medsystemsBitrixStatus } from "./bitrix24/service";
import { mediaDashboardAnalytics } from "./db";

const accountInput = z.enum(RD_ACCOUNTS);
const analyticsBrandInput = z.enum(["all", "medsystems", "beautysystems"]);

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
  }),
  bitrix24: router({
    medsystemsStatus: adminProcedure.query(() => medsystemsBitrixStatus()),
    medsystemsJulyTotals: adminProcedure.query(() => medsystemsBitrixJulyTotals()),
    medsystemsJulyDealAnalytics: adminProcedure.query(() => medsystemsBitrixJulyDealAnalytics()),
  }),
  analytics: router({
    dashboard: adminProcedure.input(z.object({ brand: analyticsBrandInput })).query(({ input }) => mediaDashboardAnalytics(input.brand)),
  }),
});

export type AppRouter = typeof appRouter;

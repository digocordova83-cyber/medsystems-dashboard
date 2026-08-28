import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { programmaticDashboard } from "./dashboard";
import { exchangeAndStorePublyaToken, publyaConnectionStatus, syncPublyaPeriod } from "./service";

const dashboardProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.loginMethod !== "password" || !ctx.user.username) throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso exclusivo para usuários do dashboard." });
  return next({ ctx });
});

const dashboardAdminProcedure = dashboardProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Acesso exclusivo do administrador." });
  return next({ ctx });
});

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const publyaRouter = router({
  status: dashboardAdminProcedure.query(() => publyaConnectionStatus()),
  exchangeToken: dashboardAdminProcedure.input(z.object({ temporaryToken: z.string().min(20).max(2048) })).mutation(({ input }) => exchangeAndStorePublyaToken(input.temporaryToken)),
  sync: dashboardAdminProcedure.input(z.object({ startDate: date, endDate: date })).mutation(({ input }) => syncPublyaPeriod(input.startDate, input.endDate)),
  dashboard: dashboardProcedure.input(z.object({ startDate: date, endDate: date, campaignId: z.number().int().positive().optional() })).query(({ input }) => programmaticDashboard(input)),
});

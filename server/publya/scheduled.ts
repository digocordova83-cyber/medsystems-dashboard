import type { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { publyaAccounts } from "../../drizzle/schema";
import { sdk } from "../_core/sdk";
import { getDb } from "../db";
import { syncPublyaPeriod } from "./service";

function saoPauloDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function previousDayInSaoPaulo(now = new Date()) {
  const today = saoPauloDate(now);
  const previous = new Date(new Date(`${today}T12:00:00.000Z`).getTime() - 24 * 60 * 60 * 1000);
  const endDate = saoPauloDate(previous);
  return { startDate: `${endDate.slice(0, 7)}-01`, endDate };
}

export async function runScheduledPublyaSync(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const db = await getDb();
    if (!db) throw new Error("Banco de dados indisponível.");
    const account = (await db.select().from(publyaAccounts).where(eq(publyaAccounts.scheduleCronTaskUid, user.taskUid)).limit(1))[0];
    if (!account) return res.json({ ok: true, skipped: "orphan" });
    const period = previousDayInSaoPaulo();
    const result = await syncPublyaPeriod(period.startDate, period.endDate);
    return res.json({ ok: true, period, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido na sincronização Publya.";
    return res.status(500).json({
      error: message,
      stack: error instanceof Error ? error.stack : undefined,
      context: { url: req.originalUrl, taskUid: null },
      timestamp: new Date().toISOString(),
    });
  }
}

export function registerPublyaScheduledRoutes(app: Express) {
  app.post("/api/scheduled/publya-sync", runScheduledPublyaSync);
}

export const publyaScheduleInternals = { saoPauloDate, previousDayInSaoPaulo };

import type { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { paidMediaReconciliationJobs } from "../../drizzle/schema";
import { sdk } from "../_core/sdk";
import { getDb } from "../db";
import { previousBusinessDayInSaoPaulo, reconcilePaidMediaBusinessDate } from "./dailyReconciliation";

export async function runScheduledPaidMediaReconciliation(req: Request, res: Response) {
  let taskUid: string | null = null;
  try {
    const user = await sdk.authenticateRequest(req);
    taskUid = user.taskUid ?? null;
    if (!user.isCron || !taskUid) return res.status(403).json({ error: "cron-only" });
    const db = await getDb();
    if (!db) throw new Error("Banco de dados indisponível.");
    const job = (await db.select().from(paidMediaReconciliationJobs).where(eq(paidMediaReconciliationJobs.scheduleCronTaskUid, taskUid)).limit(1))[0];
    if (!job) return res.json({ ok: true, skipped: "orphan" });
    const businessDate = previousBusinessDayInSaoPaulo();
    const result = await reconcilePaidMediaBusinessDate(businessDate);
    return res.json({ ok: true, result });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Erro desconhecido na conciliação diária.",
      stack: error instanceof Error ? error.stack : undefined,
      context: { url: req.originalUrl, taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}

export function registerPaidMediaReconciliationScheduledRoutes(app: Express) {
  app.post("/api/scheduled/paid-media-reconciliation", runScheduledPaidMediaReconciliation);
}

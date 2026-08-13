import type { Express, Request, Response } from "express";
import { exchangeAuthorizationCode } from "./service";
import { isRdAccountKey } from "./types";

function page(title: string, message: string, ok: boolean) {
  const color = ok ? "#22c55e" : "#f97316";
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title></head><body style="margin:0;background:#0b1220;color:#e7edf6;font-family:Arial,sans-serif;display:grid;place-items:center;min-height:100vh"><main style="max-width:520px;padding:40px;text-align:center"><div style="color:${color};font-size:12px;font-weight:bold;letter-spacing:.18em;text-transform:uppercase">RD Station Marketing</div><h1 style="font-size:32px;margin:18px 0 12px">${title}</h1><p style="color:#a7b4c7;line-height:1.6">${message}</p><p style="color:#718096;font-size:13px;margin-top:28px">Você pode fechar esta janela e voltar ao painel.</p></main></body></html>`;
}

export function registerRdStationCallback(app: Express) {
  app.get("/api/rdstation/callback", async (req: Request, res: Response) => {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const accountKey = state.split(".")[0] ?? "";
    if (!code || !state || !isRdAccountKey(accountKey)) {
      res.status(400).send(page("Autorização inválida", "Não recebemos os parâmetros OAuth esperados. Volte ao painel e inicie a autorização novamente.", false));
      return;
    }
    try {
      await exchangeAuthorizationCode(accountKey, state, code);
      res.status(200).send(page("Conta autorizada", `A conta ${accountKey === "medsystems" ? "Medsystems" : "BeautySystems"} foi conectada com segurança.`, true));
    } catch (error) {
      res.status(400).send(page("Não foi possível concluir", error instanceof Error ? error.message : "Ocorreu uma falha durante a autorização.", false));
    }
  });
}

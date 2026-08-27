import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { sdk } from "./_core/sdk";
import { appRouter } from "./routers";
import { hashDashboardPassword, normalizeDashboardUsername, publicDashboardUser, verifyDashboardPassword } from "./dashboardAuth";

function context(user: TrpcContext["user"] = null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {}, header: () => undefined } as unknown as TrpcContext["req"],
    res: { cookie: () => undefined, clearCookie: () => undefined } as unknown as TrpcContext["res"],
  };
}

describe("dashboard credential auth", () => {
  it("normaliza login sem alterar a senha", () => {
    expect(normalizeDashboardUsername("  Isadora ")).toBe("isadora");
  });

  it("armazena senha com scrypt e valida em tempo constante", () => {
    const stored = hashDashboardPassword("segredo-forte");
    expect(stored).not.toContain("segredo-forte");
    expect(verifyDashboardPassword("segredo-forte", stored)).toBe(true);
    expect(verifyDashboardPassword("outra-senha", stored)).toBe(false);
  });

  it("emite e verifica uma sessão local assinada", async () => {
    const token = await sdk.createSessionToken("local:rodrigo", { expiresInMs: 60_000, name: "Rodrigo" });
    await expect(sdk.verifySession(token)).resolves.toMatchObject({ openId: "local:rodrigo", name: "Rodrigo" });
  });

  it("não expõe hash ou identificador interno em auth.me", async () => {
    const user = {
      id: 10,
      openId: "local:rodrigo",
      username: "rodrigo",
      passwordHash: "scrypt$secret",
      name: "Rodrigo",
      email: null,
      loginMethod: "password",
      role: "admin" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    expect(publicDashboardUser(user)).toEqual({ id: 10, username: "rodrigo", name: "Rodrigo", role: "admin" });
    await expect(appRouter.createCaller(context(user)).auth.me()).resolves.toEqual({ id: 10, username: "rodrigo", name: "Rodrigo", role: "admin" });
  });

  it("bloqueia consultas do dashboard sem sessão", async () => {
    await expect(appRouter.createCaller(context()).analytics.dashboard({ brand: "all", period: "2026-08" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("bloqueia o log administrativo para clientes", async () => {
    const user = {
      id: 11,
      openId: "local:patrick",
      username: "patrick",
      passwordHash: "scrypt$secret",
      name: "Patrick",
      email: null,
      loginMethod: "password",
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    await expect(appRouter.createCaller(context(user)).auth.accessLogs({ limit: 20 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

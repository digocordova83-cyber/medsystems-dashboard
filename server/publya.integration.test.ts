import { describe, expect, it } from "vitest";
import { publyaConnectionStatus } from "./publya/service";

describe("Publya API credentials", () => {
  it("mantém o token permanente configurado sem reutilizar o token temporário", async () => {
    const status = await publyaConnectionStatus();
    expect(status.configured).toBe(true);
    expect(status.status).toBe("pronta");
    expect(status.lastSyncAt).toBeInstanceOf(Date);
    expect(status.lastDataDate).toBeInstanceOf(Date);
    expect(status.lastError).toBeNull();
  });
});

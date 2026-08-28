import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const indexHtml = readFileSync(new URL("../client/index.html", import.meta.url), "utf8");

describe("site metadata", () => {
  it("uses the configured Medsystems title", () => {
    expect(process.env.VITE_APP_TITLE).toBe("Medsystems - Gerencial");
    expect(indexHtml).toContain("<title>%VITE_APP_TITLE%</title>");
  });

  it("references the Medsystems logo as favicon", () => {
    expect(indexHtml).toContain('rel="icon"');
    expect(indexHtml).toContain("/manus-storage/medsystems-login-logo_75d768a6.png");
  });
});

import { describe, expect, it } from "vitest";
import { fetchSegmentations } from "./service";

describe("acesso isolado às segmentações do RD Station", () => {
  it("consulta as segmentações da Medsystems com o token OAuth armazenado", async () => {
    const segmentations = await fetchSegmentations("medsystems");
    expect(Array.isArray(segmentations)).toBe(true);
  }, 20_000);

  it("consulta as segmentações da BeautySystems com o token OAuth armazenado", async () => {
    const segmentations = await fetchSegmentations("beautysystems");
    expect(Array.isArray(segmentations)).toBe(true);
  }, 20_000);
});

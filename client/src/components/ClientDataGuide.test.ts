import { describe, expect, it } from "vitest";
import { CLIENT_GUIDE_SECTIONS } from "./ClientDataGuide";

describe("ClientDataGuide", () => {
  it("mantém a metodologia, a disponibilidade e as dúvidas na guia do cliente", () => {
    expect(CLIENT_GUIDE_SECTIONS).toEqual(["fontes", "caminho", "cruzamentos", "disponibilidade", "limites", "duvidas"]);
  });
});

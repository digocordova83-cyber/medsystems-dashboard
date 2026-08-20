import { describe, expect, it } from "vitest";
import { AUGUST_DATA_AVAILABILITY, CLIENT_GUIDE_SECTIONS } from "./ClientDataGuide";

describe("ClientDataGuide", () => {
  it("mantém a metodologia, a disponibilidade e as dúvidas na guia do cliente", () => {
    expect(CLIENT_GUIDE_SECTIONS).toEqual(["fontes", "caminho", "cruzamentos", "disponibilidade", "limites", "duvidas"]);
    expect(AUGUST_DATA_AVAILABILITY).toEqual({
      media: "Completo até 19/08",
      crm: "Leads e negócios até 19/08",
      rd: "Contatos BRRO e eventos coletados por API até 17/08",
    });
  });
});

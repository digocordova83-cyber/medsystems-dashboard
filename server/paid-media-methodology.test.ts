import { describe, expect, it } from "vitest";
import { summarizePaidMediaLeadComponents } from "./db";

describe("summarizePaidMediaLeadComponents", () => {
  it("separa Instant Forms de sinais de mensageria sem transformá-los em leads sintéticos", () => {
    const result = summarizePaidMediaLeadComponents([
      { brand: "medsystems", platform: "meta_ads", rawPayload: JSON.stringify({ actions_leadgen_grouped: 2, actions_onsite_conversion_messaging_conversation_started_7d: 3, actions_onsite_conversion_messaging_first_reply: 1, actions_onsite_conversion_total_messaging_connection: 2 }) },
      { brand: "medsystems", platform: "meta_ads", rawPayload: JSON.stringify({ actions_leadgen_grouped: 1, actions_onsite_conversion_messaging_conversation_started_7d: 2 }) },
      { brand: "beautysystems", platform: "google_ads", rawPayload: JSON.stringify({ conversions: 8 }) },
    ]);

    expect(result.medsystems).toEqual({ instantForms: 3, messagingConversations: 5, messagingFirstReplies: 1, messagingConnections: 2 });
    expect(result.beautysystems).toEqual({ instantForms: 0, messagingConversations: 0, messagingFirstReplies: 0, messagingConnections: 0 });
  });
});

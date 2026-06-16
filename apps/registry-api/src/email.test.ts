import { afterEach, describe, expect, it } from "vitest";
import { createEmailSender, resolveEmailConfig } from "./email.js";

afterEach(() => {
  delete process.env.AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING;
  delete process.env.AIPM_EMAIL_SENDER_ADDRESS;
  delete process.env.AIPM_EMAIL_FROM_NAME;
});

describe("resolveEmailConfig", () => {
  it("disables email by default", async () => {
    const config = resolveEmailConfig();
    expect(config).toMatchObject({ provider: "disabled", senderName: "AIPM Registry" });
    const sender = createEmailSender(config);
    await expect(
      sender.sendInviteEmail({
        to: "person@example.com",
        orgName: "Team",
        orgSlug: "team",
        role: "member",
        inviteUrl: "https://aipm-registry.com/dashboard?invite=token",
        invitedBy: "owner",
        expiresAt: new Date("2026-06-09T00:00:00.000Z"),
      }),
    ).resolves.toEqual({ sent: false, provider: "disabled" });
  });

  it("enables Azure email when connection details are present", () => {
    process.env.AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING =
      "endpoint=https://example.communication.azure.com/;accesskey=fake";
    process.env.AIPM_EMAIL_SENDER_ADDRESS = "noreply@example.com";
    const sender = createEmailSender(resolveEmailConfig());
    expect(sender.isEnabled).toBe(true);
  });

  it("stays disabled when Azure connection details are incomplete", () => {
    process.env.AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING =
      "endpoint=https://example.communication.azure.com/;accesskey=fake";
    const sender = createEmailSender(resolveEmailConfig());
    expect(sender.isEnabled).toBe(false);
  });
});

describe("sendAuthCodeEmail", () => {
  it("returns sent false when email is disabled", async () => {
    const sender = createEmailSender(resolveEmailConfig());
    await expect(
      sender.sendAuthCodeEmail({
        to: "person@example.com",
        code: "123456",
        expiresAt: new Date("2026-06-09T00:00:00.000Z"),
      }),
    ).resolves.toEqual({ sent: false, provider: "disabled" });
  });
});

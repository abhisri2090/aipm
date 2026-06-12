import { afterEach, describe, expect, it } from "vitest";
import { createEmailSender, resolveEmailConfig } from "./email.js";

afterEach(() => {
  delete process.env.AIPM_EMAIL_PROVIDER;
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

  it("requires Azure connection details when enabled", () => {
    process.env.AIPM_EMAIL_PROVIDER = "azure";
    expect(() => createEmailSender(resolveEmailConfig())).toThrow(/AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING/);

    process.env.AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING = "endpoint=https://example.communication.azure.com/;accesskey=fake";
    expect(() => createEmailSender(resolveEmailConfig())).toThrow(/AIPM_EMAIL_SENDER_ADDRESS/);
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

  it("configures Azure sender for auth code emails", () => {
    process.env.AIPM_EMAIL_PROVIDER = "azure";
    process.env.AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING =
      "endpoint=https://example.communication.azure.com/;accesskey=fake";
    process.env.AIPM_EMAIL_SENDER_ADDRESS = "noreply@example.com";
    const sender = createEmailSender(resolveEmailConfig());
    expect(sender.isEnabled).toBe(true);
    expect(sender.sendAuthCodeEmail).toBeTypeOf("function");
  });
});

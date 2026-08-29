import { EmailClient } from "@azure/communication-email";

export type EmailProvider = "disabled" | "azure";

export type EmailConfig = {
  provider: EmailProvider;
  connectionString?: string;
  senderAddress?: string;
  senderName: string;
};

export type InviteEmailInput = {
  to: string;
  orgName: string;
  orgSlug: string;
  role: string;
  inviteUrl: string;
  invitedBy: string;
  expiresAt: Date;
};

export type InviteEmailResult = {
  sent: boolean;
  provider: EmailProvider;
};

export type VerificationEmailInput = {
  to: string;
  code: string;
  expiresAt: Date;
};

export type AuthCodeEmailInput = VerificationEmailInput;

export type EmailSender = {
  isEnabled: boolean;
  sendInviteEmail(input: InviteEmailInput): Promise<InviteEmailResult>;
  sendVerificationEmail(input: VerificationEmailInput): Promise<InviteEmailResult>;
  sendAuthCodeEmail(input: AuthCodeEmailInput): Promise<InviteEmailResult>;
};

export function resolveEmailConfig(env: NodeJS.ProcessEnv = process.env): EmailConfig {
  const senderName = env.AIPM_EMAIL_FROM_NAME ?? "AIPM Registry";
  const connectionString = env.AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING?.trim();
  const senderAddress = env.AIPM_EMAIL_SENDER_ADDRESS?.trim();
  if (connectionString && senderAddress) {
    return {
      provider: "azure",
      connectionString,
      senderAddress,
      senderName,
    };
  }
  return { provider: "disabled", senderName };
}

function assertAzureEmailConfig(config: EmailConfig): asserts config is EmailConfig & {
  connectionString: string;
  senderAddress: string;
} {
  if (!config.connectionString) throw new Error("AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING is not set");
  if (!config.senderAddress) throw new Error("AIPM_EMAIL_SENDER_ADDRESS is not set");
}

function textInvite(input: InviteEmailInput): string {
  return [
    `${input.invitedBy} invited you to join ${input.orgName} (@${input.orgSlug}) on AIPM as ${input.role}.`,
    "",
    "Accept the invite:",
    input.inviteUrl,
    "",
    `This invite expires at ${input.expiresAt.toISOString()}.`,
    "",
    "If you were not expecting this invite, you can ignore this email.",
  ].join("\n");
}

function htmlInvite(input: InviteEmailInput): string {
  const escapedOrgName = escapeHtml(input.orgName);
  const escapedOrgSlug = escapeHtml(input.orgSlug);
  const escapedRole = escapeHtml(input.role);
  const escapedInvitedBy = escapeHtml(input.invitedBy);
  const escapedInviteUrl = escapeHtml(input.inviteUrl);
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f7f8f5;color:#1b211d;font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f8f5;padding:28px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #d9ded6;border-radius:8px;padding:28px;">
            <tr><td>
              <p style="margin:0 0 10px;color:#1d7f5f;font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;">AIPM invite</p>
              <h1 style="margin:0 0 14px;font-size:28px;line-height:1.15;">Join ${escapedOrgName}</h1>
              <p style="margin:0 0 18px;font-size:16px;line-height:1.55;">${escapedInvitedBy} invited you to join <strong>@${escapedOrgSlug}</strong> as <strong>${escapedRole}</strong>.</p>
              <p style="margin:0 0 22px;">
                <a href="${escapedInviteUrl}" style="display:inline-block;background:#1d7f5f;color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 16px;font-weight:700;">Accept invite</a>
              </p>
              <p style="margin:0 0 8px;color:#5e6a62;font-size:14px;line-height:1.5;">This invite expires at ${escapeHtml(input.expiresAt.toISOString())}.</p>
              <p style="margin:0;color:#5e6a62;font-size:14px;line-height:1.5;">If the button does not work, open this link: <br><a href="${escapedInviteUrl}" style="color:#1d7f5f;">${escapedInviteUrl}</a></p>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function textVerification(input: VerificationEmailInput): string {
  return [
    `Your AIPM email verification code is: ${input.code}`,
    "",
    `This code expires at ${input.expiresAt.toISOString()}.`,
    "",
    "If you did not request this code, you can ignore this email.",
  ].join("\n");
}

function textAuthCode(input: AuthCodeEmailInput): string {
  return [
    `Your AIPM sign-in code is: ${input.code}`,
    "",
    `This code expires at ${input.expiresAt.toISOString()}.`,
    "",
    "If you did not request this code, you can ignore this email.",
  ].join("\n");
}

function htmlAuthCode(input: AuthCodeEmailInput): string {
  const escapedCode = escapeHtml(input.code);
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f7f8f5;color:#1b211d;font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f8f5;padding:28px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #d9ded6;border-radius:8px;padding:28px;">
            <tr><td>
              <p style="margin:0 0 10px;color:#1d7f5f;font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;">AIPM sign-in</p>
              <h1 style="margin:0 0 14px;font-size:28px;line-height:1.15;">Your sign-in code</h1>
              <p style="margin:0 0 18px;font-size:16px;line-height:1.55;">Enter this code on the AIPM login page:</p>
              <p style="margin:0 0 22px;font-size:32px;font-weight:700;letter-spacing:.18em;">${escapedCode}</p>
              <p style="margin:0;color:#5e6a62;font-size:14px;line-height:1.5;">This code expires at ${escapeHtml(input.expiresAt.toISOString())}. If you did not request it, ignore this email.</p>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function htmlVerification(input: VerificationEmailInput): string {
  const escapedCode = escapeHtml(input.code);
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f7f8f5;color:#1b211d;font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f8f5;padding:28px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #d9ded6;border-radius:8px;padding:28px;">
            <tr><td>
              <p style="margin:0 0 10px;color:#1d7f5f;font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;">AIPM email verification</p>
              <h1 style="margin:0 0 14px;font-size:28px;line-height:1.15;">Verify your email</h1>
              <p style="margin:0 0 18px;font-size:16px;line-height:1.55;">Enter this code on your AIPM profile page:</p>
              <p style="margin:0 0 22px;font-size:32px;font-weight:700;letter-spacing:.18em;">${escapedCode}</p>
              <p style="margin:0;color:#5e6a62;font-size:14px;line-height:1.5;">This code expires at ${escapeHtml(input.expiresAt.toISOString())}. If you did not request it, ignore this email.</p>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function createEmailSender(config: EmailConfig = resolveEmailConfig()): EmailSender {
  if (config.provider === "disabled") {
    return {
      isEnabled: false,
      async sendInviteEmail() {
        return { sent: false, provider: "disabled" };
      },
      async sendVerificationEmail() {
        return { sent: false, provider: "disabled" };
      },
      async sendAuthCodeEmail() {
        return { sent: false, provider: "disabled" };
      },
    };
  }

  assertAzureEmailConfig(config);
  const client = new EmailClient(config.connectionString);
  const senderAddress = config.senderAddress;
  return {
    isEnabled: true,
    async sendInviteEmail(input) {
      await client.beginSend({
        senderAddress,
        recipients: {
          to: [{ address: input.to }],
        },
        content: {
          subject: `Invitation to join ${input.orgName} on AIPM`,
          plainText: textInvite(input),
          html: htmlInvite(input),
        },
      });
      return { sent: true, provider: "azure" };
    },
    async sendVerificationEmail(input) {
      await client.beginSend({
        senderAddress,
        recipients: {
          to: [{ address: input.to }],
        },
        content: {
          subject: "Your AIPM email verification code",
          plainText: textVerification(input),
          html: htmlVerification(input),
        },
      });
      return { sent: true, provider: "azure" };
    },
    async sendAuthCodeEmail(input) {
      await client.beginSend({
        senderAddress,
        recipients: {
          to: [{ address: input.to }],
        },
        content: {
          subject: "Your AIPM sign-in code",
          plainText: textAuthCode(input),
          html: htmlAuthCode(input),
        },
      });
      return { sent: true, provider: "azure" };
    },
  };
}

import { Resend } from "resend";
import { brand } from "@/config/brand";

let cachedClient: Resend | null = null;

function getClient(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }
  if (!cachedClient) cachedClient = new Resend(process.env.RESEND_API_KEY);
  return cachedClient;
}

function getFrom(): string {
  const from = process.env.RESEND_FROM;
  if (!from) throw new Error("RESEND_FROM is not set");
  return from;
}

export interface SendInviteEmailOpts {
  to: string;
  orgName: string;
  inviteUrl: string;
  inviterName?: string | null;
}

export async function sendInviteEmail(opts: SendInviteEmailOpts): Promise<void> {
  const inviter = opts.inviterName?.trim() || "A teammate";
  const subject = `${inviter} invited you to ${opts.orgName} on ${brand.name}`;
  const text =
    `${inviter} has invited you to join ${opts.orgName} on ${brand.name}.\n\n` +
    `Accept the invite: ${opts.inviteUrl}\n\n` +
    `If you weren't expecting this email you can safely ignore it.`;
  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f0f0f;">
      <h1 style="font-size:18px;margin:0 0 16px;">You're invited to ${escapeHtml(opts.orgName)}</h1>
      <p style="font-size:14px;line-height:1.5;margin:0 0 20px;">
        ${escapeHtml(inviter)} has invited you to join <strong>${escapeHtml(opts.orgName)}</strong> on ${brand.name}.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${opts.inviteUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">
          Accept invitation
        </a>
      </p>
      <p style="font-size:12px;color:#6b7280;line-height:1.5;margin:0;">
        Or copy this link: ${opts.inviteUrl}<br/>
        If you weren't expecting this email, you can safely ignore it.
      </p>
    </div>
  `;

  const { error } = await getClient().emails.send({
    from: getFrom(),
    to: opts.to,
    subject,
    text,
    html,
  });
  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

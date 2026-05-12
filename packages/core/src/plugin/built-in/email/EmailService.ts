import type { IEmailService, SendOptions } from "../../../email/EmailService";

export interface EmailProviderConfig {
  provider?: "smtp" | "sendmail" | "sendgrid" | "mailgun" | "ses" | "noop";
  defaultFrom?: string;
  defaultReplyTo?: string;
  smtp?: {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: { user?: string; pass?: string };
  };
  sendgrid?: { apiKey?: string };
  mailgun?: { apiKey?: string; domain?: string };
  ses?: { accessKeyId?: string; secretAccessKey?: string; region?: string };
}

type TemplateRecord = {
  name: string;
  subject?: string;
  body?: string;
  bodyType?: "html" | "text" | string;
  fromName?: string;
  fromEmail?: string;
  responseEmail?: string;
};

type DbLike = {
  findOneBy: (table: string, where: Record<string, unknown>) => Promise<unknown>;
};

/**
 * Real email service. Loads provider config from `enterprise_core_store_settings`
 * (key `admin::email`) at send time so admin UI changes apply without restart.
 *
 * Templates live in `enterprise_email_templates`; `sendTemplate` reads + renders
 * Mustache-style `{{ placeholders }}`.
 */
export class EmailService implements IEmailService {
  private db: DbLike;
  private storeKey: string;
  private templateTable: string;
  private defaultConfig: EmailProviderConfig;

  constructor(opts: {
    db: DbLike;
    storeKey?: string;
    templateTable?: string;
    defaultConfig?: EmailProviderConfig;
  }) {
    this.db = opts.db;
    this.storeKey = opts.storeKey ?? "admin::email";
    this.templateTable = opts.templateTable ?? "enterprise_email_templates";
    this.defaultConfig = opts.defaultConfig ?? { provider: "noop" };
  }

  async getConfig(): Promise<EmailProviderConfig> {
    try {
      const row = await this.db.findOneBy("enterprise_core_store_settings", {
        key: this.storeKey,
      });
      const value = (row as { value?: string } | null)?.value;
      if (typeof value === "string" && (value.startsWith("{") || value.startsWith("["))) {
        return { ...this.defaultConfig, ...(JSON.parse(value) as EmailProviderConfig) };
      }
    } catch {
      /* fall through to defaults */
    }
    return this.defaultConfig;
  }

  async send(opts: SendOptions): Promise<{ success: boolean; error?: string }> {
    try {
      const config = await this.getConfig();
      const nodemailer = (await import("nodemailer")).default;
      const transporter = nodemailer.createTransport(this.buildTransport(config));
      await transporter.sendMail({
        from: opts.from ?? config.defaultFrom ?? "noreply@enterprise.local",
        to: opts.to,
        replyTo: opts.replyTo ?? config.defaultReplyTo,
        subject: opts.subject ?? "",
        text: opts.text,
        html: opts.html,
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  /**
   * Render and send a stored template. `data` populates Mustache-style `{{key}}`
   * placeholders. Returns true if the template was found and sent.
   */
  async sendTemplate(
    templateName: string,
    to: string | string[],
    data: Record<string, unknown> = {},
  ): Promise<boolean> {
    const tpl = (await this.db.findOneBy(this.templateTable, {
      name: templateName,
    })) as TemplateRecord | null;
    if (!tpl) return false;
    const subject = renderTemplate(tpl.subject ?? "", data);
    const body = renderTemplate(tpl.body ?? "", data);
    const isHtml = tpl.bodyType !== "text" && /<[^>]+>/.test(body);
    await this.send({
      to,
      from:
        tpl.fromEmail && tpl.fromName
          ? `${tpl.fromName} <${tpl.fromEmail}>`
          : tpl.fromEmail || undefined,
      replyTo: tpl.responseEmail,
      subject,
      ...(isHtml ? { html: body } : { text: body }),
    });
    return true;
  }

  private buildTransport(config: EmailProviderConfig): Record<string, unknown> {
    switch (config.provider) {
      case "smtp":
        return {
          host: config.smtp?.host,
          port: config.smtp?.port ?? 587,
          secure: config.smtp?.secure ?? false,
          auth: config.smtp?.auth,
        };
      case "sendmail":
        return { sendmail: true, newline: "unix" };
      case "noop":
      default:
        return { streamTransport: true, newline: "unix", buffer: true };
    }
  }
}

function renderTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key: string) => {
    const value = key.split(".").reduce<unknown>((acc, part) => {
      if (acc && typeof acc === "object" && part in (acc as object)) {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, data);
    return value == null ? "" : String(value);
  });
}

/**
 * Email service interface (Strapi-style). Backend can plug real provider.
 */
export interface SendOptions {
  to: string | string[];
  from?: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface IEmailService {
  send(options: SendOptions): Promise<{ success: boolean; error?: string }>;
}

export class NoopEmailService implements IEmailService {
  async send(options: SendOptions): Promise<{ success: boolean; error?: string }> {
    if (process.env.NODE_ENV !== "production") {
      console.log("[Enterprise Email] (noop)", options.subject, "->", options.to);
    }
    return { success: true };
  }
}

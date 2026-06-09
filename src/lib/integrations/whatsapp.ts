import type { IntegrationResult, WhatsAppMessage } from "@/lib/integrations/types";

export interface WhatsAppService {
  sendTemplate(params: {
    to: string;
    template: string;
    variables?: Record<string, string>;
  }): Promise<IntegrationResult<WhatsAppMessage>>;
}

export class MockWhatsAppService implements WhatsAppService {
  async sendTemplate(params: {
    to: string;
    template: string;
  }): Promise<IntegrationResult<WhatsAppMessage>> {
    return {
      ok: true,
      data: {
        to: params.to,
        template: params.template,
        status: "queued",
      },
    };
  }
}

export const whatsappService: WhatsAppService = new MockWhatsAppService();

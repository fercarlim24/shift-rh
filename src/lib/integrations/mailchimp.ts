import type { EmailCampaign, IntegrationResult } from "@/lib/integrations/types";

export interface EmailMarketingService {
  sendCampaign(params: {
    subject: string;
    recipients: string[];
  }): Promise<IntegrationResult<EmailCampaign>>;
}

export class MockBrevoService implements EmailMarketingService {
  async sendCampaign(params: {
    subject: string;
    recipients: string[];
  }): Promise<IntegrationResult<EmailCampaign>> {
    return {
      ok: true,
      data: {
        id: `mock-campaign-${Date.now()}`,
        subject: params.subject,
        recipients: params.recipients.length,
        status: "sent",
      },
    };
  }
}

export const emailMarketingService: EmailMarketingService = new MockBrevoService();

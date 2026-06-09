export type IntegrationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type SignatureDocument = {
  id: string;
  name: string;
  status: "pending" | "signed" | "rejected";
  signers: { name: string; email: string; signedAt?: string }[];
  sentAt: string;
};

export type HREmployeeSync = {
  externalId: string;
  name: string;
  employmentType: string;
  syncedAt: string;
};

export type WorkspaceUser = {
  email: string;
  name: string;
  groups: string[];
};

export type EmailCampaign = {
  id: string;
  subject: string;
  recipients: number;
  status: "draft" | "sent";
};

export type WhatsAppMessage = {
  to: string;
  template: string;
  status: "queued" | "sent" | "failed";
};

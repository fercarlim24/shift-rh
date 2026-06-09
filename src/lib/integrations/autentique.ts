import type { IntegrationResult, SignatureDocument } from "@/lib/integrations/types";

export interface AutentiqueService {
  sendDocument(params: {
    employeeName: string;
    employmentType: string;
    organizationName: string;
  }): Promise<IntegrationResult<SignatureDocument>>;
  getDocumentStatus(documentId: string): Promise<IntegrationResult<SignatureDocument>>;
}

export class MockAutentiqueService implements AutentiqueService {
  async sendDocument(params: {
    employeeName: string;
    employmentType: string;
    organizationName: string;
  }): Promise<IntegrationResult<SignatureDocument>> {
    const id = `mock-doc-${Date.now()}`;
    return {
      ok: true,
      data: {
        id,
        name: `Contrato ${params.employmentType} — ${params.employeeName}`,
        status: "pending",
        signers: [{ name: params.employeeName, email: `${params.employeeName.toLowerCase().replace(/\s/g, ".")}@email.com` }],
        sentAt: new Date().toISOString(),
      },
    };
  }

  async getDocumentStatus(documentId: string): Promise<IntegrationResult<SignatureDocument>> {
    return {
      ok: true,
      data: {
        id: documentId,
        name: "Documento mock",
        status: "pending",
        signers: [],
        sentAt: new Date().toISOString(),
      },
    };
  }
}

export const autentiqueService: AutentiqueService = new MockAutentiqueService();

import type { HREmployeeSync, IntegrationResult } from "@/lib/integrations/types";

export interface ConveniaService {
  syncEmployee(employeeId: string): Promise<IntegrationResult<HREmployeeSync>>;
  listEmployees(organizationCnpj: string): Promise<IntegrationResult<HREmployeeSync[]>>;
}

export class MockConveniaService implements ConveniaService {
  async syncEmployee(employeeId: string): Promise<IntegrationResult<HREmployeeSync>> {
    return {
      ok: true,
      data: {
        externalId: `conv-${employeeId}`,
        name: "Colaborador mock",
        employmentType: "CLT",
        syncedAt: new Date().toISOString(),
      },
    };
  }

  async listEmployees(): Promise<IntegrationResult<HREmployeeSync[]>> {
    return { ok: true, data: [] };
  }
}

export const conveniaService: ConveniaService = new MockConveniaService();

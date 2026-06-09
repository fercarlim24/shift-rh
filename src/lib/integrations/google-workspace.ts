import type { IntegrationResult, WorkspaceUser } from "@/lib/integrations/types";

export interface GoogleWorkspaceService {
  provisionUser(params: { email: string; name: string }): Promise<IntegrationResult<WorkspaceUser>>;
  suspendUser(email?: string): Promise<IntegrationResult<{ suspended: boolean }>>;
}

export class MockGoogleWorkspaceService implements GoogleWorkspaceService {
  async provisionUser(params: {
    email: string;
    name: string;
  }): Promise<IntegrationResult<WorkspaceUser>> {
    return {
      ok: true,
      data: { email: params.email, name: params.name, groups: ["shift-rh-users"] },
    };
  }

  async suspendUser(): Promise<IntegrationResult<{ suspended: boolean }>> {
    return { ok: true, data: { suspended: true } };
  }
}

export const googleWorkspaceService: GoogleWorkspaceService =
  new MockGoogleWorkspaceService();

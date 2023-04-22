import TIER from './stacks.json';

export interface DeploymentRecord {
  tenantId?: string; // callhealth
  id: string; // dev1, dev2, prod1, prod2
  type?: string; // can be pool or silo
  tier?: string; // small
  account?: string;
  region?: string;
}

export interface Deployment extends DeploymentRecord {
  provisioned?: boolean;
}
export function isValidTier(tierName: string): boolean {
  return TIER.some(tier => tier.name === tierName);
}

export function getPipelineName(record: DeploymentRecord): string {
  return `${record.tenantId}-${record.id}-${record.type}-pipeline`;
}

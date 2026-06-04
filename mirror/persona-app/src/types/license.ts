export interface LicenseRecord {
  id: "default";
  isActivated: boolean;
  maskedKey: string;
  instanceId: string;
  activatedAt: string;
  lastCheckedAt: string;
  // rawKey is only populated on PWA builds (Tauri uses OS keyring instead)
  rawKey?: string;
}

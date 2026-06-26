export interface BackendConfig {
  serviceType: "googleSheets" | "airtable";
  googleSheetsSpreadsheetId: string;
  googleSheetsApiKey: string;
  airtableApiKey: string;
  airtableBaseId: string;
  useMockFallback: boolean;
}

const LOCAL_STORAGE_KEY = "wb-fdva-backend-config";

const defaultConfig: BackendConfig = {
  serviceType: "googleSheets",
  googleSheetsSpreadsheetId: "",
  googleSheetsApiKey: "",
  airtableApiKey: "",
  airtableBaseId: "",
  useMockFallback: true, // Defaults to true so the app runs with simulated localStorage out-of-the-box
};

export function getBackendConfig(): BackendConfig {
  if (typeof window === "undefined") return defaultConfig;
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultConfig));
    return defaultConfig;
  }
  try {
    return { ...defaultConfig, ...JSON.parse(stored) };
  } catch {
    return defaultConfig;
  }
}

export function saveBackendConfig(config: Partial<BackendConfig>): BackendConfig {
  const current = getBackendConfig();
  const updated = { ...current, ...config };
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

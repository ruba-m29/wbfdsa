export interface BackendConfig {
  serviceType: "googleSheets" | "airtable";
  googleSheetsSpreadsheetId: string;
  googleSheetsApiKey: string;
  googleSheetsWebAppUrl: string;
  airtableApiKey: string;
  airtableBaseId: string;
  useMockFallback: boolean;
}

const LOCAL_STORAGE_KEY = "wb-fdva-backend-config";
// Bump this version whenever you change defaults — forces localStorage to be reset
const CONFIG_VERSION = "v3";
const CONFIG_VERSION_KEY = "wb-fdva-config-version";

// Read URL from .env (VITE_GOOGLE_SHEETS_URL)
const ENV_SHEETS_URL = import.meta.env.VITE_GOOGLE_SHEETS_URL as string | undefined;

const LIVE_URL =
  ENV_SHEETS_URL ||
  "https://script.google.com/macros/s/AKfycbw6NNUs_SXkgZK3F16aTfRV7MCb189WzP21pE7oy7wFZiKm929dQFqHF9DjjBxlzJ_OwA/exec";

const defaultConfig: BackendConfig = {
  serviceType: "googleSheets",
  googleSheetsSpreadsheetId: "",
  googleSheetsApiKey: "",
  googleSheetsWebAppUrl: LIVE_URL,
  airtableApiKey: "",
  airtableBaseId: "",
  useMockFallback: false,
};

export function getBackendConfig(): BackendConfig {
  if (typeof window === "undefined") return defaultConfig;

  // If stored config version doesn't match current version, wipe it
  const storedVersion = localStorage.getItem(CONFIG_VERSION_KEY);
  if (storedVersion !== CONFIG_VERSION) {
    console.log("[WB-FDVA] Config version changed — clearing stale localStorage config");
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.setItem(CONFIG_VERSION_KEY, CONFIG_VERSION);
  }

  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  let config: BackendConfig = { ...defaultConfig };

  if (stored) {
    try {
      config = { ...defaultConfig, ...JSON.parse(stored) };
    } catch {
      // Corrupt data — use defaults
    }
  }

  // Always force the live URL and disable mock fallback
  config.googleSheetsWebAppUrl = LIVE_URL;
  config.useMockFallback = false;

  // Persist clean config
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
  return config;
}

export function saveBackendConfig(config: Partial<BackendConfig>): BackendConfig {
  const current = getBackendConfig();
  const updated = {
    ...current,
    ...config,
    // Never allow overriding these from UI
    googleSheetsWebAppUrl: LIVE_URL,
    useMockFallback: false,
  };
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

import { getBackendConfig } from "./config";
import type { FloorData } from "@/types/floor";

// Storage keys for localStorage-based simulation
const STORAGE_KEY = "wb_fdva_mock_google_sheets";

// Helper to execute REST fetch to Google Sheets App Script (Web App)
async function googleSheetsRequest(action: string, payload?: any): Promise<any> {
  const config = getBackendConfig();
  const webAppUrl = config.googleSheetsWebAppUrl || config.googleSheetsApiKey;

  if (!webAppUrl || !webAppUrl.startsWith("http")) {
    console.warn("[WB-FDVA] No valid Web App URL configured. Cannot sync with Google Sheets.");
    throw new Error("No valid Web App URL configured.");
  }

  try {
    const requestBody = JSON.stringify({ action, payload });
    console.log("[WB-FDVA] → Request URL:", webAppUrl);
    console.log(`[WB-FDVA] → Action: ${action}`, payload || "");

    // Using text/plain avoids CORS preflight OPTIONS request
    const res = await fetch(webAppUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: requestBody,
    });

    if (!res.ok) {
      throw new Error(`Google Sheets HTTP Error: ${res.status}`);
    }

    const text = await res.text();

    try {
      const json = JSON.parse(text);
      if (!json.success) {
        throw new Error(json.error || "Unknown Apps Script error");
      }
      return json;
    } catch (parseErr) {
      throw new Error("Invalid JSON response from Google Sheets");
    }
  } catch (err) {
    console.error("[WB-FDVA] ✗ fetch threw:", err);
    throw err;
  }
}

export const googleSheetsService = {
  async fetchFullDatabase(): Promise<any> {
    const remote = await googleSheetsRequest("FETCH_ALL");
    return remote.data;
  },

  async remoteCreate(table: string, data: any): Promise<any> {
    const remote = await googleSheetsRequest("CREATE", { table, data });
    return remote.data;
  },

  async remoteUpdate(table: string, id: string | number, data: any): Promise<any> {
    const remote = await googleSheetsRequest("UPDATE", { table, id, data });
    return remote.data;
  },

  async remoteDelete(table: string, id: string | number): Promise<void> {
    await googleSheetsRequest("DELETE", { table, id });
  },
};

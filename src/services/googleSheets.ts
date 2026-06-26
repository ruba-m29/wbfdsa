import { getBackendConfig } from "./config";
import type { FloorData } from "@/types/floor";

// Storage keys for localStorage-based simulation
const STORAGE_KEY = "wb_fdva_mock_google_sheets";

// Seed data helper
function getInitialMockData() {
  return {
    buildings: [
      { id: "1", buildingId: "BLD-001", name: "Meridian Grand Hotel", type: "Hotel", floors: 6, totalArea: 18400, address: "120 Harbor Ave, District 4", status: "submitted", createdAt: Date.now() },
      { id: "2", buildingId: "BLD-002", name: "Saint Clare Medical Center", type: "Hospital", floors: 5, totalArea: 24500, address: "88 Wellness Blvd", status: "submitted", createdAt: Date.now() },
      { id: "3", buildingId: "BLD-003", name: "Apex Tower", type: "Office", floors: 4, totalArea: 14200, address: "1 Apex Plaza", status: "submitted", createdAt: Date.now() }
    ],
    floors: [
      // Meridian Grand Hotel (buildingId: 1)
      { id: "f1", buildingId: "1", level: 1, name: "Ground Floor", totalExits: 4, availableExits: 4, blockedExits: 0, elevatorWorking: true },
      { id: "f2", buildingId: "1", level: 2, name: "Floor 2", totalExits: 3, availableExits: 2, blockedExits: 1, elevatorWorking: true },
      // Apex Tower (buildingId: 3)
      { id: "f3", buildingId: "3", level: 1, name: "Ground Floor", totalExits: 4, availableExits: 4, blockedExits: 0, elevatorWorking: true },
      { id: "f4", buildingId: "3", level: 2, name: "Floor 2", totalExits: 3, availableExits: 3, blockedExits: 0, elevatorWorking: true },
      { id: "f5", buildingId: "3", level: 3, name: "Floor 3", totalExits: 3, availableExits: 3, blockedExits: 0, elevatorWorking: true },
      { id: "f6", buildingId: "3", level: 4, name: "Floor 4", totalExits: 3, availableExits: 3, blockedExits: 0, elevatorWorking: true }
    ],
    floorDetailedData: {
      // Key format: buildingId_level
      "3_1": {
        buildingId: "3",
        level: 1,
        name: "Ground Floor",
        details: {
          floorName: "Ground Lobby & Reception",
          floorArea: 3500,
          maxOccupancy: 150,
          currentOccupancy: 42,
          riskLevel: "LOW",
          revisionNumber: "v2.1",
          uploadDate: "2026-04-10"
        },
        risks: {
          floorRisk: "LOW",
          occupancyRisk: "MEDIUM",
          individualRisk: "LOW",
          overallFireRisk: "LOW"
        },
        stats: {
          directExits: 4,
          doors: 24,
          windows: 40,
          distanceToStaircase: "12 meters",
          staircases: 2,
          lifts: 3,
          maxOccupancy: 150,
          currentOccupancy: 42
        },
        drawing: {
          name: "apex_ground_plan.pdf",
          url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          type: "pdf"
        }
      },
      "3_2": {
        buildingId: "3",
        level: 2,
        name: "Floor 2",
        details: {
          floorName: "Research Labs & Admin",
          floorArea: 3200,
          maxOccupancy: 100,
          currentOccupancy: 88,
          riskLevel: "HIGH",
          revisionNumber: "v1.4",
          uploadDate: "2026-05-15"
        },
        risks: {
          floorRisk: "HIGH",
          occupancyRisk: "HIGH",
          individualRisk: "MEDIUM",
          overallFireRisk: "HIGH"
        },
        stats: {
          directExits: 2,
          doors: 32,
          windows: 48,
          distanceToStaircase: "18 meters",
          staircases: 2,
          lifts: 3,
          maxOccupancy: 100,
          currentOccupancy: 88
        },
        drawing: {
          name: "apex_floor2_layout.png",
          url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><rect width='100%' height='100%' fill='%23131722'/><rect x='50' y='50' width='700' height='500' fill='none' stroke='%23363a45' stroke-width='4'/><line x1='400' y1='50' x2='400' y2='550' stroke='%23363a45' stroke-dasharray='5,5'/><line x1='50' y1='300' x2='750' y2='300' stroke='%23363a45' stroke-dasharray='5,5'/><text x='400' y='300' fill='%236f737d' font-family='monospace' font-size='20' text-anchor='middle'>FLOOR 2 LAB LAYOUT PREVIEW (IMAGE)</text></svg>",
          type: "png"
        }
      },
      "3_3": {
        buildingId: "3",
        level: 3,
        name: "Floor 3",
        details: {
          floorName: "Conference Rooms & Dining",
          floorArea: 3200,
          maxOccupancy: 120,
          currentOccupancy: 50,
          riskLevel: "MEDIUM",
          revisionNumber: "v1.0",
          uploadDate: "2026-06-01"
        },
        risks: {
          floorRisk: "MEDIUM",
          occupancyRisk: "LOW",
          individualRisk: "MEDIUM",
          overallFireRisk: "MEDIUM"
        },
        stats: {
          directExits: 2,
          doors: 28,
          windows: 50,
          distanceToStaircase: "22 meters",
          staircases: 2,
          lifts: 3,
          maxOccupancy: 120,
          currentOccupancy: 50
        },
        drawing: {
          name: "apex_floor3_blueprint.dxf",
          url: "",
          type: "dxf"
        }
      }
    }
  };
}

function getStoredData(): any {
  if (typeof window === "undefined") return getInitialMockData();
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const defaultData = getInitialMockData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    return defaultData;
  }
  return JSON.parse(stored);
}

function saveStoredData(data: any) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

// Helper to execute REST fetch to Google Sheets App Script (Web App)
async function googleSheetsRequest(action: string, payload?: any): Promise<any> {
  const config = getBackendConfig();
  if (config.useMockFallback || !config.googleSheetsSpreadsheetId) {
    return null; // Triggers mock fallback execution flow
  }

  // If the user has a Google Apps Script Web App URL, we call it
  const webAppUrl = config.googleSheetsApiKey; // Storing the Script macro URL in the api key field
  if (!webAppUrl || !webAppUrl.startsWith("http")) {
    console.warn("Google Sheets API requires a Web App URL or Google Sheets API endpoint config.");
    return null;
  }

  try {
    const res = await fetch(webAppUrl, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        spreadsheetId: config.googleSheetsSpreadsheetId,
        action,
        payload,
      }),
    });
    return await res.json();
  } catch (err) {
    console.error("Google Sheets request failed:", err);
    throw err;
  }
}

export const googleSheetsService = {
  // --- Buildings CRUD ---
  async fetchBuildings(): Promise<any[]> {
    const remote = await googleSheetsRequest("fetchBuildings");
    if (remote?.success) return remote.data;

    const data = getStoredData();
    return data.buildings;
  },

  async createBuilding(building: any): Promise<any> {
    const remote = await googleSheetsRequest("createBuilding", building);
    if (remote?.success) return remote.data;

    const data = getStoredData();
    const newBuilding = {
      ...building,
      id: String(data.buildings.length + 1),
      createdAt: Date.now()
    };
    data.buildings.push(newBuilding);
    saveStoredData(data);
    return newBuilding;
  },

  async updateBuilding(id: string, updates: any): Promise<any> {
    const remote = await googleSheetsRequest("updateBuilding", { id, updates });
    if (remote?.success) return remote.data;

    const data = getStoredData();
    const index = data.buildings.findIndex((b: any) => b.id === id);
    if (index !== -1) {
      data.buildings[index] = { ...data.buildings[index], ...updates };
      saveStoredData(data);
      return data.buildings[index];
    }
    throw new Error("Building not found");
  },

  async deleteBuilding(id: string): Promise<void> {
    const remote = await googleSheetsRequest("deleteBuilding", { id });
    if (remote?.success) return;

    const data = getStoredData();
    data.buildings = data.buildings.filter((b: any) => b.id !== id);
    data.floors = data.floors.filter((f: any) => f.buildingId !== id);
    // clean up floor details
    Object.keys(data.floorDetailedData).forEach(key => {
      if (key.startsWith(id + "_")) {
        delete data.floorDetailedData[key];
      }
    });
    saveStoredData(data);
  },

  // --- Floors CRUD ---
  async fetchFloors(buildingId: string): Promise<any[]> {
    const remote = await googleSheetsRequest("fetchFloors", { buildingId });
    if (remote?.success) return remote.data;

    const data = getStoredData();
    return data.floors.filter((f: any) => f.buildingId === buildingId);
  },

  async createFloor(floor: any): Promise<any> {
    const remote = await googleSheetsRequest("createFloor", floor);
    if (remote?.success) return remote.data;

    const data = getStoredData();
    const newFloor = {
      ...floor,
      id: "f_" + Math.random().toString(36).substr(2, 9)
    };
    data.floors.push(newFloor);
    saveStoredData(data);
    return newFloor;
  },

  async updateFloor(id: string, updates: any): Promise<any> {
    const remote = await googleSheetsRequest("updateFloor", { id, updates });
    if (remote?.success) return remote.data;

    const data = getStoredData();
    const index = data.floors.findIndex((f: any) => f.id === id);
    if (index !== -1) {
      data.floors[index] = { ...data.floors[index], ...updates };
      saveStoredData(data);
      return data.floors[index];
    }
    throw new Error("Floor not found");
  },

  async deleteFloor(id: string): Promise<void> {
    const remote = await googleSheetsRequest("deleteFloor", { id });
    if (remote?.success) return;

    const data = getStoredData();
    const floor = data.floors.find((f: any) => f.id === id);
    if (floor) {
      const key = `${floor.buildingId}_${floor.level}`;
      delete data.floorDetailedData[key];
    }
    data.floors = data.floors.filter((f: any) => f.id !== id);
    saveStoredData(data);
  },

  // --- Floor Detailed Data & CAD ---
  async fetchFloorData(buildingId: string, level: number): Promise<FloorData | null> {
    const remote = await googleSheetsRequest("fetchFloorData", { buildingId, level });
    if (remote?.success) return remote.data;

    const data = getStoredData();
    const key = `${buildingId}_${level}`;
    const detailed = data.floorDetailedData[key];
    if (detailed) return detailed;

    // Return a default floor structure if none exists
    const floorMeta = data.floors.find((f: any) => f.buildingId === buildingId && f.level === level);
    return {
      buildingId,
      level,
      name: floorMeta?.name || `Floor ${level}`,
      details: {
        floorName: floorMeta?.name || `Floor ${level}`,
        floorArea: 1500,
        maxOccupancy: 100,
        currentOccupancy: 0,
        riskLevel: "LOW",
        revisionNumber: "v1.0",
        uploadDate: new Date().toISOString().split("T")[0]
      },
      risks: {
        floorRisk: "LOW",
        occupancyRisk: "LOW",
        individualRisk: "LOW",
        overallFireRisk: "LOW"
      },
      stats: {
        directExits: floorMeta?.totalExits || 2,
        doors: 10,
        windows: 15,
        distanceToStaircase: "15 meters",
        staircases: 2,
        lifts: 1,
        maxOccupancy: 100,
        currentOccupancy: 0
      }
    };
  },

  async saveFloorData(buildingId: string, level: number, floorData: FloorData): Promise<FloorData> {
    const remote = await googleSheetsRequest("saveFloorData", { buildingId, level, floorData });
    if (remote?.success) return remote.data;

    const data = getStoredData();
    const key = `${buildingId}_${level}`;
    data.floorDetailedData[key] = {
      ...floorData,
      buildingId,
      level
    };

    // Keep basic Floor record sync'd up as well
    const floorMetaIndex = data.floors.findIndex((f: any) => f.buildingId === buildingId && f.level === level);
    if (floorMetaIndex !== -1) {
      data.floors[floorMetaIndex].totalExits = floorData.stats.directExits;
      data.floors[floorMetaIndex].availableExits = floorData.stats.directExits;
      data.floors[floorMetaIndex].name = floorData.details.floorName;
    }

    saveStoredData(data);
    return data.floorDetailedData[key];
  }
};

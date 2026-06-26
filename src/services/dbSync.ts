import { db } from "@/lib/db";
import { getBackendConfig } from "./config";
import { googleSheetsService } from "./googleSheets";
import { airtableService } from "./airtable";

export function getActiveService() {
  const config = getBackendConfig();
  if (config.serviceType === "airtable") {
    return airtableService;
  }
  return googleSheetsService;
}

export async function syncFromService() {
  const service = getActiveService();
  try {
    // 1. Fetch Buildings
    const remoteBuildings = await service.fetchBuildings();
    if (remoteBuildings && remoteBuildings.length > 0) {
      await db.buildings.clear();
      for (const b of remoteBuildings) {
        // Map string IDs to numbers for local Dexie if applicable, or keep them as is
        const localBuilding = {
          ...b,
          id: isNaN(Number(b.id)) ? Math.floor(Math.random() * 100000) : Number(b.id),
          floors: Number(b.floors) || 1,
          totalArea: Number(b.totalArea) || 0
        };
        await db.buildings.put(localBuilding);
      }
    }

    // 2. Fetch Floors for each building
    const buildings = await db.buildings.toArray();
    await db.floors.clear();
    for (const b of buildings) {
      const remoteFloors = await service.fetchFloors(String(b.id));
      for (const f of remoteFloors) {
        const localFloor = {
          ...f,
          id: isNaN(Number(f.id)) ? Math.floor(Math.random() * 100000) : Number(f.id),
          buildingId: b.id!,
          level: Number(f.level) || 1,
          totalExits: Number(f.totalExits) || 2,
          availableExits: Number(f.availableExits) || 2,
          blockedExits: Number(f.blockedExits) || 0,
          elevatorWorking: f.elevatorWorking === true || f.elevatorWorking === "true" || f.elevatorWorking === "Operational"
        };
        await db.floors.put(localFloor);
      }
    }
  } catch (err) {
    console.error("Failed to sync from backend service to local Dexie cache:", err);
  }
}

export async function createBuildingOnService(buildingData: any) {
  const service = getActiveService();
  const created = await service.createBuilding(buildingData);
  // Also put into local Dexie
  const localId = isNaN(Number(created.id)) ? Math.floor(Math.random() * 100000) : Number(created.id);
  await db.buildings.put({
    ...created,
    id: localId
  });
  return created;
}

export async function updateBuildingOnService(id: string, updates: any) {
  const service = getActiveService();
  const updated = await service.updateBuilding(id, updates);
  // Update local Dexie
  const localId = isNaN(Number(id)) ? null : Number(id);
  if (localId) {
    await db.buildings.update(localId, updates);
  } else {
    // If string ID, find by name or other field to update
    const match = await db.buildings.where("name").equals(updates.name || "").first();
    if (match) {
      await db.buildings.update(match.id!, updates);
    }
  }
  return updated;
}

export async function deleteBuildingFromService(id: string) {
  const service = getActiveService();
  await service.deleteBuilding(id);
  // Delete from local Dexie
  const localId = isNaN(Number(id)) ? null : Number(id);
  if (localId) {
    await db.buildings.delete(localId);
    await db.floors.where("buildingId").equals(localId).delete();
  }
}

export async function createFloorOnService(floorData: any) {
  const service = getActiveService();
  const created = await service.createFloor(floorData);
  // Put into local Dexie
  const localId = isNaN(Number(created.id)) ? Math.floor(Math.random() * 100000) : Number(created.id);
  await db.floors.put({
    ...created,
    id: localId,
    buildingId: Number(floorData.buildingId)
  });
  return created;
}

export async function updateFloorOnService(id: string, updates: any, buildingId: number, level: number) {
  const service = getActiveService();
  const updated = await service.updateFloor(id, updates);
  
  // Sync to local Dexie
  const localId = isNaN(Number(id)) ? null : Number(id);
  if (localId) {
    await db.floors.update(localId, updates);
  } else {
    const match = await db.floors.where("buildingId").equals(buildingId).and(f => f.level === level).first();
    if (match) {
      await db.floors.update(match.id!, updates);
    }
  }
  return updated;
}

export async function deleteFloorFromService(id: string, buildingId: number, level: number) {
  const service = getActiveService();
  await service.deleteFloor(id);
  
  // Sync to local Dexie
  const localId = isNaN(Number(id)) ? null : Number(id);
  if (localId) {
    await db.floors.delete(localId);
  } else {
    const match = await db.floors.where("buildingId").equals(buildingId).and(f => f.level === level).first();
    if (match) {
      await db.floors.delete(match.id!);
    }
  }
}

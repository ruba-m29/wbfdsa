import type {
  CADDrawing,
  FloorData,
  FloorVulnerability,
  RiskLevelType,
  RoomBoundary,
} from "@/types/floor";
import {
  uploadCADFileFn,
  retrieveCADFileFn,
  extractCADObjectsFn,
  calculateFloorStatisticsFn,
  calculateVulnerabilityScoreFn,
  calculateEvacuationPriorityFn,
} from "@/lib/api/cad.functions";

/**
 * Uploads a CAD file to the backend API.
 */
export async function uploadCADFileToBackend(id: string, file: File, fileUrl: string) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  return await uploadCADFileFn({
    data: {
      id,
      fileName: file.name,
      fileUrl,
      fileType: extension,
      fileSize: file.size,
      uploadedBy: "WB-FDVA System",
    },
  });
}

/**
 * Retrieves a CAD file from the backend API.
 */
export async function retrieveCADFileFromBackend(id: string) {
  return await retrieveCADFileFn({ data: { id } });
}

/**
 * Mocks an AI service extracting architectural data from a CAD file via the backend API.
 */
export async function extractCADData(file: File) {
  return await extractCADObjectsFn({ data: { fileSize: file.size } });
}

/**
 * Calculates floor statistics via the backend API.
 */
export async function calculateFloorStatistics(baseStats: any, extractedStats: any) {
  return await calculateFloorStatisticsFn({ data: { baseStats, extractedStats } });
}

/**
 * Calculates floor vulnerability based on 8 structural factors via the backend API.
 */
export async function calculateVulnerability(
  extractedData: any,
  currentOccupancy: number,
  maxOccupancy: number,
): Promise<FloorVulnerability> {
  return await calculateVulnerabilityScoreFn({
    data: {
      extractedData,
      currentOccupancy,
      maxOccupancy,
    },
  });
}

/**
 * Ranks floors by vulnerability score for the Evacuation Priority panel via the backend API.
 */
export async function getEvacuationPriority(floors: any[], currentFloorData?: FloorData | null) {
  return await calculateEvacuationPriorityFn({
    data: {
      floors,
      currentFloorData: currentFloorData || null,
    },
  });
}

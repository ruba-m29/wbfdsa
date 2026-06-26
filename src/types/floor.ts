export type RiskLevelType = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface FloorRisk {
  floorRisk: RiskLevelType;
  occupancyRisk: RiskLevelType;
  individualRisk: RiskLevelType;
  overallFireRisk: RiskLevelType;
}

export interface FloorStatistics {
  directExits: number;
  doors: number;
  windows: number;
  distanceToStaircase: string; // e.g. "18 meters"
  staircases: number;
  lifts: number;
  maxOccupancy: number;
  currentOccupancy: number;
}

export interface FloorDetails {
  floorName: string;
  floorArea: number; // in sq.m
  maxOccupancy: number;
  currentOccupancy: number;
  riskLevel: RiskLevelType;
  revisionNumber: string;
  uploadDate: string; // ISO string or format
}

export interface CADDrawing {
  name: string;
  url: string; // URL, objectURL or Base64 DataURL
  type: "pdf" | "dwg" | "dxf" | "png" | "jpg" | "jpeg";
  size?: number; // in bytes
}

export interface FloorData {
  id?: string;
  buildingId: string;
  level: number;
  name: string;
  details: FloorDetails;
  risks: FloorRisk;
  stats: FloorStatistics;
  drawing?: CADDrawing;
}

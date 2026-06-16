import Dexie, { type Table } from "dexie";

export type BuildingType =
  | "Hotel"
  | "Hospital"
  | "Shopping Mall"
  | "Office"
  | "School"
  | "University"
  | "Data Center"
  | "Mixed Use"
  | "Residential"
  | "Commercial"
  | "Industrial"
  | "Public Facility";

export type AssessmentStatus = "draft" | "submitted";

export interface Building {
  id?: number;
  buildingId?: string;
  name: string;
  ownerName?: string;
  type: BuildingType | string;
  functionalCategory?: string;
  occupancyType?: string;
  floors: number;
  buildingHeight?: number;
  totalArea: number;
  yearOfConstruction?: number;
  contactNumber?: string;
  email?: string;
  address: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  constructionType: string;
  fireResistanceRating: string;
  // Structural details
  numberOfLifts?: number;
  numberOfStaircases?: number;
  numberOfWindows?: number;
  adjacentBuildingDistance?: number;
  peoplePerFloor?: number;
  // Assessment info
  assessmentDate?: string;
  assessorName?: string;
  remarks?: string;
  status?: AssessmentStatus;
  // CAD files stored as names (actual files in browser storage)
  cadFiles?: string[];
  cadFileCategories?: Record<string, string>;
  createdAt: number;
}

export interface Floor {
  id?: number;
  buildingId: number;
  level: number;
  name: string;
  totalExits: number;
  availableExits: number;
  blockedExits: number;
  elevatorWorking: boolean;
}

export type ZoneType = "Lobby" | "Office" | "Corridor" | "Conference" | "Storage" | "Server" | "Patient" | "Retail" | "Classroom";

export interface Zone {
  id?: number;
  buildingId: number;
  floorId: number;
  zoneId: string;
  name: string;
  type: ZoneType;
  area: number;
  occupancy: number;
  specialNeeds: number;
  // Rect on the floor SVG (0-100 coordinate space)
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Personnel {
  id?: number;
  employeeId: string;
  name: string;
  age: number;
  gender: "M" | "F" | "Other";
  department: string;
  cardId: string;
  deviceId: string;
  specialNeeds: boolean;
  emergencyContact: string;
}

export interface Incident {
  id?: number;
  incidentId: string;
  buildingId: number;
  floorId: number;
  zoneId: number;
  sensorId: string;
  startedAt: number;
  resolvedAt?: number;
  status: "active" | "resolved";
}

export interface OccupancyEvent {
  id?: number;
  zoneId: number;
  date: string;
  startTime: string;
  endTime: string;
  expectedOccupancy: number;
  label: string;
}

export interface ActivityLog {
  id?: number;
  timestamp: number;
  kind: "incident" | "occupancy" | "building" | "system";
  message: string;
}

class FDVADatabase extends Dexie {
  buildings!: Table<Building, number>;
  floors!: Table<Floor, number>;
  zones!: Table<Zone, number>;
  personnel!: Table<Personnel, number>;
  incidents!: Table<Incident, number>;
  occupancy!: Table<OccupancyEvent, number>;
  activity!: Table<ActivityLog, number>;

  constructor() {
    super("fdva-db");
    this.version(2).stores({
      buildings: "++id, name, type, status",
      floors: "++id, buildingId, level",
      zones: "++id, buildingId, floorId, zoneId",
      personnel: "++id, employeeId, department",
      incidents: "++id, incidentId, buildingId, status, startedAt",
      occupancy: "++id, zoneId, date",
      activity: "++id, timestamp, kind",
    });
  }
}

export const db = new FDVADatabase();

export async function logActivity(kind: ActivityLog["kind"], message: string) {
  await db.activity.add({ kind, message, timestamp: Date.now() });
}
import { db, type BuildingType, type ZoneType, logActivity } from "./db";

const buildingSeeds: Array<{
  name: string;
  type: BuildingType;
  address: string;
  floors: number;
  totalArea: number;
  constructionType: string;
  fireResistanceRating: string;
}> = [
  { name: "Meridian Grand Hotel", type: "Hotel", address: "120 Harbor Ave, District 4", floors: 6, totalArea: 18400, constructionType: "Type I — Non-combustible", fireResistanceRating: "2-hour" },
  { name: "Saint Clare Medical Center", type: "Hospital", address: "88 Wellness Blvd", floors: 5, totalArea: 24500, constructionType: "Type I — Non-combustible", fireResistanceRating: "3-hour" },
  { name: "Crestline Galleria", type: "Shopping Mall", address: "501 Market Square", floors: 3, totalArea: 32000, constructionType: "Type II — Steel", fireResistanceRating: "1-hour" },
  { name: "Apex Tower", type: "Office", address: "1 Apex Plaza", floors: 4, totalArea: 14200, constructionType: "Type I — Non-combustible", fireResistanceRating: "2-hour" },
  { name: "Northbridge University Hall", type: "University", address: "245 Campus Way", floors: 2, totalArea: 9800, constructionType: "Type III — Masonry", fireResistanceRating: "1-hour" },
];

const zoneTypes: ZoneType[] = ["Lobby", "Office", "Corridor", "Conference", "Storage"];
const hospitalZones: ZoneType[] = ["Patient", "Office", "Corridor", "Storage"];
const mallZones: ZoneType[] = ["Retail", "Corridor", "Storage"];

function zonesForBuilding(type: BuildingType): ZoneType[] {
  if (type === "Hospital") return hospitalZones;
  if (type === "Shopping Mall") return mallZones;
  return zoneTypes;
}

// Layout zones on a 100x100 grid as a 2x3 mosaic
const zoneRects = [
  { x: 4, y: 6, w: 44, h: 38 },
  { x: 52, y: 6, w: 44, h: 38 },
  { x: 4, y: 48, w: 28, h: 46 },
  { x: 36, y: 48, w: 28, h: 46 },
  { x: 68, y: 48, w: 28, h: 46 },
];

const firstNames = ["Avery", "Jordan", "Riya", "Marcus", "Hana", "Ngozi", "Diego", "Mei", "Owen", "Sara", "Theo", "Layla", "Ivan", "Priya", "Noah", "Zara"];
const lastNames = ["Park", "Okafor", "Singh", "Reyes", "Tanaka", "Müller", "Bauer", "Costa", "Ahmed", "Novak", "Holm", "Khan"];
const departments = ["Operations", "Security", "Front Desk", "Engineering", "Housekeeping", "Medical", "Retail", "Admin", "IT"];

function pick<T>(arr: T[], i: number) { return arr[i % arr.length]; }

export async function seedIfEmpty() {
  const count = await db.buildings.count();
  if (count > 0) return;

  const now = Date.now();

  for (let bi = 0; bi < buildingSeeds.length; bi++) {
    const b = buildingSeeds[bi];
    const buildingId = await db.buildings.add({ ...b, createdAt: now - bi * 86400000 });

    const floorCount = Math.min(b.floors, 4); // cap floors per building for performance, total ~20
    for (let lvl = 1; lvl <= floorCount; lvl++) {
      const totalExits = lvl === 1 ? 4 : 3;
      const blocked = lvl === 2 && bi === 0 ? 1 : 0;
      const floorId = await db.floors.add({
        buildingId,
        level: lvl,
        name: lvl === 1 ? "Ground Floor" : `Floor ${lvl}`,
        totalExits,
        availableExits: totalExits - blocked,
        blockedExits: blocked,
        elevatorWorking: !(bi === 2 && lvl === 3),
      });

      const types = zonesForBuilding(b.type);
      const zoneCount = 5;
      for (let zi = 0; zi < zoneCount; zi++) {
        const ztype = pick(types, zi);
        const rect = zoneRects[zi];
        await db.zones.add({
          buildingId,
          floorId,
          zoneId: `B${bi + 1}-F${lvl}-Z${zi + 1}`,
          name: `${ztype} ${zi + 1}`,
          type: ztype,
          area: 60 + zi * 25,
          occupancy: Math.floor(8 + Math.random() * 35),
          specialNeeds: Math.random() < 0.3 ? Math.floor(Math.random() * 4) : 0,
          ...rect,
        });
      }
    }
  }

  // 100 personnel
  for (let i = 0; i < 100; i++) {
    await db.personnel.add({
      employeeId: `EMP-${1000 + i}`,
      name: `${pick(firstNames, i)} ${pick(lastNames, i * 3)}`,
      age: 22 + (i % 40),
      gender: i % 3 === 0 ? "F" : i % 3 === 1 ? "M" : "Other",
      department: pick(departments, i),
      cardId: `CARD-${4000 + i}`,
      deviceId: `DEV-${7000 + i}`,
      specialNeeds: i % 11 === 0,
      emergencyContact: `+1 555-0${100 + (i % 900)}`,
    });
  }

  // 10 historical incidents
  const allZones = await db.zones.toArray();
  for (let i = 0; i < 10; i++) {
    const z = allZones[(i * 7) % allZones.length];
    const started = now - (i + 1) * 86400000 * 3;
    await db.incidents.add({
      incidentId: `INC-${2024100 + i}`,
      buildingId: z.buildingId,
      floorId: z.floorId,
      zoneId: z.id!,
      sensorId: `SNS-${300 + i}`,
      startedAt: started,
      resolvedAt: started + 3600000 * (1 + (i % 4)),
      status: "resolved",
    });
  }

  await db.activity.bulkAdd([
    { timestamp: now - 3600000, kind: "system", message: "WB-FDVA system initialized with seed data" },
    { timestamp: now - 7200000, kind: "building", message: "Crestline Galleria added to registry" },
    { timestamp: now - 10800000, kind: "occupancy", message: "Occupancy refreshed for Saint Clare Medical Center" },
  ]);

  // Seed Infosystem portfolio
  await seedInfosystemBuildings();
}

interface City {
  name: string;
  lat: number;
  lng: number;
  count: number;
}

const CITIES: City[] = [
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946, count: 4 },
  { name: "Pune", lat: 18.5204, lng: 73.8567, count: 3 },
  { name: "Hyderabad", lat: 17.3850, lng: 78.4867, count: 3 },
  { name: "Chennai", lat: 13.0827, lng: 80.2707, count: 3 },
  { name: "Mumbai", lat: 19.0760, lng: 72.8777, count: 3 },
  { name: "Noida", lat: 28.5355, lng: 77.3910, count: 2 },
  { name: "Gurugram", lat: 28.4595, lng: 77.0266, count: 2 },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639, count: 2 },
  { name: "Ahmedabad", lat: 23.0225, lng: 72.5714, count: 2 },
  { name: "Jaipur", lat: 26.9124, lng: 75.7873, count: 2 },
  { name: "Kochi", lat: 9.9312, lng: 76.2673, count: 2 },
  { name: "Coimbatore", lat: 11.0168, lng: 76.9558, count: 2 }
];

export async function seedInfosystemBuildings() {
  const allBuildings = await db.buildings.toArray();
  const count = allBuildings.filter(b => b.ownerName === "Infosystem").length;
  if (count > 0) return; // already seeded

  const now = Date.now();
  let buildingIndex = 1;

  for (const city of CITIES) {
    for (let c = 0; c < city.count; c++) {
      const floors = 3 + (buildingIndex % 7); // 3 to 9 floors
      const totalArea = 8000 + (buildingIndex % 5) * 6000; // 8000 to 32000
      
      const offsetLat = (c - (city.count - 1) / 2) * 0.015 + (Math.random() - 0.5) * 0.003;
      const offsetLng = (c - (city.count - 1) / 2) * 0.015 + (Math.random() - 0.5) * 0.003;

      const type: BuildingType = buildingIndex % 10 === 0 ? "Data Center" : buildingIndex % 7 === 0 ? "Mixed Use" : "Office";
      const bName = `Infosystem Campus Block ${String.fromCharCode(65 + c)}${buildingIndex}`;
      const bAddress = `Sector ${12 + c}, Tech Zone, ${city.name}`;

      const buildingId = await db.buildings.add({
        name: bName,
        ownerName: "Infosystem",
        type,
        floors,
        totalArea,
        constructionType: "Type I — Non-combustible",
        fireResistanceRating: buildingIndex % 3 === 0 ? "3-hour" : "2-hour",
        address: bAddress,
        city: city.name,
        state: city.name === "Noida" ? "Uttar Pradesh" : city.name === "Gurugram" ? "Haryana" : "State",
        country: "India",
        latitude: city.lat + offsetLat,
        longitude: city.lng + offsetLng,
        createdAt: now - buildingIndex * 3600000,
      });

      // Seed floors and zones for each building
      const floorCount = Math.min(floors, 3); // cap floors per building for speed
      for (let lvl = 1; lvl <= floorCount; lvl++) {
        const totalExits = lvl === 1 ? 4 : 3;
        const floorId = await db.floors.add({
          buildingId,
          level: lvl,
          name: lvl === 1 ? "Ground Floor" : `Floor ${lvl}`,
          totalExits,
          availableExits: totalExits,
          blockedExits: 0,
          elevatorWorking: true,
        });

        // Add 3 zones per floor
        const zones = ["Lobby", "Office", "Corridor"];
        for (let zi = 0; zi < zones.length; zi++) {
          const ztype = zones[zi] as ZoneType;
          await db.zones.add({
            buildingId,
            floorId,
            zoneId: `IS-${buildingIndex}-F${lvl}-Z${zi + 1}`,
            name: `${ztype} ${zi + 1}`,
            type: ztype,
            area: 80 + zi * 30,
            occupancy: Math.floor(10 + Math.random() * 40),
            specialNeeds: Math.random() < 0.2 ? Math.floor(Math.random() * 3) : 0,
            x: 10 + zi * 30,
            y: 20,
            w: 25,
            h: 60,
          });
        }
      }

      buildingIndex++;
    }
  }

  await logActivity("building", `Seeded 30 Infosystem buildings across 12 cities.`);
}
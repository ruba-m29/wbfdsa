import { create } from "zustand";

export type UserRole = "Admin" | "Incident Commander" | "Responder";

interface AppState {
  role: UserRole;
  setRole: (r: UserRole) => void;
  activeBuildingId: number | null;
  setActiveBuilding: (id: number | null) => void;
}

export const useApp = create<AppState>((set) => ({
  role: "Admin",
  setRole: (role) => set({ role }),
  activeBuildingId: null,
  setActiveBuilding: (id) => set({ activeBuildingId: id }),
}));

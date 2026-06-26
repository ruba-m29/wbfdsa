import { useState, useEffect } from "react";
import type { FloorData, FloorStatistics, FloorDetails } from "@/types/floor";
import { getActiveService } from "@/services/dbSync";
import { toast } from "sonner";

export function useFloorData(buildingId: string | null, level: number | null) {
  const [floorData, setFloorData] = useState<FloorData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!buildingId || level === null) {
      setFloorData(null);
      return;
    }

    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const service = getActiveService();
        const data = await service.fetchFloorData(buildingId, level);
        if (isMounted) {
          setFloorData(data);
        }
      } catch (err: any) {
        console.error("Failed to load floor detailed data:", err);
        if (isMounted) {
          setError(err.message || "Failed to load floor detailed data");
          toast.error("Failed to load floor data from active service.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [buildingId, level]);

  const updateFloorStats = async (updatedStats: Partial<FloorStatistics>, updatedDetails?: Partial<FloorDetails>) => {
    if (!buildingId || level === null || !floorData) return;

    try {
      const service = getActiveService();
      const updatedData: FloorData = {
        ...floorData,
        stats: {
          ...floorData.stats,
          ...updatedStats
        },
        details: {
          ...floorData.details,
          ...(updatedDetails || {})
        }
      };

      // Ensure currentOccupancy and maxOccupancy sync in details if they exist in stats
      if (updatedStats.currentOccupancy !== undefined) {
        updatedData.details.currentOccupancy = updatedStats.currentOccupancy;
      }
      if (updatedStats.maxOccupancy !== undefined) {
        updatedData.details.maxOccupancy = updatedStats.maxOccupancy;
      }

      const saved = await service.saveFloorData(buildingId, level, updatedData);
      setFloorData(saved);
      toast.success("Floor statistics updated successfully.");
      return saved;
    } catch (err) {
      console.error("Failed to update floor statistics:", err);
      toast.error("Failed to save updates to active service.");
      throw err;
    }
  };

  const uploadCADFile = async (file: File) => {
    if (!buildingId || level === null || !floorData) return;

    return new Promise<FloorData>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileUrl = e.target?.result as string;
        const extension = file.name.split(".").pop()?.toLowerCase() || "";
        
        try {
          const service = getActiveService();
          const updatedData: FloorData = {
            ...floorData,
            details: {
              ...floorData.details,
              revisionNumber: `v${(parseFloat(floorData.details.revisionNumber.replace("v", "")) + 0.1).toFixed(1)}`,
              uploadDate: new Date().toISOString().split("T")[0]
            },
            drawing: {
              name: file.name,
              url: fileUrl,
              type: extension as any,
              size: file.size
            }
          };

          const saved = await service.saveFloorData(buildingId, level, updatedData);
          setFloorData(saved);
          toast.success(`CAD file "${file.name}" uploaded successfully!`);
          resolve(saved);
        } catch (err) {
          console.error("Failed to upload drawing:", err);
          toast.error("Failed to save uploaded drawing on active service.");
          reject(err);
        }
      };

      reader.onerror = () => {
        toast.error("Failed to read CAD file.");
        reject(new Error("File reading error"));
      };

      // Read as DataURL (base64) so it works in iframes and img tags natively and persists in storage
      reader.readAsDataURL(file);
    });
  };

  return {
    floorData,
    loading,
    error,
    updateFloorStats,
    uploadCADFile
  };
}

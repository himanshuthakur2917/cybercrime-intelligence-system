import axios, { AxiosResponse } from "axios";
import {
  MapDataResponse,
  PatternResponse,
  VictimMappingResponse,
  TrajectoryResponse,
  PredictionResponse,
} from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor to handle nested data structure
axiosInstance.interceptors.response.use(
  (response) => {
    if (response.data && response.data.data) {
      return response.data;
    }
    return response;
  },
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  },
);

// Helper to extract data property directly
const getData = async <T>(promise: Promise<AxiosResponse<T>>): Promise<T> => {
  const result = await promise;
  // If result has config, it's a full AxiosResponse. If not, it's already unwrapped data.
  const data = (result as any).data;

  // Return the inner data property if it exists, otherwise the whole result
  return (data?.data ?? data ?? result) as T;
};

export const api = {
  upload: (investigationId: string, data: unknown) =>
    getData(
      axiosInstance.post(`/investigations/${investigationId}/upload`, data),
    ),

  getMapData: (investigationId: string) =>
    getData<MapDataResponse>(
      axiosInstance.get(`/geolocation/${investigationId}/map-data`),
    ),

  getPatterns: (investigationId: string) =>
    getData<PatternResponse>(
      axiosInstance.get(`/victim-mapping/${investigationId}/patterns`),
    ),

  getVictimMapping: (investigationId: string) =>
    getData<VictimMappingResponse>(
      axiosInstance.get(`/victim-mapping/${investigationId}`),
    ),

  getTrajectory: (investigationId: string, suspectId: string) =>
    getData<TrajectoryResponse>(
      axiosInstance.get(
        `/victim-mapping/${investigationId}/trajectory/${suspectId}`,
      ),
    ),

  getPrediction: (investigationId: string, suspectId: string) =>
    getData<PredictionResponse>(
      axiosInstance.get(
        `/geolocation/${investigationId}/trajectory/${suspectId}`,
      ),
    ),

  getInvestigations: () =>
    getData<{ id: string; name: string; status: string }[]>(
      axiosInstance.post("/investigations/list"),
    ),

  // Victim-Caller Mapping (Hybrid Architecture)
  getVictimCallerMap: (
    investigationId: string,
    victimId: string,
    rangeKm?: number,
  ) =>
    getData(
      axiosInstance.get(
        `/geolocation/${investigationId}/victim-caller-map/${victimId}`,
        { params: rangeKm ? { rangeKm } : {} },
      ),
    ),

  // Triangulate Suspect Location
  triangulateSuspectLocation: (investigationId: string, suspectId: string) =>
    getData(
      axiosInstance.get(
        `/geolocation/${investigationId}/triangulate/${suspectId}`,
      ),
    ),

  // Get suspects who called or contacted a specific victim
  getSuspectsForVictim: (investigationId: string, victimPhone: string) =>
    getData(
      axiosInstance.get(
        `/victim-mapping/${investigationId}/victim/${victimPhone}/suspects`,
      ),
    ),

  // Get Markers in Range
  getMarkersInRange: (
    investigationId: string,
    centerLat: number,
    centerLon: number,
    rangeKm: number,
  ) =>
    getData(
      axiosInstance.get(`/geolocation/${investigationId}/markers-in-range`, {
        params: { centerLat, centerLon, rangeKm },
      }),
    ),

  // Sync cell towers from Supabase to Neo4j
  syncTowers: (investigationId: string) =>
    getData(
      axiosInstance.post(`/investigations/${investigationId}/sync-towers`),
    ),
  getTrajectories: (investigationId: string) =>
    getData(
      axiosInstance.get(`/investigations/${investigationId}/trajectories`),
    ),
  getNetworkData: (investigationId: string) =>
    getData(axiosInstance.post(`/investigations/${investigationId}/analyze`)),
  getCallPatterns: (investigationId: string) =>
    getData(axiosInstance.post(`/investigations/${investigationId}/patterns`)),
};

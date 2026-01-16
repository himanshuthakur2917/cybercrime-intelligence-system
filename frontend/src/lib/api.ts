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
  }
);

// Helper to extract data property directly
const getData = async <T>(promise: Promise<AxiosResponse<T>>): Promise<T> => {
  const response = await promise;
  // @ts-ignore - Dynamic access to data wrapper if present
  return response.data?.data ?? response.data;
};

export const api = {
  upload: (investigationId: string, data: unknown) =>
    getData(
      axiosInstance.post(`/investigations/${investigationId}/upload`, data)
    ),

  getMapData: (investigationId: string) =>
    getData<MapDataResponse>(
      axiosInstance.get(`/geolocation/${investigationId}/map-data`)
    ),

  getPatterns: (investigationId: string) =>
    getData<PatternResponse>(
      axiosInstance.get(`/victim-mapping/${investigationId}/patterns`)
    ),

  getVictimMapping: (investigationId: string) =>
    getData<VictimMappingResponse>(
      axiosInstance.get(`/victim-mapping/${investigationId}`)
    ),

  getTrajectory: (investigationId: string, suspectId: string) =>
    getData<TrajectoryResponse>(
      axiosInstance.get(
        `/victim-mapping/${investigationId}/trajectory/${suspectId}`
      )
    ),

  getPrediction: (investigationId: string, suspectId: string) =>
    getData<PredictionResponse>(
      axiosInstance.get(
        `/geolocation/${investigationId}/trajectory/${suspectId}`
      )
    ),

  getInvestigations: () =>
    getData<{ id: string; name: string; status: string }[]>(
      axiosInstance.post("/investigations/list")
    ),
};

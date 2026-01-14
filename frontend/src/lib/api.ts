import axios, { AxiosResponse } from "axios";

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
    // If backend returns { success: true, data: ... }, extract data
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
const getData = async <T>(promise: Promise<AxiosResponse<any>>): Promise<T> => {
  const response = await promise;
  return response.data?.data ?? response.data;
};

export const api = {
  upload: (investigationId: string, data: any) =>
    getData(
      axiosInstance.post(`/investigations/${investigationId}/upload`, data)
    ),

  getMapData: (investigationId: string) =>
    getData<any>(axiosInstance.get(`/geolocation/${investigationId}/map-data`)),

  getPatterns: (investigationId: string) =>
    getData<any>(
      axiosInstance.get(`/victim-mapping/${investigationId}/patterns`)
    ),

  getVictimMapping: (investigationId: string) =>
    getData<any>(axiosInstance.get(`/victim-mapping/${investigationId}`)),

  getTrajectory: (investigationId: string, suspectId: string) =>
    getData<any>(
      axiosInstance.get(
        `/victim-mapping/${investigationId}/trajectory/${suspectId}`
      )
    ),

  getPrediction: (investigationId: string, suspectId: string) =>
    getData<any>(
      axiosInstance.get(
        `/geolocation/${investigationId}/trajectory/${suspectId}`
      )
    ),
};

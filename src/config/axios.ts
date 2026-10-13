import axios from "axios";
import type { AxiosError } from "axios";
import { env } from "@/config/env";
import type { ApiErrorResponse } from "@/types/api";
import { storage } from "@/utils/storage";

const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 15_000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = storage.getAccessToken();

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401) {
      storage.removeAccessToken();
    }

    return Promise.reject(error);
  },
);

export { apiClient };

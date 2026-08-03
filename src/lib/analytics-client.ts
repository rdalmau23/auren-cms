import { getSession } from "next-auth/react";

const getAnalyticsBaseUrl = () => {
  if (typeof window !== "undefined") {
    return "";
  }
  return process.env.NEXT_PUBLIC_ANALYTICS_URL || "http://localhost:8001";
};

const ANALYTICS_BASE_URL = getAnalyticsBaseUrl();

interface FetchOptions extends RequestInit {
  token?: string;
}

class AnalyticsClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    let { token, headers: customHeaders, ...fetchOptions } = options;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...customHeaders,
    };

    if (!token && typeof window !== "undefined") {
      const session = await getSession();
      if (session && (session as any).accessToken) {
        token = (session as any).accessToken;
      }
    }

    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Analytics request failed" }));
      throw new Error(error.detail || error.message || `HTTP ${response.status}`);
    }

    if (response.status === 204) return {} as T;
    return response.json();
  }

  get<T>(endpoint: string, options?: FetchOptions) {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }
}

export const analyticsApi = new AnalyticsClient(ANALYTICS_BASE_URL);

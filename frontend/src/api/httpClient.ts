// Real HTTP implementation of ApiClient that communicates with the DriftSmith backend.
// Injects Authorization: Bearer token, handles JSON formatting, and catches 401s to trigger logout.

import { ApiClient } from './apiClient';
import {
  User,
  LoginRequest,
  LoginResponse,
  Run,
  RunDetail,
  LearnedPattern,
  HealthResponse,
  TriggerDriftRequest,
  TriggerDriftResponse,
  WebhookDriftRequest,
  ApproveResponse,
  ApiErrorDetail,
} from './types';
import { tokenStorage } from '@/auth/tokenStorage';
import { config } from '@/config/env';

export class HttpClient implements ApiClient {
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${config.apiUrl}${path}`;
    const token = tokenStorage.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        tokenStorage.clear();
        // Redirect to login if in a browser window environment
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
        throw new Error('Authentication expired. Please sign in again.');
      }

      if (!response.ok) {
        let errorMessage = `API request failed: ${response.statusText}`;
        try {
          const errBody = (await response.json()) as ApiErrorDetail;
          if (errBody.detail) {
            errorMessage = errBody.detail;
          }
        } catch {
          // Response body was not JSON
        }
        const error = new Error(errorMessage);
        (error as unknown as { status: number }).status = response.status;
        throw error;
      }

      return (await response.json()) as T;
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error(String(err));
    }
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const data = await this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    tokenStorage.setToken(data.access_token);
    tokenStorage.setUser(data.user);
    return data;
  }

  async getMe(): Promise<User> {
    return this.request<User>('/api/auth/me', {
      method: 'GET',
    });
  }

  async getRuns(): Promise<Run[]> {
    return this.request<Run[]>('/api/runs', {
      method: 'GET',
    });
  }

  async getRun(id: string): Promise<RunDetail> {
    return this.request<RunDetail>(`/api/runs/${encodeURIComponent(id)}`, {
      method: 'GET',
    });
  }

  async approveRun(id: string): Promise<ApproveResponse> {
    return this.request<ApproveResponse>(`/api/runs/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
    });
  }

  async getPatterns(): Promise<LearnedPattern[]> {
    return this.request<LearnedPattern[]>('/api/patterns', {
      method: 'GET',
    });
  }

  async triggerDrift(request: TriggerDriftRequest): Promise<TriggerDriftResponse> {
    return this.request<TriggerDriftResponse>('/api/runs/simulate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async triggerWebhook(request: WebhookDriftRequest): Promise<TriggerDriftResponse> {
    return this.request<TriggerDriftResponse>('/api/v1/webhooks/drift', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/api/health', {
      method: 'GET',
    });
  }
}

export const httpClient = new HttpClient();

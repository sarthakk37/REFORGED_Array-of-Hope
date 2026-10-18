// DriftSmith Central Environment Configuration
// This is the ONLY file where import.meta.env is accessed in the frontend codebase.

export interface AppConfig {
  apiUrl: string;
  useMock: boolean;
  isDev: boolean;
}

const rawApiUrl = import.meta.env.VITE_API_URL;
const rawUseMock = import.meta.env.VITE_USE_MOCK;

export const config: AppConfig = {
  apiUrl: typeof rawApiUrl === 'string' && rawApiUrl.trim() !== '' ? rawApiUrl.trim() : 'http://localhost:8000',
  // Default to true for mock mode when not explicitly set to false
  useMock: rawUseMock === undefined || rawUseMock === '' ? true : rawUseMock === 'true',
  isDev: Boolean(import.meta.env.DEV),
};

// DriftSmith Central Environment Configuration.
// The ONLY module where import.meta.env is accessed in the frontend codebase.

export interface AppConfig {
  apiUrl: string;
  useMock: boolean;
  isDev: boolean;
}

const rawApiUrl = import.meta.env.VITE_API_URL;
const rawUseMock = import.meta.env.VITE_USE_MOCK;

export const config: AppConfig = {
  apiUrl:
    typeof rawApiUrl === 'string' && rawApiUrl.trim() !== ''
      ? rawApiUrl.trim()
      : 'http://localhost:8000',
  useMock: rawUseMock === undefined || rawUseMock === '' ? true : rawUseMock === 'true',
  isDev: Boolean(import.meta.env.DEV),
};

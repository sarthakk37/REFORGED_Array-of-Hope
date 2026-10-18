// DriftSmith Central Environment Configuration.
// The ONLY module where import.meta.env is accessed in the frontend codebase.

export type NarrationMode = 'speech' | 'audio' | 'off';

export interface AppConfig {
  apiUrl: string;
  useMock: boolean;
  isDev: boolean;
  narration: NarrationMode;
}

const rawApiUrl = import.meta.env.VITE_API_URL;
const rawUseMock = import.meta.env.VITE_USE_MOCK;
const rawNarration = import.meta.env.VITE_NARRATION as string | undefined;

export const config: AppConfig = {
  apiUrl:
    typeof rawApiUrl === 'string' && rawApiUrl.trim() !== ''
      ? rawApiUrl.trim()
      : 'http://localhost:8000',
  useMock: rawUseMock === undefined || rawUseMock === '' ? true : rawUseMock === 'true',
  isDev: Boolean(import.meta.env.DEV),
  narration:
    rawNarration === 'audio' || rawNarration === 'off' || rawNarration === 'speech'
      ? (rawNarration as NarrationMode)
      : 'speech',
};

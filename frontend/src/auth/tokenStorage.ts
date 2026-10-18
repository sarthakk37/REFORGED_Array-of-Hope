// Token persistence helper using sessionStorage for session-scoped auth tokens.
// Attached automatically to outgoing httpClient requests.

const TOKEN_KEY = 'driftsmith_access_token';
const USER_KEY = 'driftsmith_user';

export const tokenStorage = {
  getToken(): string | null {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setToken(token: string): void {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.error('Failed to save access token in sessionStorage', e);
    }
  },

  getUser<T>(): T | null {
    try {
      const data = sessionStorage.getItem(USER_KEY);
      return data ? (JSON.parse(data) as T) : null;
    } catch {
      return null;
    }
  },

  setUser<T>(user: T): void {
    try {
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save user in sessionStorage', e);
    }
  },

  clear(): void {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error('Failed to clear sessionStorage', e);
    }
  },
};

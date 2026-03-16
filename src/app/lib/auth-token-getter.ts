/**
 * Global getter for the current session token, set by AuthProvider.
 * apiFetch uses this first when requireAuth is true so all pages use the same token as the UI.
 */
let getToken: () => string | null = () => null;

export function getCurrentSessionToken(): string | null {
  return getToken();
}

export function setAuthTokenGetter(fn: () => string | null): void {
  getToken = fn;
}

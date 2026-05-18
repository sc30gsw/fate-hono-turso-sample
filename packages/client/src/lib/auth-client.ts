import { createAuthClient } from "better-auth/react";

const appBaseUrl = import.meta.env.VITE_APP_BASE_URL;

if (!appBaseUrl) {
  throw new Error("VITE_APP_BASE_URL is required");
}

export const authClient = createAuthClient({ baseURL: `${appBaseUrl}/api/auth` });

export const { signIn, signOut, signUp, useSession } = authClient;

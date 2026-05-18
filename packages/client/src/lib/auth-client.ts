import { requireEnv } from "@app/shared/env";
import { createAuthClient } from "better-auth/react";

const appBaseUrl = requireEnv("VITE_APP_BASE_URL", import.meta.env.VITE_APP_BASE_URL);

export const authClient = createAuthClient({ baseURL: `${appBaseUrl}/api/auth` });

export const { signIn, signOut, signUp, useSession } = authClient;

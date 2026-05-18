import { requireEnv } from "@app/shared/env";
import { createFateClient } from "react-fate/client";

const appBaseUrl = requireEnv("VITE_APP_BASE_URL", import.meta.env.VITE_APP_BASE_URL);

export const fateClient = createFateClient({
  url: `${appBaseUrl}/fate`,
  liveUrl: `${appBaseUrl}/fate/live`,
  fetch: (input, init) => fetch(input, { ...init, credentials: "include" }),
});

import { auth } from "@app/auth";
import { authSchema, db, schema as domainSchema } from "@app/db";
import type { UserRow } from "@app/db/auth-schema";
import { createFateServer } from "@nkzw/fate/server";
import { createDrizzleSourceAdapter } from "@nkzw/fate/server/drizzle";

import { liveEventBus } from "./live";
import { mutations } from "./mutations";
import { Root } from "./roots";

export type FateContext = { sessionUser: Pick<UserRow, "id"> | undefined };

const sources = createDrizzleSourceAdapter<FateContext>({
  db,
  schema: { ...authSchema, ...domainSchema },
  views: Root,
});

function hasRawRequest(value: unknown): value is { req: { raw: Request } } {
  if (typeof value !== "object" || value === null || !("req" in value)) {
    return false;
  }

  const { req } = value;

  return typeof req === "object" && req !== null && "raw" in req;
}

function readAdapterHeaders(adapterContext: unknown) {
  if (hasRawRequest(adapterContext)) {
    return adapterContext.req.raw.headers;
  }

  return new Headers();
}

export const fate = createFateServer<FateContext>({
  context: async ({ adapterContext }) => {
    const session = await auth.api.getSession({ headers: readAdapterHeaders(adapterContext) });
    return { sessionUser: session?.user ?? undefined };
  },
  live: liveEventBus,
  mutations,
  roots: Root,
  sources,
});

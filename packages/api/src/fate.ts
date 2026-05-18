// ? これを元に client.generated.ts を生成する
import { auth } from "@app/auth";
import { authSchema, db, schema as domainSchema } from "@app/db";
import type { UserRow } from "@app/db/auth-schema";
import { createFateServer } from "@nkzw/fate/server";
import { createDrizzleSourceAdapter } from "@nkzw/fate/server/drizzle";

import { Root } from "./features/posts/roots";
import { liveEventBus } from "./live";
import { mutations } from "./mutations";

export { Root };
export type { User } from "./features/auth/views";
export type { Comment } from "./features/comments/views";
export type { Post } from "./features/posts/views";

export type FateContext = {
  sessionUser:
    | {
        id: UserRow["id"];
        image?: UserRow["image"] | undefined;
        name: UserRow["name"];
      }
    | undefined;
};

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
    return {
      sessionUser: session?.user
        ? {
            id: session.user.id,
            image: session.user.image,
            name: session.user.name,
          }
        : undefined,
    };
  },
  live: liveEventBus,
  mutations,
  roots: Root,
  sources,
});

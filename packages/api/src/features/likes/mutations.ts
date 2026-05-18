import { db, like } from "@app/db";
import { and, eq } from "drizzle-orm";

import type { FateContext } from "../../fate";
import { liveEventBus } from "../../live";
import { requireUserId } from "../auth/utils/require-user-id";
import { type LikePostInput, likePostInput } from "./schemas/likes-schema";

export const likePost = {
  type: "Post",
  input: likePostInput,
  resolve: async ({ ctx, input }: { ctx: FateContext; input: LikePostInput }) => {
    const userId = requireUserId(ctx);

    const inserted = await db
      .insert(like)
      .values({ postId: input.postId, userId, createdAt: new Date() })
      .onConflictDoNothing({ target: [like.postId, like.userId] })
      .returning();

    if (inserted.length === 0) {
      await db.delete(like).where(and(eq(like.postId, input.postId), eq(like.userId, userId)));
    }

    liveEventBus.update("Post", input.postId);
    return { id: input.postId };
  },
} as const;

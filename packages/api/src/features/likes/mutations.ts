import { db, like } from "@app/db";
import { and, eq } from "drizzle-orm";

import type { FateContext } from "~/fate";
import { requireUserId } from "~/features/auth/utils/require-user-id";
import { type LikePostInput, likePostInput } from "~/features/likes/schemas/likes-schema";
import { liveEventBus } from "~/live";

export const likePost = {
  input: likePostInput,
  type: "Post",
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

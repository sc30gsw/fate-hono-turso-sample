import { db, like } from "@app/db";
import { and, count, eq } from "drizzle-orm";

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

    const [likeCountRow] = await db
      .select({ likeCount: count() })
      .from(like)
      .where(eq(like.postId, input.postId));

    const likedByViewer = inserted.length > 0;

    liveEventBus.update("Post", input.postId, { changed: ["likeCount", "likedByViewer"] });
    return { id: input.postId, likedByViewer, likeCount: likeCountRow?.likeCount ?? 0 };
  },
} as const;

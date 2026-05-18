import { comment, db, like, post } from "@app/db";
import {
  addCommentInput,
  type AddCommentInput,
  createPostInput,
  type CreatePostInput,
  likePostInput,
  type LikePostInput,
} from "@app/shared/post-schemas";
import type { MutationResult } from "@nkzw/fate";
import { and, eq } from "drizzle-orm";

import type { FateContext } from "./fate";
import { liveEventBus } from "./live";

function requireUserId(ctx: FateContext) {
  if (!ctx.sessionUser) {
    throw new Error("Sign-in required.");
  }

  return ctx.sessionUser.id;
}

export const mutations = {
  createPost: {
    input: createPostInput,
    type: "Post",
    resolve: async ({ ctx, input }: { ctx: FateContext; input: CreatePostInput }) => {
      const authorId = requireUserId(ctx);
      const id = crypto.randomUUID();

      await db.insert(post).values({
        id,
        authorId,
        title: input.title,
        content: input.content,
        createdAt: new Date(),
      });

      liveEventBus.update("Post", id);

      return { id };
    },
  },
  addComment: {
    input: addCommentInput,
    type: "Comment",
    resolve: async ({ ctx, input }: { ctx: FateContext; input: AddCommentInput }) => {
      const authorId = requireUserId(ctx);
      const id = crypto.randomUUID();

      await db.insert(comment).values({
        id,
        postId: input.postId,
        authorId,
        content: input.content,
        createdAt: new Date(),
      });

      liveEventBus.update("Comment", id);
      liveEventBus.update("Post", input.postId);

      return { id };
    },
  },
  likePost: {
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
  },
} as const satisfies Record<string, MutationResult<any>>;

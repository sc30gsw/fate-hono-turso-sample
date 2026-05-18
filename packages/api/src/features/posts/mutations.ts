import { db, post } from "@app/db";

import type { FateContext } from "~/fate";
import { requireUserId } from "~/features/auth/utils/require-user-id";
import { type CreatePostInput, createPostInput } from "~/features/posts/schemas/posts-schema";
import { liveEventBus } from "~/live";

export const createPost = {
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
} as const;

import { db, post } from "@app/db";
import { FateRequestError } from "@nkzw/fate/server";
import { and, eq } from "drizzle-orm";

import type { FateContext } from "../../fate";
import { liveEventBus } from "../../live";
import { requireUserId } from "../auth/utils/require-user-id";
import {
  type CreatePostInput,
  createPostInput,
  type DeletePostInput,
  deletePostInput,
} from "./schemas/posts-schema";

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
    liveEventBus.connection("posts").prependNode("Post", id);

    return { id };
  },
} as const;

export const deletePost = {
  input: deletePostInput,
  type: "Post",
  resolve: async ({ ctx, input }: { ctx: FateContext; input: DeletePostInput }) => {
    const authorId = requireUserId(ctx);
    const deleted = await db
      .delete(post)
      .where(and(eq(post.id, input.id), eq(post.authorId, authorId)))
      .returning({ id: post.id });

    if (deleted.length === 0) {
      throw new FateRequestError("NOT_FOUND", "Post not found.", { status: 404 });
    }

    liveEventBus.delete("Post", input.id);
    liveEventBus.connection("posts").deleteEdge("Post", input.id);

    return { id: input.id };
  },
} as const;

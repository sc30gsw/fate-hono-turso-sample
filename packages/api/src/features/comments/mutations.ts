import { comment, db } from "@app/db";

import type { FateContext } from "../../fate";
import { liveEventBus } from "../../live";
import { requireUserId } from "../auth/utils/require-user-id";
import { type AddCommentInput, addCommentInput } from "./schemas/comments-schema";

export const addComment = {
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
} as const;

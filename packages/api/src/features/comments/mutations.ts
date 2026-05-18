import { comment, db } from "@app/db";
import { FateRequestError } from "@nkzw/fate/server";
import { and, eq } from "drizzle-orm";

import type { FateContext } from "../../fate";
import { liveEventBus } from "../../live";
import { requireUserId } from "../auth/utils/require-user-id";
import {
  type AddCommentInput,
  addCommentInput,
  type DeleteCommentInput,
  deleteCommentInput,
} from "./schemas/comments-schema";

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
    liveEventBus.update("Post", input.postId, { changed: ["comments", "commentCount"] });
    liveEventBus.connection("Post.comments", { id: input.postId }).appendNode("Comment", id);

    return { id };
  },
} as const;

export const deleteComment = {
  input: deleteCommentInput,
  type: "Comment",
  resolve: async ({ ctx, input }: { ctx: FateContext; input: DeleteCommentInput }) => {
    const authorId = requireUserId(ctx);
    const deleted = await db
      .delete(comment)
      .where(and(eq(comment.id, input.id), eq(comment.authorId, authorId)))
      .returning({ id: comment.id, postId: comment.postId });

    const deletedComment = deleted[0];
    if (!deletedComment) {
      throw new FateRequestError("NOT_FOUND", "Comment not found.", { status: 404 });
    }

    liveEventBus.delete("Comment", input.id);
    liveEventBus.update("Post", deletedComment.postId, { changed: ["comments", "commentCount"] });
    liveEventBus
      .connection("Post.comments", { id: deletedComment.postId })
      .deleteEdge("Comment", input.id);

    return { id: input.id };
  },
} as const;

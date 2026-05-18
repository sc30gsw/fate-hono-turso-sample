import { db, like, type PostRow } from "@app/db";
import { computed, count, dataView, type Entity, list } from "@nkzw/fate/server";
import { and, count as sqlCount, eq } from "drizzle-orm";

import type { FateContext } from "../../fate";
import { type User, userDataView } from "../auth/views";
import { commentDataView, type Comment } from "../comments/views";

const basePost = {
  id: true,
  title: true,
  content: true,
  createdAt: true,
  author: userDataView,
  commentCount: computed<PostRow, number>({
    select: { count: count("comments") },
    resolve: (_item, deps) => (deps.count as number | undefined) ?? 0,
  }),
  likeCount: computed<PostRow, number>({
    resolve: async (item) => {
      const [row] = await db
        .select({ count: sqlCount() })
        .from(like)
        .where(eq(like.postId, item.id));

      return row?.count ?? 0;
    },
  }),
  likedByViewer: computed<PostRow, boolean, FateContext>({
    resolve: async (item, _deps, ctx) => {
      if (!ctx?.sessionUser) {
        return false;
      }

      const [row] = await db
        .select({ count: sqlCount() })
        .from(like)
        .where(and(eq(like.postId, item.id), eq(like.userId, ctx.sessionUser.id)));

      return (row?.count ?? 0) > 0;
    },
  }),
} as const satisfies Parameters<ReturnType<typeof dataView<PostRow>>>[0];

export const postSummaryDataView = dataView<PostRow>("Post")(basePost);

export const postDataView = dataView<PostRow>("Post")({
  ...basePost,
  comments: list(commentDataView, { orderBy: { createdAt: "asc", id: "asc" } }),
});

export type Post = Entity<typeof postDataView, "Post", { author: User; comments: Array<Comment> }>;

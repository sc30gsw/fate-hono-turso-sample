import type { PostRow } from "@app/db";
import { dataView, type Entity, list } from "@nkzw/fate/server";

import { type User, userDataView } from "~/features/auth/views";
import { commentDataView, type Comment } from "~/features/comments/views";

const basePost = {
  id: true,
  title: true,
  content: true,
  createdAt: true,
  author: userDataView,
} as const satisfies Parameters<ReturnType<typeof dataView<PostRow>>>[0];

export const postSummaryDataView = dataView<PostRow>("Post")(basePost);

export const postDataView = dataView<PostRow>("Post")({
  ...basePost,
  comments: list(commentDataView, { orderBy: { createdAt: "asc", id: "asc" } }),
});

export type Post = Entity<typeof postDataView, "Post", { author: User; comments: Array<Comment> }>;

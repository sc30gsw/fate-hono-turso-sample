import type { CommentRow, PostRow, UserRow } from "@app/db";
import { dataView, type Entity, list } from "@nkzw/fate/server";

const userDataView = dataView<UserRow>("User")({
  id: true,
  name: true,
  image: true,
});

const basePost = {
  id: true,
  title: true,
  content: true,
  createdAt: true,
  author: userDataView,
} as const satisfies Parameters<ReturnType<typeof dataView<PostRow>>>[0];

export const postSummaryDataView = dataView<PostRow>("Post")(basePost);

export const commentDataView = dataView<CommentRow>("Comment")({
  id: true,
  content: true,
  createdAt: true,
  author: userDataView,
  post: postSummaryDataView,
});

export const postDataView = dataView<PostRow>("Post")({
  ...basePost,
  comments: list(commentDataView, { orderBy: { createdAt: "asc", id: "asc" } }),
});

export type User = Entity<typeof userDataView, "User">;
export type Comment = Entity<typeof commentDataView, "Comment", { author: User; post: Post }>;
export type Post = Entity<typeof postDataView, "Post", { author: User; comments: Array<Comment> }>;

import type { CommentRow, PostRow } from "@app/db";
import { dataView, type Entity } from "@nkzw/fate/server";

import { type User, userDataView } from "../auth/views";

const commentPostDataView = dataView<PostRow>("Post")({
  id: true,
});

export const commentDataView = dataView<CommentRow>("Comment")({
  id: true,
  content: true,
  createdAt: true,
  author: userDataView,
  post: commentPostDataView,
});

export type Comment = Entity<
  typeof commentDataView,
  "Comment",
  { author: User; post: Entity<typeof commentPostDataView, "Post"> }
>;

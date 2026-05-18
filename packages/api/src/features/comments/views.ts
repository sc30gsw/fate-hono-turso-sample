import type { CommentRow } from "@app/db";
import { dataView, type Entity } from "@nkzw/fate/server";

import { type User, userDataView } from "~/features/auth/views";

export const commentDataView = dataView<CommentRow>("Comment")({
  id: true,
  content: true,
  createdAt: true,
  author: userDataView,
});

export type Comment = Entity<typeof commentDataView, "Comment", { author: User }>;

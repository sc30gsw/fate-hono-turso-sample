import type { User } from "@app/api/features/auth/views";
import type { Comment } from "@app/api/features/comments/views";
import type { Post } from "@app/api/features/posts/views";
import { view } from "react-fate";

export const UserView = view<User>()({
  id: true,
  name: true,
  image: true,
});

const postSummarySelection = {
  id: true,
  title: true,
  createdAt: true,
  author: UserView,
} as const;

export const PostListItemView = view<Post>()(postSummarySelection);

export const CommentView = view<Comment>()({
  id: true,
  content: true,
  createdAt: true,
  author: UserView,
});

export const postCommentsConnection = {
  args: { first: 10 },
  items: { node: CommentView },
} as const;

export const PostDetailView = view<Post>()({
  ...postSummarySelection,
  content: true,
  comments: postCommentsConnection,
});

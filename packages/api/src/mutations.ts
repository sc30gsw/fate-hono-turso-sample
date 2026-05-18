import { addComment, deleteComment } from "./features/comments/mutations";
import { likePost } from "./features/likes/mutations";
import { createPost, deletePost } from "./features/posts/mutations";

export const mutations = {
  addComment,
  createPost,
  deleteComment,
  deletePost,
  likePost,
} as const;

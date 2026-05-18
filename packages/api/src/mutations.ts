import { addComment } from "./features/comments/mutations";
import { likePost } from "./features/likes/mutations";
import { createPost } from "./features/posts/mutations";

export const mutations = {
  addComment,
  createPost,
  likePost,
} as const;

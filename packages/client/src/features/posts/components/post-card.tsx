import { useView, type ViewRef } from "react-fate";

import { PostCardContent } from "~/features/posts/components/post-card-content";
import { PostListItemView } from "~/features/posts/views/post-views";

export function PostCard({ post: postRef }: Record<"post", ViewRef<"Post">>) {
  const post = useView(PostListItemView, postRef);

  return <PostCardContent post={post} />;
}

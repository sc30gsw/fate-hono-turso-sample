import { useLiveView, type ViewRef } from "react-fate";

import { PostCardContent } from "~/features/posts/components/post-card-content";
import { PostListItemView } from "~/features/posts/views/post-views";

export function LivePostCard({ post: postRef }: Record<"post", ViewRef<"Post">>) {
  const post = useLiveView(PostListItemView, postRef);

  return <PostCardContent post={post} />;
}

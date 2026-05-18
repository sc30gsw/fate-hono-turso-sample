import type { Post } from "@app/api/features/posts/views";
import { Suspense } from "react";
import { useLiveView, useRequest } from "react-fate";

import {
  LikeButtonContent,
  LikeButtonFallback,
} from "~/features/likes/components/like-button-content";
import { PostLikeView } from "~/features/posts/views/post-views";

type LiveLikeButtonProps = {
  postId: Post["id"];
};

export function LiveLikeButton(props: LiveLikeButtonProps) {
  return (
    <Suspense fallback={<LikeButtonFallback />}>
      <LiveLikeButtonData {...props} />
    </Suspense>
  );
}

function LiveLikeButtonData({ postId }: LiveLikeButtonProps) {
  const { post: postRef } = useRequest({ post: { id: postId, view: PostLikeView } });
  const post = useLiveView(PostLikeView, postRef);

  return <LikeButtonContent post={post} />;
}

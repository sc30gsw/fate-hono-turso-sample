import type { Post } from "@app/api/features/posts/views";
import { Suspense } from "react";
import { useRequest, useView } from "react-fate";

import {
  LikeButtonContent,
  LikeButtonFallback,
} from "~/features/likes/components/like-button-content";
import { PostLikeView } from "~/features/posts/views/post-views";

type LikeButtonProps = {
  postId: Post["id"];
};

export function LikeButton(props: LikeButtonProps) {
  return (
    <Suspense fallback={<LikeButtonFallback />}>
      <LikeButtonData {...props} />
    </Suspense>
  );
}

function LikeButtonData({ postId }: LikeButtonProps) {
  const { post: postRef } = useRequest({ post: { id: postId, view: PostLikeView } });
  const post = useView(PostLikeView, postRef);

  return <LikeButtonContent post={post} />;
}

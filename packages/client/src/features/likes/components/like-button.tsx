import type { Post } from "@app/api/features/posts/views";
import { useActionState } from "react";
import { useFateClient, useLiveView, useView, type ViewRef } from "react-fate";

import { PostLikeView } from "~/features/posts/views/post-views";

export function LikeButton({ post: postRef }: Record<"post", ViewRef<"Post">>) {
  const post = useView(PostLikeView, postRef);

  return <LikeButtonContent post={post} />;
}

export function LiveLikeButton({ post: postRef }: Record<"post", ViewRef<"Post">>) {
  const post = useLiveView(PostLikeView, postRef);

  return <LikeButtonContent post={post} />;
}

type LikeButtonPost = Pick<Post, "id" | "likedByViewer" | "likeCount">;

function LikeButtonContent({ post }: Record<"post", LikeButtonPost>) {
  const fate = useFateClient();
  const [result, like, isPending] = useActionState(fate.actions.likePost, null);

  const showError = result && "error" in result && result.error !== undefined;
  const optimisticLikeCount = post.likedByViewer
    ? Math.max(0, post.likeCount - 1)
    : post.likeCount + 1;

  return (
    <button
      className="rounded border border-neutral-300 bg-white px-3 py-1 text-sm hover:bg-neutral-50 disabled:opacity-50"
      disabled={isPending}
      onClick={() =>
        void like({
          input: { postId: String(post.id) },
          optimistic: {
            likedByViewer: !post.likedByViewer,
            likeCount: optimisticLikeCount,
          },
        })
      }
      type="button"
    >
      {post.likedByViewer ? "♥" : "♡"} {post.likeCount}
      {showError ? <span className="ml-2 text-xs text-red-600">retry</span> : null}
    </button>
  );
}

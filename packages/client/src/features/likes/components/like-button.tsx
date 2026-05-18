import type { Post } from "@app/api/features/posts/views";
import { useActionState } from "react";
import { useFateClient } from "react-fate";

type LikeButtonProps = {
  postId: Post["id"];
  likeCount: number;
};

export function LikeButton({ postId, likeCount }: LikeButtonProps) {
  const fate = useFateClient();
  const [result, like, isPending] = useActionState(fate.actions.likePost, null);

  const showError = result && "error" in result && result.error !== undefined;

  return (
    <button
      className="rounded border border-neutral-300 bg-white px-3 py-1 text-sm hover:bg-neutral-50 disabled:opacity-50"
      disabled={isPending}
      onClick={() =>
        void like({
          input: { postId },
        })
      }
      type="button"
    >
      ❤️ {likeCount}
      {showError ? <span className="ml-2 text-xs text-red-600">retry</span> : null}
    </button>
  );
}

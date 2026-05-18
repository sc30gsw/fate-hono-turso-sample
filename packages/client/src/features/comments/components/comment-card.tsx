import { useView, type ViewRef } from "react-fate";

import { DeleteCommentButton } from "~/features/comments/components/delete-comment-button";
import { AuthorBadge } from "~/features/posts/components/author-badge";
import { CommentView } from "~/features/posts/views/post-views";

export function CommentCard({ comment: commentRef }: Record<"comment", ViewRef<"Comment">>) {
  const comment = useView(CommentView, commentRef);

  return (
    <article className="rounded border border-neutral-200 bg-white p-3">
      <header className="flex items-center justify-between text-sm text-neutral-600">
        <AuthorBadge user={comment.author} />
        <div className="flex items-center gap-2">
          <time>
            {new Date(comment.createdAt).toLocaleString(undefined, {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </time>
          <DeleteCommentButton commentId={String(comment.id)} />
        </div>
      </header>
      <p className="mt-2 whitespace-pre-wrap text-neutral-900">{comment.content}</p>
    </article>
  );
}

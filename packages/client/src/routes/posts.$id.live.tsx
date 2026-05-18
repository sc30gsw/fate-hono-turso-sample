import { createRoute } from "@tanstack/react-router";
import { useLiveListView, useLiveView, useRequest } from "react-fate";

import { CommentCard } from "~/features/comments/components/comment-card";
import { CommentForm } from "~/features/comments/components/comment-form";
import { LikeButton } from "~/features/likes/components/like-button";
import { AuthorBadge } from "~/features/posts/components/author-badge";
import { PostDetailView, postCommentsConnection } from "~/features/posts/views/post-views";
import { Route as AuthenticatedRoute } from "~/routes/authenticated";

function LivePostDetailPage() {
  const { id } = Route.useParams();
  const { post: postRef } = useRequest({ post: { id, view: PostDetailView } });

  if (!postRef) {
    return <p className="text-neutral-500">Post not found.</p>;
  }

  const post = useLiveView(PostDetailView, postRef);

  const [maybeCommentItems] = useLiveListView(postCommentsConnection, post.comments);
  const commentItems = maybeCommentItems ?? [];

  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-neutral-900">{post.title}</h1>
        <p className="text-sm text-neutral-600">
          by <AuthorBadge user={post.author} /> ·{" "}
          {new Date(post.createdAt).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
        <div className="flex gap-3">
          <LikeButton likeCount={0} postId={String(post.id)} />
          <span className="text-sm text-neutral-500">💬 {commentItems.length}</span>
        </div>
      </header>

      <section className="prose whitespace-pre-wrap text-neutral-900">{post.content}</section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Comments (live)</h2>
        <CommentForm postId={String(post.id)} />
        {commentItems.length === 0 ? (
          <p className="text-neutral-500">No comments yet.</p>
        ) : (
          <ul className="space-y-3">
            {commentItems.map((item) => (
              <li key={item.node.id}>
                <CommentCard comment={item.node} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}

export const Route = createRoute({
  getParentRoute: () => AuthenticatedRoute,
  path: "/posts/$id/live",
  component: LivePostDetailPage,
});

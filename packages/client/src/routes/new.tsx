import { createRoute } from "@tanstack/react-router";

import { PostForm } from "~/features/posts/components/post-form";
import { Route as AuthenticatedRoute } from "~/routes/authenticated";

function NewPostPage() {
  return (
    <section className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">New post</h1>
      <PostForm />
    </section>
  );
}

export const Route = createRoute({
  getParentRoute: () => AuthenticatedRoute,
  path: "/new",
  component: NewPostPage,
});

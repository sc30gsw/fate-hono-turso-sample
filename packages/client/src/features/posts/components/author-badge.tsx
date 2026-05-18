import { useView, type ViewRef } from "react-fate";

import { UserView } from "~/features/posts/views/post-views";

export function AuthorBadge({ user: userRef }: { user: ViewRef<"User"> }) {
  const user = useView(UserView, userRef);

  return <span>{user.name}</span>;
}

import { Link, useNavigate } from "@tanstack/react-router";

import { signOut, useSession } from "~/lib/auth-client";

export function NavBar() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <nav className="mx-auto flex max-w-3xl items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Link className="font-bold" to="/">
            fate-hono-turso
          </Link>
          <Link className="text-sm text-neutral-600 hover:underline" to="/">
            Static
          </Link>
          <Link className="text-sm text-neutral-600 hover:underline" to="/live">
            Live
          </Link>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <AuthButtons />
        </div>
      </nav>
    </header>
  );
}

function AuthButtons() {
  const { data: session } = useSession();
  const navigate = useNavigate();

  if (!session?.user) {
    return (
      <>
        <Link className="hover:underline" to="/auth/sign-in">
          Sign in
        </Link>
        <Link
          className="rounded bg-neutral-900 px-2 py-1 text-white hover:bg-neutral-700"
          to="/auth/sign-up"
        >
          Sign up
        </Link>
      </>
    );
  }

  return (
    <button
      className="rounded border border-neutral-300 px-2 py-1 hover:bg-neutral-100"
      onClick={async () => {
        await signOut();
        await navigate({ to: "/auth/sign-in" });
      }}
      type="button"
    >
      Sign out
    </button>
  );
}

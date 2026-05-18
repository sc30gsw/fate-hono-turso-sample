import type { FateContext } from "~/fate";

export function requireUserId(ctx: FateContext) {
  if (!ctx.sessionUser) {
    throw new Error("Sign-in required.");
  }

  return ctx.sessionUser.id;
}

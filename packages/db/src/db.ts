//? Barrel for @app/db — re-exports the runtime `db` and the schema namespaces.
//? Per .claude/rules/typescript/no-index-files.md we use a named file (not `index.ts`).
//? Consumers: `import { db, posts, user } from "@app/db";`

export { db, type DB } from "./client";
export * as authSchema from "./auth-schema";
export * as schema from "./schema";

export { account, session, user, verification } from "./auth-schema";
export type { Session, User } from "./auth-schema";
export {
  comments,
  commentsRelations,
  likes,
  likesRelations,
  posts,
  postsRelations,
} from "./schema";
export type { Comment, Like, NewComment, NewPost, Post } from "./schema";

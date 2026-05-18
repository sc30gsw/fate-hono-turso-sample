export { db } from "./client";
export * as authSchema from "./auth-schema";
export * as schema from "./schema";

export { account, session, user, verification } from "./auth-schema";
export type { UserRow } from "./auth-schema";
export { comment, commentRelations, like, likeRelations, post, postRelations } from "./schema";
export type { CommentRow, PostRow } from "./schema";

export { db, type DB } from "~/client";
export * as authSchema from "~/auth-schema";
export * as schema from "~/schema";

export { account, session, user, verification } from "~/auth-schema";
export type { Session, User } from "~/auth-schema";
export { comment, commentRelations, like, likeRelations, post, postRelations } from "~/schema";
export type { Comment, Like, NewComment, NewPost, Post } from "~/schema";

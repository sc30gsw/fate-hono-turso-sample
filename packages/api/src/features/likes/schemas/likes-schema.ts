import * as v from "valibot";

export const likePostInput = v.object({
  postId: v.pipe(v.string(), v.minLength(1)),
});

export type LikePostInput = v.InferOutput<typeof likePostInput>;

import * as v from "valibot";

export const defaultAuthSearchParams = {
  redirect: undefined,
} as const satisfies Record<string, undefined | string>;

export const authSearchSchema = v.object({
  redirect: v.optional(v.string()),
});

import * as v from "valibot";

export function parseNumber(value: string) {
  return v.parse(v.pipe(v.string(), v.transform(Number), v.integer(), v.minValue(1)), value);
}

import ApiError from "../errors/api-error.js";

export function addToString(x: string, y: number): string {
  return (parseFloat(x) + y).toFixed(2);
}

export function subFromString(x: string, y: number): string {
  const c = parseFloat(x);
  if (y > c) {
    throw new ApiError(500, "Value underflow");
  }

  return (c - y).toFixed(2);
}

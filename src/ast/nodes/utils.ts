export function checkArray<U, T extends U>(
  arr: readonly U[],
  check: (n: U) => n is T
): arr is T[] {
  return arr.every(check);
}

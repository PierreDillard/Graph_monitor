export function hasDefinedProp<T, K extends keyof T>(
  obj: T,
  k: K,
): obj is T & Required<Pick<T, K>> {
  return !!obj[k];
}

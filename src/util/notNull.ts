export function notNull<T>(value: T | undefined | null): value is T {
  return value != null
}

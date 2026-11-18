// English only: one word for a count of 1, the other for the rest
export function pluralOf(count: number, one: string, other: string): string {
  return count === 1 ? one : other;
}

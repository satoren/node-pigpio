export const flat = <T>(a: T[][]): T[] => {
  return ([] as T[]).concat(...a)
}

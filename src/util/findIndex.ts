export function findIndex<T>(array: T[], pred: (value: T, index: number, obj: T[]) => boolean, startIndex = 0): number {
  if (startIndex > 0) {
    const originalPred = pred
    pred = (value, index, obj) => index >= startIndex && originalPred(value, index, obj)
  }
  const idx = array.findIndex(pred)
  return idx === -1 ? array.length : idx
}

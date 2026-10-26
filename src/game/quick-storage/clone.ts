export function cloneWorld<T>(value: T): T {
  return structuredClone(value);
}

/** Let node run the game's extensionless TypeScript imports. Vite already resolves them. */
export async function resolve(specifier, context, nextResolve) {
  if (
    specifier.startsWith(".") &&
    !specifier.endsWith(".ts") &&
    !specifier.endsWith(".tsx") &&
    !specifier.endsWith(".js") &&
    !specifier.endsWith(".mjs") &&
    !specifier.endsWith(".json")
  ) {
    try {
      return await nextResolve(specifier + ".ts", context);
    } catch {
      /* fall through */
    }
  }
  return nextResolve(specifier, context);
}

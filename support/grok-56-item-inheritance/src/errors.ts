export class InheritanceError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "InheritanceError";
    this.code = code;
  }
}

export function isInheritanceError(error: unknown): error is InheritanceError {
  return error instanceof InheritanceError || (error instanceof Error && error.name === "InheritanceError" && "code" in error);
}

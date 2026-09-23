export class NotFoundError extends Error {
  constructor(message = 'Запись не найдена') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Не удалось выполнить запрос';
}

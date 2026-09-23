import type { ReactNode } from 'react';
import { getErrorMessage } from '@/shared/lib/errors';
import { Button } from './Button';

export function LoadingState({ label = 'Загружаем данные…' }: { label?: string }) {
  return (
    <div className="state" role="status">
      <div className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="state">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="state" role="alert">
      <h3>Не удалось загрузить данные</h3>
      <p>{getErrorMessage(error)}</p>
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          Повторить
        </Button>
      )}
    </div>
  );
}

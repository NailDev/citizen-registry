import { Link } from 'react-router-dom';
import { EmptyState } from '@/shared/ui/States';

export function NotFoundPage() {
  return (
    <EmptyState
      title="Такой страницы нет"
      description="Проверьте адрес или вернитесь на главную."
      action={
        <Link to="/" className="btn btn--primary">
          На главную
        </Link>
      }
    />
  );
}

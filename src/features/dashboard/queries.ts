import { useQuery } from '@tanstack/react-query';
import { fetchDashboard } from '@/mocks/api';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: ({ signal }) => fetchDashboard(signal),
  });
}

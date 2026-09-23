import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { CitizenDetail, CitizensFilter } from '@/domain/citizen';
import type { FormValues } from '@/domain/schema';
import {
  createCitizen,
  fetchCitizen,
  fetchCitizens,
  updateCitizen,
} from '@/mocks/api';

export const PAGE_SIZE = 60;

export function useCitizensInfinite(filter: CitizensFilter) {
  return useInfiniteQuery({
    queryKey: ['citizens', filter],
    queryFn: ({ pageParam, signal }) =>
      fetchCitizens({ ...filter, offset: pageParam, limit: PAGE_SIZE }, signal),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    placeholderData: keepPreviousData,
  });
}

export function useCitizen(id: number) {
  return useQuery({
    queryKey: ['citizen', id],
    queryFn: ({ signal }) => fetchCitizen(id, signal),
  });
}

function useInvalidateLists() {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: ['citizens'] }),
      client.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
}

export function useUpdateCitizen(id: number) {
  const client = useQueryClient();
  const invalidateLists = useInvalidateLists();
  return useMutation({
    mutationFn: (values: FormValues) => updateCitizen(id, values),
    onSuccess: (detail: CitizenDetail) => {
      client.setQueryData(['citizen', id], detail);
      return invalidateLists();
    },
  });
}

export function useCreateCitizen() {
  const client = useQueryClient();
  const invalidateLists = useInvalidateLists();
  return useMutation({
    mutationFn: (values: FormValues) => createCitizen(values),
    onSuccess: (detail: CitizenDetail) => {
      client.setQueryData(['citizen', detail.id], detail);
      return invalidateLists();
    },
  });
}

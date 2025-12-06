import { queryOptions } from '@tanstack/react-query'
import { productsRepository, ProductFilters } from '@/repositories/products.repository'

export type { ProductFilters } from '@/repositories/products.repository'

export const productsQueries = {
  all: () => ['products'] as const,

  lists: () => [...productsQueries.all(), 'list'] as const,

  list: (filters: ProductFilters = {}) =>
    queryOptions({
      queryKey: [...productsQueries.lists(), filters] as const,
      queryFn: () => productsRepository.findMany(filters),
    }),

  details: () => [...productsQueries.all(), 'detail'] as const,

  detail: (id: string) =>
    queryOptions({
      queryKey: [...productsQueries.details(), id] as const,
      queryFn: () => productsRepository.findById(id),
    }),

  detailBySlug: (slug: string) =>
    queryOptions({
      queryKey: [...productsQueries.details(), 'slug', slug] as const,
      queryFn: () => productsRepository.findBySlug(slug),
    }),

  categories: () =>
    queryOptions({
      queryKey: [...productsQueries.all(), 'categories'] as const,
      queryFn: () => productsRepository.findCategories(),
      staleTime: 5 * 60 * 1000, // 5분간 fresh 유지
    }),

  best: (limit = 10) =>
    queryOptions({
      queryKey: [...productsQueries.all(), 'best', limit] as const,
      queryFn: () => productsRepository.findBest(limit),
      staleTime: 60 * 1000, // 1분간 fresh 유지
    }),

  new: (limit = 10) =>
    queryOptions({
      queryKey: [...productsQueries.all(), 'new', limit] as const,
      queryFn: () => productsRepository.findNew(limit),
      staleTime: 60 * 1000, // 1분간 fresh 유지
    }),

  byIds: (ids: string[]) =>
    queryOptions({
      queryKey: [...productsQueries.all(), 'byIds', [...ids].sort()] as const,
      queryFn: () => productsRepository.findByIds(ids),
      enabled: ids.length > 0,
    }),
}

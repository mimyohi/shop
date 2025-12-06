import { queryOptions } from '@tanstack/react-query'
import { productOptionsRepository } from '@/repositories/product-options.repository'

export const productOptionsQueries = {
  all: () => ['productOptions'] as const,

  configuration: (productId: string) =>
    queryOptions({
      queryKey: [...productOptionsQueries.all(), 'configuration', productId] as const,
      queryFn: () => productOptionsRepository.findConfigurationByProductId(productId),
      enabled: !!productId,
      staleTime: 5 * 60 * 1000,
    }),
}

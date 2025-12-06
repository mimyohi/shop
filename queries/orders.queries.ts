import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ordersRepository,
  CreateOrderData,
} from "@/repositories/orders.repository";
import { createOrderAction, cancelOrderAction } from "@/lib/actions/orders.actions";

export type {
  CreateOrderData,
  OrderWithItems,
} from "@/repositories/orders.repository";

// Query Options (useQuery용)
export const ordersQueries = {
  all: () => ["orders"] as const,

  lists: () => [...ordersQueries.all(), "list"] as const,

  byEmail: (email: string) =>
    queryOptions({
      queryKey: [...ordersQueries.lists(), email] as const,
      queryFn: async () => {
        const result = await ordersRepository.findByUserEmail(email);
        return result.orders;
      },
      enabled: !!email, // 이메일이 있을 때만 쿼리 실행
    }),

  details: () => [...ordersQueries.all(), "detail"] as const,

  byOrderId: (orderId: string) =>
    queryOptions({
      queryKey: [...ordersQueries.details(), orderId] as const,
      queryFn: () => ordersRepository.findByOrderId(orderId),
      enabled: !!orderId,
    }),

  byId: (id: string) =>
    queryOptions({
      queryKey: [...ordersQueries.details(), "id", id] as const,
      queryFn: () => ordersRepository.findById(id),
      enabled: !!id,
    }),
};

// Mutations (useMutation용)
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: CreateOrderData) => {
      const result = await createOrderAction(orderData);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (newOrder) => {
      // 주문 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ordersQueries.lists() });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      status,
      paymentKey,
    }: {
      orderId: string;
      status: string;
      paymentKey?: string;
    }) => ordersRepository.updateStatus(orderId, status, paymentKey),
    onSuccess: (updatedOrder) => {
      // 주문 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ordersQueries.lists() });
      // 특정 주문 캐시도 무효화
      if (updatedOrder.order_id) {
        queryClient.invalidateQueries({
          queryKey: ordersQueries.byOrderId(updatedOrder.order_id).queryKey,
        });
      }
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const result = await cancelOrderAction(orderId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      // 주문 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ordersQueries.lists() });
    },
  });
}

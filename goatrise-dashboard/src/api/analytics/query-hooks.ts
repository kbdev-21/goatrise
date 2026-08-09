import { useQuery } from "@tanstack/react-query";
import {
  calculateRevenue,
  countCustomers,
  countOrders,
  findDailyOrders,
  findDailyRevenue,
  findItemSales,
  findMonthlyOrders,
  findMonthlyRevenue,
  findProductSales,
  type AnalyticsRangeParams,
  type AnalyticsRequiredRangeParams,
} from "@/api/analytics/api.ts";

export const analyticsKeys = {
  all: ["analytics"] as const,
  ordersCount: (params?: AnalyticsRangeParams) =>
    [...analyticsKeys.all, "orders-count", params] as const,
  customersCount: (params?: AnalyticsRangeParams) =>
    [...analyticsKeys.all, "customers-count", params] as const,
  revenue: (params?: AnalyticsRangeParams) =>
    [...analyticsKeys.all, "revenue", params] as const,
  dailyRevenue: (params: AnalyticsRequiredRangeParams) =>
    [...analyticsKeys.all, "daily-revenue", params] as const,
  dailyOrders: (params: AnalyticsRequiredRangeParams) =>
    [...analyticsKeys.all, "daily-orders", params] as const,
  monthlyRevenue: (params: AnalyticsRequiredRangeParams) =>
    [...analyticsKeys.all, "monthly-revenue", params] as const,
  monthlyOrders: (params: AnalyticsRequiredRangeParams) =>
    [...analyticsKeys.all, "monthly-orders", params] as const,
  productSales: (params?: AnalyticsRangeParams) =>
    [...analyticsKeys.all, "product-sales", params] as const,
  itemSales: (params?: AnalyticsRangeParams) =>
    [...analyticsKeys.all, "item-sales", params] as const,
};

export function useOrdersCount(params?: AnalyticsRangeParams) {
  return useQuery({
    queryKey: analyticsKeys.ordersCount(params),
    queryFn: () => countOrders(params),
  });
}

export function useCustomersCount(params?: AnalyticsRangeParams) {
  return useQuery({
    queryKey: analyticsKeys.customersCount(params),
    queryFn: () => countCustomers(params),
  });
}

export function useRevenue(params?: AnalyticsRangeParams) {
  return useQuery({
    queryKey: analyticsKeys.revenue(params),
    queryFn: () => calculateRevenue(params),
  });
}

export function useDailyRevenue(params: AnalyticsRequiredRangeParams) {
  return useQuery({
    queryKey: analyticsKeys.dailyRevenue(params),
    queryFn: () => findDailyRevenue(params),
  });
}

export function useDailyOrders(params: AnalyticsRequiredRangeParams) {
  return useQuery({
    queryKey: analyticsKeys.dailyOrders(params),
    queryFn: () => findDailyOrders(params),
  });
}

export function useMonthlyRevenue(params: AnalyticsRequiredRangeParams) {
  return useQuery({
    queryKey: analyticsKeys.monthlyRevenue(params),
    queryFn: () => findMonthlyRevenue(params),
  });
}

export function useMonthlyOrders(params: AnalyticsRequiredRangeParams) {
  return useQuery({
    queryKey: analyticsKeys.monthlyOrders(params),
    queryFn: () => findMonthlyOrders(params),
  });
}

export function useProductSales(params?: AnalyticsRangeParams) {
  return useQuery({
    queryKey: analyticsKeys.productSales(params),
    queryFn: () => findProductSales(params),
  });
}

export function useItemSales(params?: AnalyticsRangeParams) {
  return useQuery({
    queryKey: analyticsKeys.itemSales(params),
    queryFn: () => findItemSales(params),
  });
}

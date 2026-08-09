import axiosInstance from "@/api/axios-instance.ts";
import type { ProductBase } from "@/api/product/api.ts";
import type { ItemBase } from "@/api/item/api.ts";

export async function countOrders(params?: AnalyticsRangeParams): Promise<number> {
  const res = await axiosInstance.get<number>("/api/analytics/orders-count", { params });
  return res.data;
}

export async function countCustomers(params?: AnalyticsRangeParams): Promise<number> {
  const res = await axiosInstance.get<number>("/api/analytics/customers-count", { params });
  return res.data;
}

export async function calculateRevenue(params?: AnalyticsRangeParams): Promise<number> {
  const res = await axiosInstance.get<number>("/api/analytics/revenue", { params });
  return res.data;
}

export async function findDailyRevenue(params: AnalyticsRequiredRangeParams): Promise<DailyRevenue[]> {
  const res = await axiosInstance.get<DailyRevenue[]>("/api/analytics/daily-revenue", { params });
  return res.data;
}

export async function findDailyOrders(params: AnalyticsRequiredRangeParams): Promise<DailyOrders[]> {
  const res = await axiosInstance.get<DailyOrders[]>("/api/analytics/daily-orders", { params });
  return res.data;
}

export async function findMonthlyRevenue(params: AnalyticsRequiredRangeParams): Promise<MonthlyRevenue[]> {
  const res = await axiosInstance.get<MonthlyRevenue[]>("/api/analytics/monthly-revenue", { params });
  return res.data;
}

export async function findMonthlyOrders(params: AnalyticsRequiredRangeParams): Promise<MonthlyOrders[]> {
  const res = await axiosInstance.get<MonthlyOrders[]>("/api/analytics/monthly-orders", { params });
  return res.data;
}

export async function findProductSales(params?: AnalyticsRangeParams): Promise<ProductSales[]> {
  const res = await axiosInstance.get<ProductSales[]>("/api/analytics/product-sales", { params });
  return res.data;
}

export async function findItemSales(params?: AnalyticsRangeParams): Promise<ItemSales[]> {
  const res = await axiosInstance.get<ItemSales[]>("/api/analytics/item-sales", { params });
  return res.data;
}

// khoảng thời gian lọc (ISO string); bỏ trống -> backend tính trên toàn bộ dữ liệu
export type AnalyticsRangeParams = {
  from?: string;
  to?: string;
};

// khoảng bắt buộc (dùng cho daily-revenue)
export type AnalyticsRequiredRangeParams = {
  from: string;
  to: string;
};

export type DailyRevenue = {
  date: string; // YYYY-MM-DD
  revenue: number;
};

export type DailyOrders = {
  date: string; // YYYY-MM-DD
  count: number;
};

export type MonthlyRevenue = {
  month: string; // YYYY-MM
  revenue: number;
};

export type MonthlyOrders = {
  month: string; // YYYY-MM
  count: number;
};

export type ProductSales = {
  product: ProductBase;
  sold: number;
};

export type ItemSales = {
  item: ItemBase;
  sold: number;
};

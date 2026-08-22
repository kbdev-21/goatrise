import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import { Contact, DollarSign, ShoppingCart, TrendingUp, X } from "lucide-react";

import { formatPriceVn } from "@/core/utils.ts";
import {
  useCustomersCount,
  useDailyOrders,
  useDailyRevenue,
  useItemSales,
  useMonthlyOrders,
  useMonthlyRevenue,
  useOrdersCount,
  useProductSales,
  useRevenue,
} from "@/api/analytics/query-hooks.ts";
import type { AnalyticsRangeParams } from "@/api/analytics/api.ts";
import { Spinner } from "@/components/ui/spinner.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart.tsx";

// ----- range presets -> from/to ISO cho backend (?from&to) -----
// mốc tính theo đầu kỳ: hôm nay / tuần này (T2) / tháng này / năm nay
type RangeKey = "today" | "week" | "month" | "year" | "all";

const RANGE_OPTIONS: { label: string; value: RangeKey }[] = [
  { label: "Today", value: "today" },
  { label: "This week", value: "week" },
  { label: "This month", value: "month" },
  { label: "This year", value: "year" },
  { label: "All time", value: "all" },
];

function resolveRange(key: RangeKey): AnalyticsRangeParams {
  const now = new Date();
  const to = now.toISOString();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (key) {
    case "today":
      return { from: startOfDay.toISOString(), to };
    case "week": {
      // tuần bắt đầu từ Thứ 2
      const day = startOfDay.getDay(); // 0=CN ... 6=T7
      const diffToMonday = (day + 6) % 7;
      const monday = new Date(startOfDay);
      monday.setDate(startOfDay.getDate() - diffToMonday);
      return { from: monday.toISOString(), to };
    }
    case "month":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), to };
    case "all":
      // toàn bộ dữ liệu: bỏ trống from/to -> backend không giới hạn khoảng
      return {};
    case "year":
    default:
      return { from: new Date(now.getFullYear(), 0, 1).toISOString(), to };
  }
}

const TOP_N = 8;

// số điểm cho biểu đồ trend theo từng độ chi tiết
const TREND_DAYS = 30;
const TREND_MONTHS = 12;

const salesChartConfig = {
  sold: { label: "Units sold", color: "var(--primary)" },
} satisfies ChartConfig;

const trendChartConfig = {
  value: { label: "Value", color: "var(--primary)" },
} satisfies ChartConfig;

const pad2 = (n: number) => String(n).padStart(2, "0");

// YYYY-MM-DD -> dd/MM/yyyy (để hiển thị trên nút custom range)
function formatDateLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

// key theo giờ máy (khớp key mà backend trả về)
function toLocalDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toLocalMonthKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

// ----- daily: TREND_DAYS ngày gần nhất -----
function lastDaysRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (TREND_DAYS - 1));
  return { from: start.toISOString(), to: now.toISOString() };
}

// map theo ngày -> đủ TREND_DAYS cột {label dd/MM, value}, fill 0 cho ngày trống
function buildDailySeries(byDate: Map<string, number>) {
  const today = new Date();
  return Array.from({ length: TREND_DAYS }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (TREND_DAYS - 1 - i));
    return { label: `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`, value: byDate.get(toLocalDateKey(d)) ?? 0 };
  });
}

// ----- monthly: TREND_MONTHS tháng gần nhất -----
function lastMonthsRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (TREND_MONTHS - 1), 1);
  return { from: start.toISOString(), to: now.toISOString() };
}

// map theo tháng -> đủ TREND_MONTHS cột {label MM/YY, value}, fill 0 cho tháng trống
function buildMonthlySeries(byMonth: Map<string, number>) {
  const now = new Date();
  return Array.from({ length: TREND_MONTHS }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (TREND_MONTHS - 1 - i), 1);
    return {
      label: `${pad2(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`,
      value: byMonth.get(toLocalMonthKey(d)) ?? 0,
    };
  });
}

type TrendMetric = "revenue" | "orders";
type TrendGranularity = "daily" | "monthly";

const TREND_METRIC_OPTIONS: { label: string; value: TrendMetric }[] = [
  { label: "Revenue", value: "revenue" },
  { label: "Orders", value: "orders" },
];

const TREND_GRANULARITY_OPTIONS: { label: string; value: TrendGranularity }[] = [
  { label: "Daily", value: "daily" },
  { label: "Monthly", value: "monthly" },
];

export default function AnalyticsPage() {
  const [range, setRange] = useState<RangeKey>("month");
  const [trendMetric, setTrendMetric] = useState<TrendMetric>("revenue");
  const [trendGranularity, setTrendGranularity] = useState<TrendGranularity>("daily");

  // custom range (YYYY-MM-DD) đã áp dụng; khi cả 2 có giá trị -> ưu tiên custom, preset bị disable
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const customActive = customFrom !== "" && customTo !== "";

  // dialog + draft (giá trị đang chọn trong dialog, chỉ áp dụng khi bấm Confirm)
  const [rangeDialogOpen, setRangeDialogOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const canConfirmRange = draftFrom !== "" && draftTo !== "" && draftFrom <= draftTo;

  const params = useMemo<AnalyticsRangeParams>(() => {
    if (customActive) {
      return {
        from: new Date(`${customFrom}T00:00:00`).toISOString(),
        to: new Date(`${customTo}T23:59:59.999`).toISOString(),
      };
    }
    return resolveRange(range);
  }, [customActive, customFrom, customTo, range]);

  function openRangeDialog() {
    setDraftFrom(customFrom);
    setDraftTo(customTo);
    setRangeDialogOpen(true);
  }

  function confirmCustomRange() {
    setCustomFrom(draftFrom);
    setCustomTo(draftTo);
    setRangeDialogOpen(false);
  }

  function clearCustomRange() {
    setCustomFrom("");
    setCustomTo("");
  }

  const ordersQuery = useOrdersCount(params);
  const customersQuery = useCustomersCount(params);
  const revenueQuery = useRevenue(params);
  const productSalesQuery = useProductSales(params);
  const itemSalesQuery = useItemSales(params);

  // biểu đồ trend — cố định theo TREND_DAYS/TREND_MONTHS, không phụ thuộc range selector ở trên
  const dailyParams = useMemo(() => lastDaysRange(), []);
  const monthlyParams = useMemo(() => lastMonthsRange(), []);
  const dailyRevenueQuery = useDailyRevenue(dailyParams);
  const dailyOrdersQuery = useDailyOrders(dailyParams);
  const monthlyRevenueQuery = useMonthlyRevenue(monthlyParams);
  const monthlyOrdersQuery = useMonthlyOrders(monthlyParams);

  const dailyRevenueSeries = useMemo(
    () => buildDailySeries(new Map((dailyRevenueQuery.data ?? []).map((r) => [r.date, r.revenue]))),
    [dailyRevenueQuery.data],
  );
  const dailyOrdersSeries = useMemo(
    () => buildDailySeries(new Map((dailyOrdersQuery.data ?? []).map((r) => [r.date, r.count]))),
    [dailyOrdersQuery.data],
  );
  const monthlyRevenueSeries = useMemo(
    () => buildMonthlySeries(new Map((monthlyRevenueQuery.data ?? []).map((r) => [r.month, r.revenue]))),
    [monthlyRevenueQuery.data],
  );
  const monthlyOrdersSeries = useMemo(
    () => buildMonthlySeries(new Map((monthlyOrdersQuery.data ?? []).map((r) => [r.month, r.count]))),
    [monthlyOrdersQuery.data],
  );

  // props cho chart trend tùy theo metric (revenue/orders) + độ chi tiết (daily/monthly)
  const isRevenue = trendMetric === "revenue";
  const isDaily = trendGranularity === "daily";
  const trendQuery = isDaily
    ? isRevenue ? dailyRevenueQuery : dailyOrdersQuery
    : isRevenue ? monthlyRevenueQuery : monthlyOrdersQuery;
  const trendData = isDaily
    ? isRevenue ? dailyRevenueSeries : dailyOrdersSeries
    : isRevenue ? monthlyRevenueSeries : monthlyOrdersSeries;
  const trendView = {
    data: trendData,
    isLoading: trendQuery.isLoading,
    isError: trendQuery.isError,
    valueFormatter: isRevenue
      ? (value: number) => `${formatPriceVn(value)} ₫`
      : (value: number) => value.toLocaleString("vi-VN"),
    axisFormatter: isRevenue
      ? (value: number) => formatPriceVn(value)
      : (value: number) => value.toLocaleString("vi-VN"),
    yAxisWidth: isRevenue ? 64 : 40,
  };

  // top N theo số lượng bán, bỏ các dòng chưa bán được cái nào
  const topProducts = useMemo(() => {
    return (productSalesQuery.data ?? [])
      .filter((row) => row.sold > 0)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, TOP_N)
      .map((row) => ({ name: row.product.title.vi, sold: row.sold, img: row.product.imgUrls?.[0] ?? null }));
  }, [productSalesQuery.data]);

  const topItems = useMemo(() => {
    return (itemSalesQuery.data ?? [])
      .filter((row) => row.sold > 0)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, TOP_N)
      .map((row) => ({ name: row.item.name, sold: row.sold, img: row.item.imgUrl ?? null }));
  }, [itemSalesQuery.data]);

  return (
    <div className="flex min-h-svh flex-col gap-6 p-6">
      {/* ----- header ----- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium">Analytics</h1>
          <p className="text-muted-foreground text-sm">
            Overview of orders, customers and best sellers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={range}
            onValueChange={(v) => setRange(v as RangeKey)}
            disabled={customActive}
          >
            <SelectTrigger className="w-40 bg-card">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* custom range: nút mở dialog; khi đã áp dụng -> hiện khoảng + nút X clear */}
          {customActive ? (
            <div className="bg-card flex items-center gap-1 rounded-md border pr-1">
              <Button type="button" variant="ghost" onClick={openRangeDialog} className="h-7">
                {formatDateLabel(customFrom)} → {formatDateLabel(customTo)}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={clearCustomRange}
                aria-label="Clear custom range"
                className="size-6 shrink-0"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ) : (
            <Button type="button" variant="outline" onClick={openRangeDialog} className="bg-card">
              Custom date range
            </Button>
          )}
        </div>
      </div>

      {/* ----- custom range dialog ----- */}
      <Dialog open={rangeDialogOpen} onOpenChange={setRangeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Custom date range</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">From</span>
              <Input
                type="date"
                value={draftFrom}
                max={draftTo || undefined}
                onChange={(e) => setDraftFrom(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">To</span>
              <Input
                type="date"
                value={draftTo}
                min={draftFrom || undefined}
                onChange={(e) => setDraftTo(e.target.value)}
              />
            </label>
          </div>

          <DialogFooter>
            <Button type="button" onClick={confirmCustomRange} disabled={!canConfirmRange}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ----- KPI cards ----- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Orders"
          icon={<ShoppingCart className="size-4" />}
          isLoading={ordersQuery.isLoading}
          isError={ordersQuery.isError}
          value={ordersQuery.data?.toLocaleString("vi-VN")}
        />
        <StatCard
          label="Revenue"
          icon={<DollarSign className="size-4" />}
          isLoading={revenueQuery.isLoading}
          isError={revenueQuery.isError}
          value={revenueQuery.data !== undefined ? `${formatPriceVn(revenueQuery.data)} ₫` : undefined}
        />
        <StatCard
          label="Customers"
          icon={<Contact className="size-4" />}
          isLoading={customersQuery.isLoading}
          isError={customersQuery.isError}
          value={customersQuery.data?.toLocaleString("vi-VN")}
        />
      </div>

      {/* ----- charts ----- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SalesChartCard
          title="Top products"
          subtitle="By units sold"
          idPrefix="products"
          data={topProducts}
          isLoading={productSalesQuery.isLoading}
          isError={productSalesQuery.isError}
        />
        <SalesChartCard
          title="Top items"
          subtitle="By units sold"
          idPrefix="items"
          data={topItems}
          isLoading={itemSalesQuery.isLoading}
          isError={itemSalesQuery.isError}
        />
      </div>

      {/* ----- trend: chọn metric (revenue/orders) + độ chi tiết (daily/monthly) ----- */}
      <TrendAreaCard
        title={`${isDaily ? "Daily" : "Monthly"} ${isRevenue ? "Revenue" : "Orders"}`}
        subtitle={isDaily ? `Last ${TREND_DAYS} days` : `Last ${TREND_MONTHS} months`}
        gradientId="fillTrend"
        data={trendView.data}
        isLoading={trendView.isLoading}
        isError={trendView.isError}
        valueFormatter={trendView.valueFormatter}
        axisFormatter={trendView.axisFormatter}
        yAxisWidth={trendView.yAxisWidth}
        control={
          <div className="flex items-center gap-2">
            <Select value={trendMetric} onValueChange={(v) => setTrendMetric(v as TrendMetric)}>
              <SelectTrigger className="w-32 bg-card">
                <SelectValue placeholder="Metric" />
              </SelectTrigger>
              <SelectContent>
                {TREND_METRIC_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={trendGranularity}
              onValueChange={(v) => setTrendGranularity(v as TrendGranularity)}
            >
              <SelectTrigger className="w-32 bg-card">
                <SelectValue placeholder="Granularity" />
              </SelectTrigger>
              <SelectContent>
                {TREND_GRANULARITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  );
}

// ---------- private components ----------

type TrendAreaCardProps = {
  title: string;
  subtitle: string;
  control: React.ReactNode;
  gradientId: string;
  data: { label: string; value: number }[];
  isLoading: boolean;
  isError: boolean;
  valueFormatter: (value: number) => string; // tooltip
  axisFormatter: (value: number) => string; // trục Y
  yAxisWidth: number;
};

function TrendAreaCard({
  title,
  subtitle,
  control,
  gradientId,
  data,
  isLoading,
  isError,
  valueFormatter,
  axisFormatter,
  yAxisWidth,
}: TrendAreaCardProps) {
  return (
    <div className="bg-card flex flex-col gap-4 rounded-md border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-medium">{title}</h2>
          <p className="text-muted-foreground text-xs">{subtitle}</p>
        </div>
        {control}
      </div>

      {isLoading ? (
        <div className="flex h-72 items-center justify-center">
          <Spinner className="text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="text-destructive flex h-72 items-center justify-center text-sm">
          Failed to load.
        </div>
      ) : (
        <ChartContainer config={trendChartConfig} className="aspect-auto h-72 w-full">
          <AreaChart accessibilityLayer data={data} margin={{ left: 12, right: 12, top: 8 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={yAxisWidth}
              tickFormatter={(value: number) => axisFormatter(value)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent formatter={(value) => valueFormatter(Number(value))} />}
            />
            <Area
              dataKey="value"
              type="monotone"
              stroke="var(--color-value)"
              fill={`url(#${gradientId})`}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </div>
  );
}

type StatCardProps = {
  label: string;
  icon: React.ReactNode;
  value: string | undefined;
  isLoading: boolean;
  isError: boolean;
};

function StatCard({ label, icon, value, isLoading, isError }: StatCardProps) {
  return (
    <div className="bg-card flex flex-col gap-2 rounded-md border p-4">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        {icon}
        <span>{label}</span>
      </div>
      {isLoading ? (
        <Spinner className="text-muted-foreground size-5" />
      ) : isError ? (
        <span className="text-destructive text-sm">Failed to load</span>
      ) : (
        <span className="text-2xl font-semibold">{value ?? "—"}</span>
      )}
    </div>
  );
}

type SalesRow = { name: string; sold: number; img: string | null };

const CATEGORY_AXIS_WIDTH = 156;
const TICK_IMG_SIZE = 22;

// YAxis tick tùy biến: thumbnail (nếu có) + tên đã cắt gọn
function CategoryTick(props: {
  x?: number;
  y?: number;
  payload?: { value?: string; index?: number };
  data: SalesRow[];
  idPrefix: string;
}) {
  const { x = 0, y = 0, payload, data, idPrefix } = props;
  const row = payload?.index !== undefined ? data[payload.index] : undefined;
  const label = String(payload?.value ?? "");
  const truncated = label.length > 16 ? `${label.slice(0, 16)}…` : label;

  const startX = -CATEGORY_AXIS_WIDTH + 4;
  const hasImg = !!row?.img;
  const textX = startX + (hasImg ? TICK_IMG_SIZE + 8 : 0);
  const clipId = `${idPrefix}-tick-${payload?.index}`;

  return (
    <g transform={`translate(${x},${y})`}>
      {hasImg && (
        <>
          <clipPath id={clipId}>
            <rect x={startX} y={-TICK_IMG_SIZE / 2} width={TICK_IMG_SIZE} height={TICK_IMG_SIZE} rx={4} />
          </clipPath>
          <image
            href={row!.img!}
            x={startX}
            y={-TICK_IMG_SIZE / 2}
            width={TICK_IMG_SIZE}
            height={TICK_IMG_SIZE}
            clipPath={`url(#${clipId})`}
            preserveAspectRatio="xMidYMid slice"
          />
        </>
      )}
      <text x={textX} y={0} dy="0.32em" textAnchor="start" className="fill-muted-foreground text-xs">
        {truncated}
      </text>
    </g>
  );
}

type SalesChartCardProps = {
  title: string;
  subtitle: string;
  idPrefix: string;
  data: SalesRow[];
  isLoading: boolean;
  isError: boolean;
};

function SalesChartCard({ title, subtitle, idPrefix, data, isLoading, isError }: SalesChartCardProps) {
  return (
    <div className="bg-card flex flex-col gap-4 rounded-md border p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium">{title}</h2>
          <p className="text-muted-foreground text-xs">{subtitle}</p>
        </div>
        <TrendingUp className="text-muted-foreground size-4" />
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner className="text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="text-destructive flex h-64 items-center justify-center text-sm">
          Failed to load.
        </div>
      ) : data.length === 0 ? (
        <div className="text-muted-foreground flex h-64 items-center justify-center text-sm">
          No sales in this period.
        </div>
      ) : (
        <ChartContainer config={salesChartConfig} className="aspect-auto h-64 w-full">
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            margin={{ left: 8, right: 32 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis type="number" dataKey="sold" hide />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              width={CATEGORY_AXIS_WIDTH}
              interval={0}
              tick={<CategoryTick data={data} idPrefix={idPrefix} />}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar dataKey="sold" radius={4} fill="var(--color-sold)">
              <LabelList dataKey="sold" position="right" className="fill-foreground text-xs" />
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </div>
  );
}

import { capitalize } from "@/core/utils.ts";
import { Badge } from "@/components/shared/badge.tsx";
import type { SalesChannel } from "@/core/types.ts";

// màu badge dùng chung cho order.channel & customer.source
const SALES_CHANNEL_CLASS: Record<SalesChannel, string> = {
  WEBSITE: "bg-blue-100 text-blue-700",
  INSTAGRAM: "bg-pink-100 text-pink-700",
  FACEBOOK: "bg-indigo-100 text-indigo-700",
  TIKTOK: "bg-neutral-200 text-neutral-700",
  ZALO: "bg-sky-100 text-sky-700",
  SHOPEE: "bg-orange-100 text-orange-700",
  REFERRAL: "bg-teal-100 text-teal-700",
  OTHER: "bg-muted text-muted-foreground",
};

export function SalesChannelBadge({ channel }: { channel: SalesChannel }) {
  return <Badge label={capitalize(channel)} className={SALES_CHANNEL_CLASS[channel]} />;
}

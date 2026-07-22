import { capitalize } from "@/core/utils.ts";
import { Badge } from "@/components/shared/badge.tsx";
import type { SalesChannel } from "@/core/types.ts";

// màu badge dùng chung cho order.channel & customer.source
const SALES_CHANNEL_CLASS: Record<SalesChannel, string> = {
  WEBSITE: "bg-cyan-100 text-cyan-700",
  INSTAGRAM: "bg-pink-100 text-pink-700",
  FACEBOOK: "bg-blue-100 text-blue-700",
  TIKTOK: "bg-rose-100 text-rose-600",
  SHOPEE: "bg-orange-100 text-orange-700",
  REFERRAL: "bg-violet-100 text-violet-700",
  OTHER: "bg-muted text-muted-foreground",
};

export function SalesChannelBadge({ channel }: { channel: SalesChannel }) {
  return <Badge label={capitalize(channel)} className={SALES_CHANNEL_CLASS[channel]} />;
}

import type { ReactNode } from "react";

import type { PolicySection } from "@/components/shared/policy-page";

// Nội dung dài (văn bản pháp lý có định dạng) viết riêng theo từng ngôn ngữ, không nhét vào messages
export type PolicyContent = {
  title: string;
  updatedAt: string;
  intro: ReactNode;
  sections: PolicySection[];
};

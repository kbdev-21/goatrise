import type { PolicyContent } from "./types";

// giữ nguyên id của bản tiếng Việt để anchor (#bao-hanh...) giống nhau giữa hai ngôn ngữ
export const policiesEn: PolicyContent = {
  title: "Policies",
  updatedAt: "20.10.2026",
  intro: (
    <p>
      Your satisfaction is our RISE. Your satisfaction always comes first at
      GOAT RISE. Below are our warranty, exchange & return and shipping policies
      for shopping with us.
    </p>
  ),
  sections: [
    {
      id: "bao-hanh",
      title: "Warranty",
      content: (
        <p>
          GOAT RISE offers <strong>product exchanges</strong> within{" "}
          <strong>3 days of purchase</strong>. Exchanges are only available for
          a different size or another item of the same style; refunds are not
          offered. To be eligible, items must be unused, unwashed and have all
          original tags attached. Please contact us with your order number for
          instructions on sending your item back.
        </p>
      ),
    },
    {
      id: "doi-tra",
      title: "Returns",
      content: (
        <p>
          GOAT RISE only accepts returns for <strong>defective products</strong>{" "}
          caused by us, such as faulty stitching, fabric defects or tears,
          within <strong>3 days of purchase</strong>. If you find a defect,
          please message us with your order number and photos of the defect so
          we can review and resolve it as quickly as possible. Returns do not
          apply to cases that are not product defects.
        </p>
      ),
    },
    {
      id: "van-chuyen",
      title: "Shipping",
      content: (
        <p>
          GOAT RISE currently ships throughout Vietnam with{" "}
          <strong>cash on delivery (COD)</strong>. Orders are processed within
          1–2 business days and delivered within 2–5 days depending on your
          area. Shipping fees (if any) are shown at checkout. For orders outside
          Vietnam, please contact us for assistance.
        </p>
      ),
    },
  ],
};

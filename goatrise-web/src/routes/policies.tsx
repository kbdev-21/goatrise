import { createFileRoute } from "@tanstack/react-router";

import { PolicyPage } from "@/components/shared/policy-page";
import type { PolicySection } from "@/components/shared/policy-page";
import { seo } from "@/lib/seo";

// TODO: bảo hành + đổi trả dựa theo ảnh chính sách của GOAT RISE; vận chuyển là nội dung tạm
const SECTIONS: PolicySection[] = [
  {
    id: "bao-hanh",
    title: "Bảo hành",
    content: (
      <p>
        GOAT RISE hỗ trợ <strong>đổi sản phẩm</strong> trong vòng{" "}
        <strong>3 ngày kể từ ngày mua</strong>. Chính sách chỉ áp dụng đổi sang
        size khác hoặc đổi sang sản phẩm cùng mẫu, không áp dụng hoàn tiền. Để
        được đổi, sản phẩm cần chưa qua sử dụng, chưa giặt và còn nguyên tem mác
        ban đầu. Vui lòng liên hệ chúng tôi kèm mã đơn hàng để được hướng dẫn
        gửi sản phẩm đổi.
      </p>
    ),
  },
  {
    id: "doi-tra",
    title: "Đổi trả",
    content: (
      <p>
        GOAT RISE chỉ nhận trả hàng với <strong>sản phẩm bị lỗi</strong> từ phía
        chúng tôi, chẳng hạn lỗi đường may, lỗi vải hoặc sản phẩm bị rách, trong
        vòng <strong>3 ngày kể từ ngày mua</strong>. Khi phát hiện lỗi, bạn vui
        lòng nhắn cho chúng tôi kèm mã đơn hàng và hình ảnh của lỗi để được kiểm
        tra và xử lý nhanh nhất. Các trường hợp không thuộc lỗi sản phẩm sẽ
        không áp dụng trả hàng.
      </p>
    ),
  },
  {
    id: "van-chuyen",
    title: "Vận chuyển",
    content: (
      <p>
        GOAT RISE hiện giao hàng trên toàn lãnh thổ Việt Nam với hình thức{" "}
        <strong>thanh toán khi nhận hàng (COD)</strong>. Đơn hàng được xử lý
        trong 1–2 ngày làm việc và giao đến bạn trong khoảng 2–5 ngày tuỳ khu
        vực. Phí vận chuyển (nếu có) được hiển thị ở bước thanh toán. Với đơn
        hàng ngoài Việt Nam, vui lòng liên hệ chúng tôi để được hỗ trợ.
      </p>
    ),
  },
];

export const Route = createFileRoute("/policies")({
  head: () =>
    seo({
      title: "Chính sách",
      description:
        "Chính sách bảo hành, đổi trả và vận chuyển khi mua sắm tại GOAT RISE.",
      path: "/policies",
    }),
  component: PoliciesPage,
});

function PoliciesPage() {
  return (
    <PolicyPage
      title="Chính sách"
      updatedAt="20.10.2026"
      intro={
        <p>
          Your satisfaction is our RISE. Sự hài lòng của bạn là điều GOAT RISE
          luôn đặt lên hàng đầu, dưới đây là các chính sách bảo hành, đổi trả và
          vận chuyển khi mua sắm cùng chúng tôi.
        </p>
      }
      sections={SECTIONS}
    />
  );
}

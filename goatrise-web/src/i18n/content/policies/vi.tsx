import type { PolicyContent, PolicyId } from "./types";

// Cần xác nhận: địa chỉ đổi/trả, bên chịu phí vận chuyển, cách xử lý trả hàng lỗi
// (hoàn tiền hay đổi sản phẩm) và thời hạn bảo hành 3 ngày.
export const policiesVi: Record<PolicyId, PolicyContent> = {
  returns: {
    title: "Chính sách đổi trả",
    description:
      "Điều kiện và các bước đổi trả sản phẩm GOAT RISE trong 3 ngày kể từ ngày nhận hàng.",
    updatedAt: "03.11.2026",
    intro: (
      <p>
        Chúng tôi hỗ trợ đổi trả trong vòng <strong>3 ngày</strong> kể từ ngày
        bạn nhận hàng.
      </p>
    ),
    sections: [
      {
        id: "ho-tro",
        title: "Chúng tôi hỗ trợ",
        content: (
          <ul>
            <li>
              <strong>Đổi size hoặc đổi sản phẩm cùng loại:</strong> khi bạn
              nhận sản phẩm không đúng size.
            </li>
            <li>
              <strong>Trả hàng lỗi:</strong> khi sản phẩm bị lỗi từ nhà sản
              xuất, ví dụ lỗi đường may, lỗi vải, rách.
            </li>
          </ul>
        ),
      },
      {
        id: "dieu-kien",
        title: "Điều kiện",
        content: (
          <ul>
            <li>Sản phẩm chưa sử dụng.</li>
            <li>Sản phẩm chưa giặt.</li>
            <li>Còn nguyên tag và nhãn mác gốc.</li>
          </ul>
        ),
      },
      {
        id: "video",
        title: "Quay video để được xử lý nhanh hơn",
        content: (
          <p>
            Bạn hãy quay video cho thấy rõ tình trạng sản phẩm (lỗi hoặc size
            không đúng) và gửi kèm mã đơn hàng. Có video, chúng tôi kiểm tra và
            xử lý nhanh hơn.
          </p>
        ),
      },
      {
        id: "cac-buoc",
        title: "Các bước thực hiện",
        content: (
          <ol>
            <li>
              Liên hệ GOAT RISE trong vòng 3 ngày kể từ ngày nhận hàng, qua số
              điện thoại hoặc trang social. Gửi kèm mã đơn hàng và video.
            </li>
            <li>GOAT RISE xác nhận trường hợp của bạn.</li>
            <li>Bạn gửi sản phẩm về theo hướng dẫn của GOAT RISE.</li>
            <li>
              GOAT RISE gửi sản phẩm mới đến bạn đối với trường hợp đổi hàng.
              Với trường hợp trả hàng lỗi, chúng tôi xác nhận cách xử lý khi
              liên hệ.
            </li>
          </ol>
        ),
      },
      {
        id: "khong-ap-dung",
        title: "Chúng tôi không thể đổi trả khi",
        content: (
          <ul>
            <li>Đã quá 3 ngày kể từ ngày nhận hàng.</li>
            <li>Sản phẩm đã sử dụng, đã giặt hoặc mất tag, nhãn mác.</li>
            <li>
              Sản phẩm hư hỏng do sử dụng hoặc bảo quản chưa đúng hướng dẫn.
            </li>
          </ul>
        ),
      },
    ],
  },
  payment: {
    title: "Chính sách thanh toán",
    description:
      "Thanh toán đơn hàng GOAT RISE bằng chuyển khoản ngân hàng hoặc thanh toán khi nhận hàng (COD).",
    updatedAt: "03.11.2026",
    intro: <p>Bạn có 2 cách thanh toán, chọn cách thuận tiện nhất với mình.</p>,
    sections: [
      {
        id: "hinh-thuc",
        title: "Hình thức thanh toán",
        content: (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left [&_td]:border-b [&_td]:border-border [&_td]:py-4 [&_td]:pr-4 [&_td]:align-top [&_th]:border-b [&_th]:border-border [&_th]:py-3 [&_th]:pr-4 [&_th]:align-top [&_th]:font-semibold">
              <thead>
                <tr>
                  <th scope="col">Hình thức</th>
                  <th scope="col">Cách thực hiện</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Chuyển khoản ngân hàng (Banking)</th>
                  <td>
                    Chuyển khoản theo thông tin tài khoản GOAT RISE gửi khi xác
                    nhận đơn hàng.{" "}
                    <strong>
                      Chỉ duy nhất 1 tài khoản ngân hàng: CONG TY TNHH GOAT
                      RISE.
                    </strong>{" "}
                    Các tài khoản khác không được công nhận là tài khoản thanh
                    toán của GOAT RISE.
                  </td>
                </tr>
                <tr>
                  <th scope="row">Thanh toán khi nhận hàng (COD)</th>
                  <td>
                    Thanh toán trực tiếp cho đơn vị vận chuyển khi nhận sản
                    phẩm.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ),
      },
    ],
  },
  warranty: {
    title: "Chính sách bảo hành",
    description:
      "Các lỗi từ nhà sản xuất được GOAT RISE bảo hành, cách liên hệ và các trường hợp không thuộc phạm vi bảo hành.",
    updatedAt: "03.11.2026",
    intro: <p>GOAT RISE bảo hành mọi lỗi phát sinh từ nhà sản xuất.</p>,
    sections: [
      {
        id: "loi-bao-hanh",
        title: "Các lỗi được bảo hành",
        content: (
          <ul>
            <li>Rách.</li>
            <li>Bung chỉ, sổ đường may.</li>
            <li>Lỗi vải.</li>
            <li>Sản phẩm không đúng màu.</li>
          </ul>
        ),
      },
      {
        id: "cach-bao-hanh",
        title: "Cách bảo hành",
        content: (
          <p>
            Chúng tôi đổi cho bạn sản phẩm cùng loại. Bạn liên hệ trong vòng{" "}
            <strong>3 ngày</strong> kể từ ngày nhận hàng, kèm video hoặc hình
            ảnh ghi lại lỗi để được xử lý nhanh hơn.
          </p>
        ),
      },
      {
        id: "khong-bao-hanh",
        title: "Không thuộc phạm vi bảo hành",
        content: (
          <ul>
            <li>Hư hỏng do sử dụng sai cách hoặc tác động bên ngoài.</li>
            <li>
              Giặt, sấy, ủi, tẩy không đúng hướng dẫn bảo quản trên nhãn sản
              phẩm.
            </li>
            <li>Sản phẩm đã bị tự ý chỉnh sửa.</li>
          </ul>
        ),
      },
    ],
  },
};

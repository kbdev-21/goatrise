import type { PolicyContent, PolicyId } from "./types";

export const policiesEn: Record<PolicyId, PolicyContent> = {
  returns: {
    title: "Exchange & return policy",
    description:
      "Conditions and steps for exchanging or returning GOAT RISE products within 3 days of delivery.",
    updatedAt: "03.11.2026",
    intro: (
      <p>
        We accept exchange and return requests within <strong>3 days</strong> of
        receiving your order.
      </p>
    ),
    sections: [
      {
        id: "ho-tro",
        title: "How we can help",
        content: (
          <ul>
            <li>
              <strong>
                Exchange for another size or a product of the same type:
              </strong>{" "}
              if the item you receive is not the right size.
            </li>
            <li>
              <strong>Return defective items:</strong> for manufacturing defects
              such as faulty stitching, fabric defects or tears.
            </li>
          </ul>
        ),
      },
      {
        id: "dieu-kien",
        title: "Conditions",
        content: (
          <ul>
            <li>Items must be unused.</li>
            <li>Items must be unwashed.</li>
            <li>All original tags and labels must remain attached.</li>
          </ul>
        ),
      },
      {
        id: "video",
        title: "Record a video for faster support",
        content: (
          <p>
            Please record a video clearly showing the condition of your item
            (the defect or incorrect size) and send it with your order number. A
            video helps us review and resolve your request faster.
          </p>
        ),
      },
      {
        id: "cac-buoc",
        title: "Steps to follow",
        content: (
          <ol>
            <li>
              Contact GOAT RISE within 3 days of receiving your order, by phone
              or social media. Include your order number and video.
            </li>
            <li>GOAT RISE reviews and confirms your case.</li>
            <li>Send the item back following instructions from GOAT RISE.</li>
            <li>
              GOAT RISE sends a replacement for exchanges. For defective
              returns, we confirm the resolution when you contact us.
            </li>
          </ol>
        ),
      },
      {
        id: "khong-ap-dung",
        title: "When exchanges and returns are unavailable",
        content: (
          <ul>
            <li>More than 3 days have passed since delivery.</li>
            <li>
              The item has been used, washed, or is missing its original tags or
              labels.
            </li>
            <li>
              The item was damaged through use or care that did not follow the
              instructions.
            </li>
          </ul>
        ),
      },
    ],
  },
  payment: {
    title: "Payment policy",
    description:
      "Pay for your GOAT RISE order by bank transfer or cash on delivery (COD).",
    updatedAt: "03.11.2026",
    intro: <p>Choose whichever of our 2 payment methods works best for you.</p>,
    sections: [
      {
        id: "hinh-thuc",
        title: "Payment methods",
        content: (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left [&_td]:border-b [&_td]:border-border [&_td]:py-4 [&_td]:pr-4 [&_td]:align-top [&_th]:border-b [&_th]:border-border [&_th]:py-3 [&_th]:pr-4 [&_th]:align-top [&_th]:font-semibold">
              <thead>
                <tr>
                  <th scope="col">Method</th>
                  <th scope="col">How to pay</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Bank transfer</th>
                  <td>
                    Transfer to the account details GOAT RISE provides when
                    confirming your order.{" "}
                    <strong>
                      Our only bank account is held under CONG TY TNHH GOAT
                      RISE.
                    </strong>{" "}
                    Other accounts are not recognized as GOAT RISE payment
                    accounts.
                  </td>
                </tr>
                <tr>
                  <th scope="row">Cash on delivery (COD)</th>
                  <td>
                    Pay the delivery provider directly when you receive your
                    items.
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
    title: "Warranty policy",
    description:
      "Manufacturing defects covered by GOAT RISE, how to request a replacement and warranty exclusions.",
    updatedAt: "03.11.2026",
    intro: <p>GOAT RISE covers all manufacturing defects.</p>,
    sections: [
      {
        id: "loi-bao-hanh",
        title: "Covered defects",
        content: (
          <ul>
            <li>Tears.</li>
            <li>Loose threads or undone seams.</li>
            <li>Fabric defects.</li>
            <li>Items in the wrong color.</li>
          </ul>
        ),
      },
      {
        id: "cach-bao-hanh",
        title: "How the warranty works",
        content: (
          <p>
            We replace your item with a product of the same type. Contact us
            within <strong>3 days</strong> of receiving your order, with a video
            or photos showing the defect so we can help you faster.
          </p>
        ),
      },
      {
        id: "khong-bao-hanh",
        title: "Warranty exclusions",
        content: (
          <ul>
            <li>Damage caused by misuse or external impact.</li>
            <li>
              Washing, drying, ironing or bleaching that does not follow the
              care label.
            </li>
            <li>Items that have been altered without authorization.</li>
          </ul>
        ),
      },
    ],
  },
};

import type { ReactNode } from "react";

// Bản gốc của toàn bộ chữ trên giao diện. en.tsx bắt buộc có đúng các key này (kiểu Messages).
// Giá trị là hàm khi chuỗi có biến; trả về JSX khi cần chèn phần tử (vd mã đơn in đậm).
export const vi = {
  common: {
    loading: "Đang tải…",
    retry: "Thử lại",
    seeAll: "Xem tất cả",
    continueShopping: "Tiếp tục mua sắm",
    contactUs: "Liên hệ chúng tôi",
    close: "Đóng",
    cancel: "Huỷ",
    save: "Lưu",
    saving: "Đang lưu…",
    update: "Cập nhật",
    noImage: "Chưa có ảnh",
    contactForPrice: "Liên hệ",
    noProducts: "Chưa có sản phẩm nào.",
    productCount: (count: number) => `${count} sản phẩm`,
    homeAriaLabel: "GOAT RISE — về trang chủ",
  },

  ui: {
    combobox: {
      placeholder: "Chọn",
      searchPlaceholder: "Tìm kiếm…",
      empty: "Không tìm thấy kết quả",
    },
    rangeSlider: {
      min: "Giá trị nhỏ nhất",
      max: "Giá trị lớn nhất",
    },
    sheetClose: "Close",
  },

  notFound: {
    message: "The requested page could not be found.",
  },

  seo: {
    defaultTitle: "GOAT RISE - Vietnam, Activewear & Classic For Life",
    defaultDescription:
      "GOAT RISE - thương hiệu hoạt phục và thời trang cổ điển Việt Nam, được thiết kế để đồng hành cùng bạn mỗi ngày: bền bỉ, tối giản, tốt hơn một chút sau mỗi lần mặc.",
    products: {
      title: "Sản phẩm",
      description:
        "Mua sắm hoạt phục và thời trang cổ điển GOAT RISE: áo, quần và phụ kiện được thiết kế để đồng hành cùng bạn mỗi ngày.",
    },
    collections: {
      title: "Bộ sưu tập",
      description:
        "Khám phá các bộ sưu tập của GOAT RISE - hoạt phục và thời trang cổ điển được thiết kế để đồng hành cùng bạn mỗi ngày.",
    },
    about: {
      title: "Về chúng tôi",
      description:
        "GOAT RISE là thương hiệu thời trang Việt Nam, thành lập năm 2026, lan toả tinh thần tiến bộ mỗi ngày qua thời trang, hành động và cộng đồng.",
    },
    policies: {
      title: "Chính sách",
      description:
        "Chính sách đổi trả, thanh toán và bảo hành khi mua sắm tại GOAT RISE.",
    },
    checkout: { title: "Thanh toán" },
    account: { title: "Tài khoản" },
  },

  nav: {
    products: "Sản phẩm",
    collections: "Bộ sưu tập",
    about: "Về chúng tôi",
  },

  header: {
    menu: "Menu",
    search: "Tìm kiếm",
    account: "Tài khoản",
    cart: "Giỏ hàng",
    cartAriaLabel: (count: number) =>
      count > 0 ? `Giỏ hàng, ${count} sản phẩm` : "Giỏ hàng, đang trống",
  },

  footer: {
    policies: "Chính sách",
    description: "Vietnam, Activewear & Classic for Life",
    explore: "Khám phá",
    connect: "Kết nối",
    instagramAriaLabel: "GOAT RISE trên Instagram (mở trong tab mới)",
    facebookAriaLabel: "GOAT RISE trên Facebook (mở trong tab mới)",
    tiktokAriaLabel: "GOAT RISE trên TikTok (mở trong tab mới)",
  },

  search: {
    title: "Tìm kiếm sản phẩm",
    description: "Gõ tên sản phẩm để tìm, nhấn Enter để mở kết quả đầu tiên",
    placeholder: "Tìm sản phẩm",
    clear: "Xóa nội dung tìm kiếm",
    bestSellers: "Bán chạy",
    resultsFor: (count: number, query: string) =>
      `${count} kết quả cho “${query}”`,
    noResults: (query: string) =>
      `Không tìm thấy sản phẩm nào cho “${query}”. Thử từ khóa ngắn hơn hoặc gõ không dấu.`,
    youMayLike: "Có thể bạn thích",
  },

  cart: {
    title: (count: number) => (count > 0 ? `Giỏ hàng (${count})` : "Giỏ hàng"),
    description: "Danh sách sản phẩm đang có trong giỏ hàng",
    empty: "Giỏ hàng của bạn đang trống.",
    unavailableWarning:
      "Một vài sản phẩm không còn khả dụng, vui lòng xoá khỏi giỏ trước khi thanh toán.",
    shippingNote: "Phí vận chuyển được tính ở bước thanh toán.",
    checkout: "Thanh toán",
    remove: "Xoá khỏi giỏ hàng",
    unavailable: "Sản phẩm không còn khả dụng",
    lowStock: (stock: number) => `Chỉ còn ${stock} sản phẩm`,
    decrease: "Giảm số lượng",
    increase: "Tăng số lượng",
  },

  product: {
    details: "Thông tin chi tiết",
    policy: "Chính sách",
    policySummary: [
      "Hỗ trợ đổi size hoặc sản phẩm cùng loại khi nhận không đúng size, và trả hàng lỗi từ nhà sản xuất trong 3 ngày kể từ ngày nhận hàng. Sản phẩm cần chưa sử dụng, chưa giặt và còn nguyên tag, nhãn mác.",
      "Bảo hành lỗi từ nhà sản xuất bằng cách đổi sản phẩm cùng loại. Liên hệ trong 3 ngày kể từ ngày nhận hàng, kèm video hoặc hình ảnh lỗi.",
      "Thanh toán bằng chuyển khoản vào tài khoản CONG TY TNHH GOAT RISE hoặc thanh toán khi nhận hàng (COD).",
    ],
    fullPolicy: "Xem chính sách đầy đủ",
    updating: "Đang cập nhật.",
    color: "Màu sắc",
    size: "Size",
    quantity: "Số lượng",
    addToCart: "Thêm vào giỏ hàng",
    outOfStock: "Hết hàng",
    sizeChart: "Bảng size",
    sizeChartAlt: (title: string) => `Bảng size ${title}`,
    imageAlt: (title: string, index: number) => `${title} ${index}`,
    related: "Có thể bạn cũng thích",
  },

  products: {
    title: "Sản phẩm",
    categoriesAriaLabel: "Danh mục sản phẩm",
    all: "Tất cả",
    sortLabel: "Sắp xếp",
    sort: {
      featured: "Nổi bật",
      "best-selling": "Bán chạy",
      newest: "Mới nhất",
      "price-asc": "Giá tăng dần",
      "price-desc": "Giá giảm dần",
    },
    filter: "Bộ lọc",
    price: "Giá",
    color: (selected: number) =>
      selected > 0 ? `Màu sắc (${selected})` : "Màu sắc",
    clearFilters: "Xóa bộ lọc",
    showResults: (count: number) => `Xem ${count} sản phẩm`,
    clearAll: "Xóa tất cả",
    noMatch: "Không có sản phẩm nào phù hợp với bộ lọc.",
    removeFilter: (label: string) => `Bỏ lọc ${label}`,
    priceMin: "Giá thấp nhất",
    priceMax: "Giá cao nhất",
  },

  collections: {
    title: "Bộ sưu tập",
    count: (count: number) => `${count} bộ sưu tập`,
    empty: "Chưa có bộ sưu tập nào.",
    view: "Xem bộ sưu tập",
    noProducts: "Bộ sưu tập này chưa có sản phẩm nào.",
  },

  about: {
    title: "ABOUT GOAT RISE",
    images: {
      founder: "Trần Gia Lập, CEO và nhà sáng lập GOAT RISE",
      cofounders: "Nhóm co-founder GOAT RISE, còn gọi là Chuồng Dê",
      movement:
        "Hình ảnh GOAT RISE với vận động viên bật nhảy trên nền trời xanh",
      tennis: "Hình ảnh GOAT RISE với vận động viên giao bóng tennis",
      basketball: "Hình ảnh GOAT RISE với vận động viên úp rổ bóng rổ",
      labels: "Nhãn áo GOAT RISE với dòng chữ Made in Viet Nam",
    },
    intro:
      "GOAT RISE là thương hiệu thời trang Việt Nam, thành lập năm 2026. Chúng tôi đại diện cho một mindset giản dị: tiến bộ thật sự bắt đầu từ mỗi ngày, và muốn lan toả nó qua thời trang.",
    founder: {
      role: "CEO & Founder",
      quote: "Sẽ không bao giờ là kết thúc trừ khi tâm trí mày bảo nó kết thúc",
      name: "Trần Gia Lập",
      cofounders:
        "Các co-founder khác hay còn gọi là Chuồng Dê: đơn giản vì cả đám đều tuổi con dê",
    },
    goat: {
      title: "VẬY AI MỚI THẬT SỰ LÀ GOAT?",
      paragraph:
        "GOAT hay còn gọi là Greatest Of All Time. Nhưng chúng tôi muốn nhìn theo một cách khác. Chúng tôi không theo đuổi hình ảnh của người giỏi nhất. Chúng tôi theo đuổi phiên bản tốt hơn của chính mình hôm qua. GOAT thật sự không phải là ai đó đứng trên bạn, mà là người vẫn xuất hiện mỗi ngày và tốt hơn một chút.",
    },
    rise: {
      title: "VẬY LÀM THẾ NÀO ĐỂ TRỞ THÀNH GOAT?",
      lead: "Tất cả nằm ở chữ RISE",
      tagline: "REAL IMPROVEMENTS START EVERYDAY.",
      paragraph:
        "Bạn chỉ thật sự trở thành phiên bản tốt nhất khi mindset của bạn chấp nhận rằng mình phải tốt hơn version của ngày hôm qua. Không phải bằng một khoảnh khắc lớn, mà bằng những lựa chọn nhỏ được lặp lại mỗi ngày. Không cần là người giỏi nhất. Chỉ cần tốt hơn hôm qua",
    },
    mission: {
      title: "TẦM NHÌN VÀ SỨ MỆNH",
      intro:
        "Chúng tôi mong GOAT RISE không chỉ được nhớ đến như một thương hiệu thời trang.",
      visionLabel: "Tầm nhìn",
      vision: "một thương hiệu khiến mọi người muốn sống tốt hơn.",
      missionLabel: "Sứ mệnh",
      mission:
        "truyền cảm hứng bằng hành động, sản phẩm và cộng đồng, bắt đầu từ Việt Nam và vươn ra thế giới.",
      closing:
        "Một sản phẩm sẽ không thay đổi cuộc đời bạn. Nhưng nếu mỗi lần mặc nó, bạn lại nhớ rằng mình còn có thể cố gắng thêm một chút, thì sản phẩm ấy đã hoàn thành sứ mệnh của nó.",
    },
    promise: {
      title: "LỜI HỨA CỦA CHÚNG TÔI",
      paragraph:
        "Chúng tôi sẽ luôn tiếp tục học hỏi. Tiếp tục cải thiện. Bởi vì tinh thần của GOAT RISE chưa bao giờ là trở thành số một. Mà là không bao giờ ngừng tiến lên.",
    },
  },

  // ô nhập dùng chung cho form thanh toán và form thông tin mua hàng (tài khoản)
  form: {
    fullName: "Họ và tên",
    namePlaceholder: "Nguyễn Văn A",
    phone: "Số điện thoại",
    phonePlaceholder: "0912 345 678",
    email: "Email",
    emailPlaceholder: "ban@email.com",
    countryPlaceholder: "Chọn quốc gia",
    countrySearch: "Tìm quốc gia…",
    provincePlaceholder: "Chọn tỉnh / thành phố",
    provinceSearch: "Tìm tỉnh / thành phố…",
    addressPlaceholder: "Số nhà, tên đường, phường / xã, quận / huyện",
    nameRequired: "Vui lòng nhập họ và tên.",
    phoneRequired: "Vui lòng nhập số điện thoại.",
  },

  // nhãn tiền / trạng thái đơn dùng chung cho thanh toán và lịch sử đơn
  order: {
    code: (code: string) => `Đơn ${code}`,
    subtotal: "Tạm tính",
    couponDiscount: "Giảm giá (mã)",
    couponDiscountWithCode: (code: string) => `Giảm giá (mã ${code})`,
    comboDiscount: "Giảm giá (combo)",
    otherDiscount: "Giảm giá khác",
    shipping: "Phí vận chuyển",
    free: "Miễn phí",
    tax: "Thuế",
    total: "Tổng cộng",
    status: {
      cancelled: "Đã huỷ",
      pending: "Chờ xác nhận",
    },
    deliveryStatus: {
      PENDING: "Đang chuẩn bị",
      SHIPPING: "Đang giao",
      DELIVERED: "Đã giao",
      RETURNED: "Đã hoàn trả",
    },
    paymentMethod: {
      COD: "Thanh toán khi nhận hàng (COD)",
      MANUAL_TRANSFER: "Chuyển khoản",
      MOMO: "MoMo",
      VNPAY: "VNPay",
      STRIPE: "Thẻ quốc tế",
    },
    paymentStatus: {
      UNPAID: "Chưa thanh toán",
      PAID: "Đã thanh toán",
      REFUNDED: "Đã hoàn tiền",
    },
  },

  checkout: {
    title: "Thanh toán",
    emptyCart: "Giỏ hàng của bạn đang trống nên chưa thể thanh toán.",
    contactSection: "Thông tin liên hệ",
    shippingSection: "Địa chỉ giao hàng",
    country: "Quốc gia",
    province: "Tỉnh / Thành phố",
    addressDetail: "Địa chỉ chi tiết",
    paymentSection: "Phương thức thanh toán",
    noteSection: "Ghi chú",
    noteLabel: "Ghi chú cho đơn hàng",
    notePlaceholder: "Thời gian nhận hàng, hướng dẫn giao hàng…",
    optional: "(không bắt buộc)",
    orderSection: "Đơn hàng",
    couponPlaceholder: "Mã giảm giá",
    clearCoupon: "Xoá mã giảm giá",
    apply: "Áp dụng",
    shippingPending: "Tính khi xác nhận",
    internationalNote: "Vui lòng liên hệ chúng tôi cho đơn ngoài Việt Nam",
    placeOrder: "Đặt hàng",
    placingOrder: "Đang đặt hàng…",
    successTitle: "Đặt hàng thành công",
    successCode: (code: ReactNode) => (
      <>
        Mã đơn của bạn là {code}. Hãy theo dõi email để nhận thông tin đơn hàng
        chi tiết.
      </>
    ),
    successTotal: (total: ReactNode) => <>Tổng cộng: {total}</>,
    // chỉ hiện khi đang xem giá quy đổi (không phải VND)
    chargedInVnd: (amount: string) => `Thanh toán bằng VND: ${amount}`,
    errors: {
      couponNeedsPhone:
        "Vui lòng nhập số điện thoại trước khi áp dụng mã giảm giá.",
      calculateFailed: "Không tính được đơn hàng.",
      noAvailableLines: "Giỏ hàng của bạn không có sản phẩm nào còn bán được.",
      emailRequired: "Vui lòng nhập email.",
      provinceRequired: "Vui lòng chọn tỉnh / thành phố.",
      addressRequired: "Vui lòng nhập địa chỉ chi tiết.",
      placeFailed: "Đặt hàng thất bại. Vui lòng thử lại.",
    },
  },

  account: {
    title: "Tài khoản",
    shop: "Cửa hàng",
    signOut: "Đăng xuất",
    signingOut: "Đang đăng xuất…",
    backHome: "Về trang chủ",
    signIn: "Đăng nhập",
    signInSubtitle: "Trở thành thành viên của GOAT RISE",
    continueWithGoogle: "Tiếp tục với Google",
    redirectingToGoogle: "Đang chuyển tới Google…",
    googleError: "Không thể kết nối tới Google. Vui lòng thử lại.",
    purchaseInfo: "Thông tin mua hàng",
    purchaseInfoDescription: "Tên, số điện thoại và địa chỉ nhận hàng của bạn.",
    notUpdated: "Chưa cập nhật",
    address: "Địa chỉ",
    addressN: (index: number) => `Địa chỉ ${index}`,
    addressDetailN: (index: number) => `Địa chỉ chi tiết ${index}`,
    removeAddressN: (index: number) => `Xoá địa chỉ ${index}`,
    addAddress: "Thêm địa chỉ",
    noAddress: "Chưa có địa chỉ nào.",
    noPurchaseInfo:
      "Bạn chưa có thông tin mua hàng. Bấm cập nhật để thêm tên, số điện thoại và địa chỉ nhận hàng.",
    totalOrders: "Tổng đơn hàng",
    totalSpent: "Tổng chi tiêu",
    loadProfileError: "Không tải được thông tin tài khoản.",
    myOrders: "Đơn hàng của tôi",
    loadOrdersError: "Không tải được đơn hàng.",
    noOrders: "Bạn chưa có đơn hàng nào.",
    shopNow: "Mua sắm ngay",
    loadMoreError: "Không tải thêm được đơn hàng.",
    loadMore: "Xem thêm",
    recipient: "Người nhận",
    payment: "Thanh toán",
    errors: {
      phoneInvalid: "Số điện thoại không hợp lệ.",
      provinceRequired: (index: number) =>
        `Địa chỉ ${index}: vui lòng chọn tỉnh / thành phố.`,
      addressRequired: (index: number) =>
        `Địa chỉ ${index}: vui lòng nhập địa chỉ chi tiết.`,
      updateFailed: "Cập nhật thất bại. Vui lòng thử lại.",
    },
  },

  // nút nổi góc dưới phải: chuyển ngôn ngữ + tiền tệ
  localeSwitcher: {
    label: "Ngôn ngữ và tiền tệ",
    vi: "Tiếng Việt, VND",
    en: "English, USD",
  },

  policyPage: {
    updated: (date: string) => `Cập nhật ${date}`,
    tableOfContents: "Mục lục",
    helpTitle: "Cần hỗ trợ thêm?",
    helpBody:
      "Nhắn cho GOAT RISE qua Instagram, chúng tôi sẽ phản hồi trong giờ làm việc.",
  },

  home: {
    intro: {
      ariaLabel: "Giới thiệu GOAT RISE",
      greetingAriaLabel: "Hey Goat, ready to rise?",
      // mỗi phần tử là một từ trồi lên riêng trong màn mở đầu
      greeting: ["Hey", "Goat,", "Ready", "to", "Rise?"],
    },
    hero: {
      cta: "Khám phá",
      // dùng khi chưa có COLLECTION nào được featured
      fallbackDescription:
        "Bộ sưu tập đầu tiên của GOAT RISE - hoạt phục và thời trang cổ điển được thiết kế để đồng hành cùng bạn mỗi ngày.",
    },
    featuredProducts: {
      title: "Sản phẩm nổi bật",
    },
    featuredCollections: {
      cta: "Shop now",
    },
    collectionStack: {
      title: "Bộ sưu tập",
    },
    brandIntro: {
      manifesto:
        "Với chúng tôi, GOAT không phải danh hiệu cho ai khác. Đó là phiên bản tốt nhất của chính bạn, và bạn tạo ra nó mỗi ngày. Mỗi món đồ của GOAT RISE nhắc bạn nhớ mục tiêu mình đang theo đuổi, và ý chí không bỏ cuộc của chính mình.",
      eyebrow: "GOAT RISE · FOUNDED IN 2026",
      // mỗi phần tử là một dòng
      tagline: ["Real Improvements Start Everyday"],
      follow: "Follow Us",
    },
    scrollManifesto: {
      marqueeTop: ["Real Improvement", "Start Everyday"],
      marqueeBottom: ["Bền bỉ", "Tối giản", "Tốt hơn mỗi ngày"],
      eyebrow: "Goat Rise · Est. 2026",
      // mỗi phần tử là một dòng
      headline: ["Mọi thứ đều", "chuyển động"],
      subline: "Trừ tiêu chuẩn của chúng tôi.",
    },
  },
};

export type Messages = typeof vi;

import type { ReactNode } from "react";

import type { Messages } from "./vi";

// Bản dịch tiếng Anh: kiểu Messages bắt buộc đủ và đúng các key của vi.tsx
export const en: Messages = {
  common: {
    loading: "Loading…",
    retry: "Try again",
    seeAll: "View all",
    continueShopping: "Continue shopping",
    contactUs: "Contact us",
    close: "Close",
    cancel: "Cancel",
    save: "Save",
    saving: "Saving…",
    update: "Edit",
    noImage: "No image yet",
    contactForPrice: "Contact us",
    noProducts: "No products yet.",
    productCount: (count: number) =>
      `${count} ${count === 1 ? "product" : "products"}`,
    homeAriaLabel: "GOAT RISE — back to home",
  },

  ui: {
    combobox: {
      placeholder: "Select",
      searchPlaceholder: "Search…",
      empty: "No results found",
    },
    rangeSlider: {
      min: "Minimum value",
      max: "Maximum value",
    },
    sheetClose: "Close",
  },

  notFound: {
    message: "The requested page could not be found.",
  },

  seo: {
    defaultTitle: "GOAT RISE - Vietnam, Activewear & Classic For Life",
    defaultDescription:
      "GOAT RISE - a Vietnamese activewear and classic fashion brand, designed to be with you every day: durable, minimal, and a little better every time you wear it.",
    products: {
      title: "Products",
      description:
        "Shop GOAT RISE activewear and classic fashion: tops, bottoms and accessories designed to be with you every day.",
    },
    collections: {
      title: "Collections",
      description:
        "Explore the GOAT RISE collections - activewear and classic fashion designed to be with you every day.",
    },
    about: {
      title: "About us",
      description:
        "The story of GOAT RISE - a Vietnamese activewear and classic fashion brand, making clothes for a steady, everyday rhythm.",
    },
    policies: {
      title: "Policies",
      description:
        "Warranty, exchange & return and shipping policies when shopping at GOAT RISE.",
    },
    checkout: { title: "Checkout" },
    account: { title: "Account" },
  },

  nav: {
    products: "Products",
    collections: "Collections",
    about: "About us",
  },

  header: {
    menu: "Menu",
    search: "Search",
    account: "Account",
    cart: "Cart",
    cartAriaLabel: (count: number) =>
      count > 0
        ? `Cart, ${count} ${count === 1 ? "item" : "items"}`
        : "Cart, empty",
  },

  footer: {
    policies: "Policies",
  },

  search: {
    title: "Search products",
    description:
      "Type a product name to search, press Enter to open the first result",
    placeholder: "Search products",
    clear: "Clear search",
    bestSellers: "Best sellers",
    resultsFor: (count: number, query: string) =>
      `${count} ${count === 1 ? "result" : "results"} for “${query}”`,
    noResults: (query: string) =>
      `No products found for “${query}”. Try a shorter keyword.`,
    youMayLike: "You may like",
  },

  cart: {
    title: (count: number) => (count > 0 ? `Cart (${count})` : "Cart"),
    description: "Products currently in your cart",
    empty: "Your cart is empty.",
    unavailableWarning:
      "Some products are no longer available, please remove them from your cart before checking out.",
    shippingNote: "Shipping is calculated at checkout.",
    checkout: "Checkout",
    remove: "Remove from cart",
    unavailable: "This product is no longer available",
    lowStock: (stock: number) => `Only ${stock} left`,
    decrease: "Decrease quantity",
    increase: "Increase quantity",
  },

  product: {
    details: "Details",
    policy: "Policies",
    updating: "Coming soon.",
    color: "Color",
    size: "Size",
    quantity: "Quantity",
    addToCart: "Add to cart",
    outOfStock: "Sold out",
    sizeChart: "Size chart",
    sizeChartAlt: (title: string) => `${title} size chart`,
    imageAlt: (title: string, index: number) => `${title} ${index}`,
    related: "You may also like",
  },

  products: {
    title: "Products",
    categoriesAriaLabel: "Product categories",
    all: "All",
    sortLabel: "Sort",
    sort: {
      featured: "Featured",
      "best-selling": "Best selling",
      newest: "Newest",
      "price-asc": "Price: low to high",
      "price-desc": "Price: high to low",
    },
    filter: "Filter",
    price: "Price",
    color: (selected: number) =>
      selected > 0 ? `Color (${selected})` : "Color",
    clearFilters: "Clear filters",
    showResults: (count: number) =>
      `View ${count} ${count === 1 ? "product" : "products"}`,
    clearAll: "Clear all",
    noMatch: "No products match your filters.",
    removeFilter: (label: string) => `Remove filter ${label}`,
    priceMin: "Lowest price",
    priceMax: "Highest price",
  },

  collections: {
    title: "Collections",
    count: (count: number) =>
      `${count} ${count === 1 ? "collection" : "collections"}`,
    empty: "No collections yet.",
    view: "View collection",
    noProducts: "This collection has no products yet.",
  },

  about: {
    eyebrow: "Goat Rise · Est. 2026",
    title: "About us",
    heading: ["Activewear", "& Classic", "For Life"],
    story: [
      "GOAT RISE is a Vietnamese activewear and classic fashion brand, born from a simple idea: training clothes shouldn't only look good on the court, and everyday clothes shouldn't be afraid to move.",
      "We take our cues from classic sportswear, the tipped polos and clean-cut shorts of the tennis court, and rework them in fabrics and fits made for life today: breathable, durable, easy to style, from a morning session to an evening out.",
    ],
    imageAlt: ["GOAT RISE on the tennis court", "GOAT RISE polo and skirt"],
    closingEyebrow: "Hey Goat,",
    closingTitle: "Ready to rise?",
    shop: "Shop products",
    follow: "Follow on Instagram",
  },

  form: {
    fullName: "Full name",
    namePlaceholder: "John Smith",
    phone: "Phone number",
    phonePlaceholder: "+1 555 123 4567",
    email: "Email",
    emailPlaceholder: "you@email.com",
    countryPlaceholder: "Select country",
    countrySearch: "Search country…",
    provincePlaceholder: "Select province / city",
    provinceSearch: "Search province / city…",
    addressPlaceholder: "House number, street, ward, district",
    nameRequired: "Please enter your full name.",
    phoneRequired: "Please enter your phone number.",
  },

  order: {
    code: (code: string) => `Order ${code}`,
    subtotal: "Subtotal",
    couponDiscount: "Discount (code)",
    couponDiscountWithCode: (code: string) => `Discount (code ${code})`,
    comboDiscount: "Discount (bundle)",
    otherDiscount: "Other discount",
    shipping: "Shipping",
    free: "Free",
    tax: "Tax",
    total: "Total",
    status: {
      cancelled: "Cancelled",
      pending: "Awaiting confirmation",
    },
    deliveryStatus: {
      PENDING: "Preparing",
      SHIPPING: "Shipping",
      DELIVERED: "Delivered",
      RETURNED: "Returned",
    },
    paymentMethod: {
      COD: "Cash on delivery (COD)",
      MANUAL_TRANSFER: "Bank transfer",
      MOMO: "MoMo",
      VNPAY: "VNPay",
      STRIPE: "International card",
    },
    paymentStatus: {
      UNPAID: "Unpaid",
      PAID: "Paid",
      REFUNDED: "Refunded",
    },
  },

  checkout: {
    title: "Checkout",
    emptyCart: "Your cart is empty, so there is nothing to check out yet.",
    contactSection: "Contact information",
    shippingSection: "Shipping address",
    country: "Country",
    province: "Province / City",
    addressDetail: "Street address",
    paymentSection: "Payment method",
    noteSection: "Note",
    noteLabel: "Order note",
    notePlaceholder: "Preferred delivery time, delivery instructions…",
    optional: "(optional)",
    orderSection: "Order",
    couponPlaceholder: "Discount code",
    clearCoupon: "Remove discount code",
    apply: "Apply",
    shippingPending: "Calculated on confirmation",
    internationalNote: "Please contact us for orders outside Vietnam",
    placeOrder: "Place order",
    placingOrder: "Placing order…",
    successTitle: "Order placed",
    successCode: (code: ReactNode) => (
      <>
        Your order number is {code}. Keep an eye on your email for the order
        details.
      </>
    ),
    successTotal: (total: ReactNode) => <>Total: {total}</>,
    chargedInVnd: (amount: string) =>
      `Prices in USD are approximate. You will be charged ${amount} (VND).`,
    errors: {
      couponNeedsPhone:
        "Please enter your phone number before applying a discount code.",
      calculateFailed: "Could not calculate your order.",
      noAvailableLines: "Your cart has no products that are still available.",
      emailRequired: "Please enter your email.",
      provinceRequired: "Please select a province / city.",
      addressRequired: "Please enter your street address.",
      placeFailed: "Could not place your order. Please try again.",
    },
  },

  account: {
    title: "Account",
    shop: "Shop",
    signOut: "Sign out",
    signingOut: "Signing out…",
    backHome: "Back to home",
    signIn: "Sign in",
    signInSubtitle: "Become a GOAT RISE member",
    continueWithGoogle: "Continue with Google",
    redirectingToGoogle: "Redirecting to Google…",
    googleError: "Could not connect to Google. Please try again.",
    purchaseInfo: "Purchase information",
    purchaseInfoDescription: "Your name, phone number and shipping addresses.",
    notUpdated: "Not provided",
    address: "Addresses",
    addressN: (index: number) => `Address ${index}`,
    addressDetailN: (index: number) => `Street address ${index}`,
    removeAddressN: (index: number) => `Remove address ${index}`,
    addAddress: "Add address",
    noAddress: "No addresses yet.",
    noPurchaseInfo:
      "You have no purchase information yet. Click edit to add your name, phone number and shipping address.",
    totalOrders: "Total orders",
    totalSpent: "Total spent",
    loadProfileError: "Could not load your account information.",
    myOrders: "My orders",
    loadOrdersError: "Could not load your orders.",
    noOrders: "You have no orders yet.",
    shopNow: "Shop now",
    loadMoreError: "Could not load more orders.",
    loadMore: "Load more",
    recipient: "Recipient",
    payment: "Payment",
    errors: {
      phoneInvalid: "Invalid phone number.",
      provinceRequired: (index: number) =>
        `Address ${index}: please select a province / city.`,
      addressRequired: (index: number) =>
        `Address ${index}: please enter the street address.`,
      updateFailed: "Update failed. Please try again.",
    },
  },

  localeSwitcher: {
    label: "Language and currency",
    vi: "Tiếng Việt, VND",
    en: "English, USD",
  },

  policyPage: {
    updated: (date: string) => `Updated ${date}`,
    tableOfContents: "Contents",
    helpTitle: "Need more help?",
    helpBody:
      "Message GOAT RISE on Instagram and we will get back to you during business hours.",
  },

  home: {
    intro: {
      ariaLabel: "Introducing GOAT RISE",
      greetingAriaLabel: "Hey Goat, ready to rise?",
      greeting: ["Hey", "Goat,", "Ready", "to", "Rise?"],
    },
    hero: {
      cta: "Explore",
      fallbackDescription:
        "The first GOAT RISE collection - activewear and classic fashion designed to be with you every day.",
    },
    featuredProducts: {
      title: "Featured Products",
    },
    featuredCollections: {
      cta: "Shop now",
    },
    collectionStack: {
      title: "Collections",
    },
    brandIntro: {
      manifesto:
        "GOAT RISE believes real progress doesn't come from a single breakthrough, but from what you repeat every day. We make clothes for that rhythm: durable, minimal, and a little better every time you wear them.",
      eyebrow: "Goat Rise · Est. 2026",
      tagline: ["Real Improvement", "Start Everyday"],
      follow: "Follow Us",
    },
    scrollManifesto: {
      marqueeTop: ["Real Improvement", "Start Everyday"],
      marqueeBottom: ["Durable", "Minimal", "Better every day"],
      eyebrow: "Goat Rise · Est. 2026",
      headline: ["Everything", "moves"],
      subline: "Except our standards.",
    },
  },
};

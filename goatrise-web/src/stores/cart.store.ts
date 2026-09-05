import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ItemBase, Product, ProductBase } from "@/api/product/api";

// Snapshot mirror OrderLineSnapItem của backend để sau này map sang payload checkout không phải đổi shape.
export type CartLineSnapshot = {
  sku: string;
  name: string;
  imgUrl: string | null;
  attributeValues: ItemBase["attributeValues"];
  price: number;
  // stock chỉ để cảnh báo mềm trong drawer, không dùng để chặn tăng số lượng
  stock: number;
  product: {
    id: string;
    slug: string;
    title: string;
    imgUrls: string[] | null;
  } | null;
};

export type CartLine = {
  itemId: string; // 1 itemId = 1 dòng
  quantity: number;
  snapshot: CartLineSnapshot;
  addedAt: number;
  // false sau khi syncFromProducts không còn thấy item (bị gỡ / tắt bán)
  isAvailable: boolean;
};

type CartState = {
  lines: CartLine[];
  isOpen: boolean;
  hasHydrated: boolean;

  addLine: (item: ItemBase, product: ProductBase, quantity?: number) => void;
  setQuantity: (itemId: string, quantity: number) => void;
  removeLine: (itemId: string) => void;
  clearCart: () => void;

  openCart: () => void;
  closeCart: () => void;
  setOpen: (open: boolean) => void;

  syncFromProducts: (products: Product[]) => void;
  setHasHydrated: (value: boolean) => void;
};

function toSnapshot(item: ItemBase, product: ProductBase | null): CartLineSnapshot {
  return {
    sku: item.sku,
    name: item.name,
    imgUrl: item.imgUrl,
    attributeValues: item.attributeValues,
    price: item.price,
    stock: item.stock,
    product: product
      ? {
          id: product.id,
          slug: product.slug,
          title: product.title.vi,
          imgUrls: product.imgUrls,
        }
      : null,
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,
      hasHydrated: false,

      addLine: (item, product, quantity = 1) =>
        set((state) => {
          if (quantity <= 0) {
            return state;
          }

          const snapshot = toSnapshot(item, product);
          const existing = state.lines.find((line) => line.itemId === item.id);

          // đã có dòng: cộng dồn số lượng và ghi đè snapshot bằng dữ liệu mới nhất
          const lines = existing
            ? state.lines.map((line) =>
                line.itemId === item.id
                  ? {
                      ...line,
                      quantity: line.quantity + quantity,
                      snapshot,
                      isAvailable: true,
                    }
                  : line
              )
            : [
                ...state.lines,
                {
                  itemId: item.id,
                  quantity,
                  snapshot,
                  addedAt: Date.now(),
                  isAvailable: true,
                },
              ];

          return { lines, isOpen: true };
        }),

      setQuantity: (itemId, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((line) => line.itemId !== itemId)
              : state.lines.map((line) =>
                  line.itemId === itemId ? { ...line, quantity } : line
                ),
        })),

      removeLine: (itemId) =>
        set((state) => ({
          lines: state.lines.filter((line) => line.itemId !== itemId),
        })),

      clearCart: () => set({ lines: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      setOpen: (open) => set({ isOpen: open }),

      // Dữ liệu server là nguồn đúng: cập nhật lại snapshot, đánh dấu dòng không còn bán.
      // Cố ý KHÔNG tự xoá dòng để user không mất đồ trong im lặng.
      syncFromProducts: (products) =>
        set((state) => {
          // chưa rehydrate xong thì lines còn rỗng; ghi đè lúc này sẽ xoá sạch giỏ trong localStorage.
          // list rỗng thường là lỗi/API chưa sẵn sàng chứ không phải mọi item đều bị gỡ
          if (!state.hasHydrated || products.length === 0) {
            return state;
          }

          const itemMap = new Map<string, { item: ItemBase; product: ProductBase }>();
          for (const product of products) {
            for (const item of product.items) {
              itemMap.set(item.id, { item, product });
            }
          }

          return {
            lines: state.lines.map((line) => {
              const found = itemMap.get(line.itemId);
              if (!found || !found.item.isActive || !found.product.isActive) {
                return { ...line, isAvailable: false };
              }
              return {
                ...line,
                snapshot: toSnapshot(found.item, found.product),
                isAvailable: true,
              };
            }),
          };
        }),

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "goatrise-cart",
      version: 1,
      partialize: (state) => ({ lines: state.lines }),
      // SSR: hoãn rehydrate tới useEffect ở __root để server và lần render client đầu khớp nhau
      skipHydration: true,
      // giỏ hàng không phải dữ liệu cần cứu khi đổi version
      migrate: () => ({ lines: [] }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
);

// Selector dẫn xuất: tính từ lines để không bao giờ lệch với state
export const selectItemCount = (state: CartState) =>
  state.lines.reduce((total, line) => total + line.quantity, 0);

export const selectSubtotal = (state: CartState) =>
  state.lines.reduce(
    (total, line) => (line.isAvailable ? total + line.snapshot.price * line.quantity : total),
    0
  );

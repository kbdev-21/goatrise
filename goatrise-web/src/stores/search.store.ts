import { create } from "zustand";

type SearchState = {
  isOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  setOpen: (open: boolean) => void;
};

// Trạng thái mở/đóng panel tìm kiếm, dùng chung cho header, menu mobile và phím tắt
export const useSearchStore = create<SearchState>((set) => ({
  isOpen: false,
  openSearch: () => set({ isOpen: true }),
  closeSearch: () => set({ isOpen: false }),
  setOpen: (open) => set({ isOpen: open }),
}));

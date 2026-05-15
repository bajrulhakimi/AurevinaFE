import { createContext } from "react";

export interface CartItem {
  id: number | string;
  product_id?: number;
  variant_id?: number | null;
  product_name: string;
  base_price: number;
  quantity: number;
  slug: string;
}

export interface CartContextType {
  cart: CartItem[];
  addToCart: (product: CartItem) => void;
  removeFromCart: (id: number | string) => void;
  updateQuantity: (id: number | string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

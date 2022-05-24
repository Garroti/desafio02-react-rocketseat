import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const product = await api.get(`products/${productId}`);
      const newProduct = product.data;
      const [existentProduct] = cart.filter((p) => p.id === productId);

      if (existentProduct) {
        updateProductAmount({
          amount: existentProduct.amount + 1,
          productId: existentProduct.id,
        });
      } else {
        setCart([...cart, { ...newProduct, amount: 1 }]);
        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify([...cart, { ...newProduct, amount: 1 }])
        );
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter((p) => p.id !== productId);

      if (newCart.length === cart.length) throw Error();

      setCart(newCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const response = await api.get(`stock/${productId}`);
      const stock: Stock = response.data;
      const [updatedProduct] = cart.filter((p) => p.id === productId);

      if (updatedProduct.amount <= 0 || amount < 1) {
        return;
      }

      if (amount > stock.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      } else {
        const updatedCart = cart.map((p) => {
          if (p.id === productId) {
            p.amount = amount;
            return p;
          } else {
            return p;
          }
        });

        setCart(updatedCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

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
     const storagedCart = localStorage.getItem('@RocketShoes:cart');
    
     if (storagedCart) {
       return JSON.parse(storagedCart);
     }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];
      const productExists = updatedCart.find(produto => produto.id === productId);

      const stock = await api.get(`/stock/${productId}`);

      const stockAmount = stock.data.amount;
      const currentAmount = productExists ? productExists.amount : 0;
      const amount = currentAmount + 1;

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productExists) {
        productExists.amount = amount;
      } else {
        const produtos = await api.get(`/products/${productId}`);

        const newProdutos = {
          ...produtos.data,
          amount: 1
        }
        updatedCart.push(newProdutos);
      }

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))

     } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCartRemove = [...cart];
      const productIndexRemove = updatedCartRemove.findIndex(product => product.id === productId);

      if (productIndexRemove >= 0) {
        updatedCartRemove.splice(productIndexRemove, 1);
        setCart(updatedCartRemove);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCartRemove));
      } else {
        throw Error();
        }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
        }

        const stockCheck = await api.get(`/stock/${productId}`);

        const stockAmountCheck = stockCheck.data.amount;

        if (amount > stockAmountCheck) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
          }

          const updatedCartCheck = [...cart];
          const productExistsCheck = updatedCartCheck.find(product => product.id === productId);

          if (productExistsCheck) {
            productExistsCheck.amount = amount;
            setCart(updatedCartCheck);
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCartCheck));
            } else {
              throw Error();
              }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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

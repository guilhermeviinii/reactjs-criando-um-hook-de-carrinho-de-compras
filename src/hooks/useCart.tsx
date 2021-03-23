import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

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
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const stock = await api.get<Product>(`/stock/${productId}`).then(response => response.data)
      const [product] = cart.filter(item => item.id == productId)
      if(product){
        const products = cart.filter(item => item.id !== productId)
        console.log(stock)
        console.log(product.amount , stock.amount)
        if(product.amount >= stock.amount){
          throw new Error()
        }
        product.amount += 1
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...products, product]))
        setCart([...products, product])
      }else{
        const product = await api.get<Product>(`/products/${productId}`).then(response => response.data)
        product.amount = 1
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, product]))
        setCart([...cart, product])
      }
      


    } catch (e) {
      toast.error('Quantidade solicitada fora de estoque')
      toast.error('Erro na adição do produto');

    }
  };

  const removeProduct = (productId: number) => {
    try {
      const [itemExist] = cart.filter(prod => prod.id === productId)
      if (itemExist) {
        const itemCart = cart.filter(prod => prod.id !== productId)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(itemCart))
        setCart(itemCart)
      } else {
        throw new Error()
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
      let stock = await api.get<Stock>(`/stock/${productId}`).then(response => response.data)
      if (amount > stock.amount) {
        throw new Error()
      }
      if(amount < 1){
        throw new Error()
      }
      const [product] = cart.filter(item => item.id === productId)
      console.log(product)
      product.amount = amount
      console.log(product)
      const itemsCart = cart.filter(item => item.id !== productId)
      setCart([...itemsCart, product])
      localStorage.setItem('@RocketShoes:cart', JSON.stringify([...itemsCart, product]))

    } catch {
      toast.error('Quantidade solicitada fora de estoque')
      toast.error('Erro na alteração de quantidade do produto')
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

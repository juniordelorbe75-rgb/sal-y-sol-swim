import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";


const CartContext = createContext(null);

const STORAGE_KEY = "salysol_cart";


export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      return saved
        ? JSON.parse(saved)
        : [];
    } catch {
      return [];
    }
  });


  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(cart)
    );
  }, [cart]);


  function addToCart(
    product,
    size,
    color
  ) {
    if (!product) {
      return {
        success: false,
        message: "Producto no disponible.",
      };
    }


    if (product.stock <= 0) {
      return {
        success: false,
        message: "Este producto está agotado.",
      };
    }


    if (
      product.sizes?.length > 0 &&
      !size
    ) {
      return {
        success: false,
        message: "Selecciona una talla.",
      };
    }


    if (
      product.colors?.length > 0 &&
      !color
    ) {
      return {
        success: false,
        message: "Selecciona un color.",
      };
    }


    const cartKey =
      `${product.id}-${size || "none"}-${color || "none"}`;


    const existing =
      cart.find(
        (item) =>
          item.cartKey === cartKey
      );


    if (
      existing &&
      existing.quantity >=
        product.stock
    ) {
      return {
        success: false,
        message:
          `Solo quedan ${product.stock} disponibles.`,
      };
    }


    setCart((currentCart) => {
      const currentItem =
        currentCart.find(
          (item) =>
            item.cartKey ===
            cartKey
        );


      if (currentItem) {
        return currentCart.map(
          (item) =>
            item.cartKey ===
            cartKey
              ? {
                  ...item,
                  product,
                  quantity:
                    item.quantity +
                    1,
                }
              : item
        );
      }


      return [
        ...currentCart,
        {
          cartKey,
          product,
          size,
          color,
          quantity: 1,
        },
      ];
    });


    return {
      success: true,
      message: "Agregado al carrito.",
    };
  }


  function increase(cartKey) {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (
          item.cartKey !== cartKey
        ) {
          return item;
        }


        if (
          item.quantity >=
          item.product.stock
        ) {
          return item;
        }


        return {
          ...item,
          quantity:
            item.quantity + 1,
        };
      })
    );
  }


  function decrease(cartKey) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.cartKey === cartKey
            ? {
                ...item,
                quantity:
                  item.quantity - 1,
              }
            : item
        )
        .filter(
          (item) =>
            item.quantity > 0
        )
    );
  }


  function removeItem(cartKey) {
    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          item.cartKey !==
          cartKey
      )
    );
  }


  function clearCart() {
    setCart([]);
  }


  const cartCount =
    useMemo(
      () =>
        cart.reduce(
          (total, item) =>
            total +
            item.quantity,
          0
        ),
      [cart]
    );


  const cartTotal =
    useMemo(
      () =>
        cart.reduce(
          (total, item) =>
            total +
            item.product.price *
              item.quantity,
          0
        ),
      [cart]
    );


  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        cartTotal,
        addToCart,
        increase,
        decrease,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}


export function useCart() {
  const context =
    useContext(CartContext);


  if (!context) {
    throw new Error(
      "useCart debe usarse dentro de CartProvider."
    );
  }


  return context;
}
import { createContext, useState, useEffect } from 'react';

export const QuoteContext = createContext();

export function QuoteProvider({ children }) {
  const [quoteItems, setQuoteItems] = useState(() => {
    const saved = localStorage.getItem('vds_quote');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('vds_quote', JSON.stringify(quoteItems));
  }, [quoteItems]);

  const addToQuote = (product, quantity = 1) => {
    setQuoteItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromQuote = (productId) => {
    setQuoteItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) return;
    setQuoteItems(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearQuote = () => {
    setQuoteItems([]);
  };

  const quoteCount = quoteItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <QuoteContext.Provider value={{
      quoteItems,
      addToQuote,
      removeFromQuote,
      updateQuantity,
      clearQuote,
      quoteCount
    }}>
      {children}
    </QuoteContext.Provider>
  );
}

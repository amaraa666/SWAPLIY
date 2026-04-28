import React, { createContext, useContext, useMemo, useState } from 'react';

interface FilterContextType {
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  minPrice: number | null;
  maxPrice: number | null;
  setPriceRange: (min: number | null, max: number | null) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  const value = useMemo(
    () => ({
      selectedCategory,
      setSelectedCategory,
      minPrice,
      maxPrice,
      setPriceRange: (min: number | null, max: number | null) => {
        setMinPrice(min);
        setMaxPrice(max);
      },
    }),
    [maxPrice, minPrice, selectedCategory]
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
};

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within FilterProvider');
  }
  return context;
};

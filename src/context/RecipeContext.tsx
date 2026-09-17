import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type Recipe = {
  id: string;
  title: string;
  time: string;
  difficulty: string;
  image: string;
  ingredients: string[];
  instructions: string[];
};

const STORAGE_KEY = '@recipe_book_data_v1';

const INITIAL_RECIPES: Recipe[] = [
  {
    id: '1',
    title: 'Garlic Butter Pasta',
    time: '15 mins',
    difficulty: 'Easy',
    image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281286?w=600',
    ingredients: ['200g Pasta', '3 cloves Garlic (minced)', '2 tbsp Olive Oil', 'Fresh Parsley & Parmesan'],
    instructions: [
      'Boil pasta in salted water until al dente.',
      'Sauté minced garlic in olive oil until golden.',
      'Toss pasta with garlic oil, herbs, and cheese.',
    ],
  },
  {
    id: '2',
    title: 'Avocado Toast & Egg',
    time: '10 mins',
    difficulty: 'Easy',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600',
    ingredients: ['2 slices Sourdough Bread', '1 Ripe Avocado', '2 Eggs', 'Salt, Pepper & Chili Flakes'],
    instructions: [
      'Toast sourdough bread.',
      'Mash avocado with salt and pepper, spread on toast.',
      'Top with poached or fried eggs.',
    ],
  },
];

type RecipeContextType = {
  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'id'>) => void;
  updateRecipe: (updatedRecipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
};

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>(INITIAL_RECIPES);

  useEffect(() => {
    const loadStoredRecipes = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
          setRecipes(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load recipes from storage', error);
      }
    };
    loadStoredRecipes();
  }, []);

  const persistRecipes = async (updatedList: Recipe[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    } catch (error) {
      console.error('Failed to save recipes to storage', error);
    }
  };

  const addRecipe = (newRecipe: Omit<Recipe, 'id'>) => {
    const item: Recipe = { ...newRecipe, id: Date.now().toString() };
    setRecipes((prev) => {
      const updated = [item, ...prev];
      persistRecipes(updated);
      return updated;
    });
  };

  const updateRecipe = (updatedRecipe: Recipe) => {
    setRecipes((prev) => {
      const updated = prev.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r));
      persistRecipes(updated);
      return updated;
    });
  };

  const deleteRecipe = (id: string) => {
    setRecipes((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      persistRecipes(updated);
      return updated;
    });
  };

  return (
    <RecipeContext.Provider value={{ recipes, addRecipe, updateRecipe, deleteRecipe }}>
      {children}
    </RecipeContext.Provider>
  );
}

export function useRecipes() {
  const context = useContext(RecipeContext);
  if (!context) throw new Error('useRecipes must be used within a RecipeProvider');
  return context;
}
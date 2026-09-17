import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type Recipe = {
  id: string;
  title: string;
  time: string;
  difficulty: string;
  tags: string[];
  isFavorite: boolean;
  image: string;
  ingredients: string[];
  instructions: string[];
};

type RecipeContextType = {
  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'id'>) => Promise<void>;
  updateRecipe: (recipe: Recipe) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
};

const STORAGE_KEY = '@my_recipes_data';
const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    const loadRecipes = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          setRecipes(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Failed to load recipes from disk:', e);
      }
    };
    loadRecipes();
  }, []);

  const save = async (newList: Recipe[]) => {
    setRecipes(newList);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.error('Failed to save recipes to disk:', e);
    }
  };

  const addRecipe = async (newRecipeData: Omit<Recipe, 'id'>) => {
    const newRecipe = { id: Date.now().toString(), ...newRecipeData };
    await save([newRecipe, ...recipes]);
  };

  const updateRecipe = async (updated: Recipe) => {
    const newList = recipes.map((r) => (r.id === updated.id ? updated : r));
    await save(newList);
  };

  const deleteRecipe = async (id: string) => {
    const newList = recipes.filter((r) => r.id !== id);
    await save(newList);
  };

  const toggleFavorite = async (id: string) => {
    const newList = recipes.map((r) =>
      r.id === id ? { ...r, isFavorite: !r.isFavorite } : r
    );
    await save(newList);
  };

  return (
    <RecipeContext.Provider value={{ recipes, addRecipe, updateRecipe, deleteRecipe, toggleFavorite }}>
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipes = () => {
  const context = useContext(RecipeContext);
  if (!context) throw new Error('useRecipes must be used within a RecipeProvider');
  return context;
};
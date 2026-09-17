import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Recipe } from '../types/recipe';

interface RecipeContextType {
  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'id'>) => Promise<void>;
  updateRecipe: (recipe: Recipe) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
}

const STORAGE_KEY = '@recipes_app_data_v3';

const DEFAULT_RECIPES: Recipe[] = [
  {
    id: '1',
    title: 'Classic Creamy Carbonara',
    image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800',
    time: '20 mins',
    difficulty: 'Easy',
    tags: ['Dinner', 'Pasta'],
    isFavorite: true,
    ingredients: ['200g spaghetti', '100g guanciale or pancetta', '2 large eggs', '50g Pecorino Romano', 'Black pepper'],
    instructions: [
      'Boil pasta in salted water for 9 mins.',
      'Crisp guanciale in a pan for 5 mins.',
      'Whisk eggs and Pecorino together in a bowl.',
      'Combine pasta with pan oil, remove from heat, and stir in egg mix until creamy.'
    ],
  },
];

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecipes(JSON.parse(stored));
      } else {
        setRecipes(DEFAULT_RECIPES);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RECIPES));
      }
    } catch {
      setRecipes(DEFAULT_RECIPES);
    }
  };

  const saveRecipes = async (newRecipes: Recipe[]) => {
    setRecipes(newRecipes);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newRecipes));
  };

  const addRecipe = async (recipeData: Omit<Recipe, 'id'>) => {
    const newRecipe: Recipe = { ...recipeData, id: Date.now().toString() };
    await saveRecipes([newRecipe, ...recipes]);
  };

  const updateRecipe = async (updated: Recipe) => {
    const newRecipes = recipes.map((r) => (r.id === updated.id ? updated : r));
    await saveRecipes(newRecipes);
  };

  const deleteRecipe = async (id: string) => {
    const newRecipes = recipes.filter((r) => r.id !== id);
    await saveRecipes(newRecipes);
  };

  const toggleFavorite = async (id: string) => {
    const newRecipes = recipes.map((r) =>
      r.id === id ? { ...r, isFavorite: !r.isFavorite } : r
    );
    await saveRecipes(newRecipes);
  };

  return (
    <RecipeContext.Provider
      value={{ recipes, addRecipe, updateRecipe, deleteRecipe, toggleFavorite }}
    >
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipes = () => {
  const context = useContext(RecipeContext);
  if (!context) throw new Error('useRecipes must be used within RecipeProvider');
  return context;
};
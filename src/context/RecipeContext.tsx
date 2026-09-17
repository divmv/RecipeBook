import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

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

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  // Fetch recipes from Cloud on load
  const fetchRecipes = async () => {
    const { data, error } = await supabase.from('recipes').select('*').order('created_at', { ascending: false });
    if (!error && data) setRecipes(data);
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const addRecipe = async (newRecipeData: Omit<Recipe, 'id'>) => {
    const newRecipe = { id: Date.now().toString(), ...newRecipeData };
    const { error } = await supabase.from('recipes').insert([newRecipe]);
    if (!error) fetchRecipes();
  };

  const updateRecipe = async (updated: Recipe) => {
    const { error } = await supabase.from('recipes').update(updated).eq('id', updated.id);
    if (!error) fetchRecipes();
  };

  const deleteRecipe = async (id: string) => {
    const { error } = await supabase.from('recipes').delete().eq('id', id);
    if (!error) fetchRecipes();
  };

  const toggleFavorite = async (id: string) => {
    const target = recipes.find((r) => r.id === id);
    if (!target) return;
    await updateRecipe({ ...target, isFavorite: !target.isFavorite });
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
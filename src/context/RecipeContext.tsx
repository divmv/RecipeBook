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

  // 1. Load recipes from Supabase on app mount
  const fetchRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch error:', error.message);
        return;
      }

      if (data) {
        setRecipes(data as Recipe[]);
      }
    } catch (e) {
      console.error('Unexpected error fetching recipes:', e);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  // 2. Add recipe to Supabase & update local state
  const addRecipe = async (newRecipeData: Omit<Recipe, 'id'>) => {
    const newRecipe: Recipe = { id: Date.now().toString(), ...newRecipeData };

    // Update screen state immediately so UI/modal closes instantly
    setRecipes((prev) => [newRecipe, ...prev]);

    try {
      const { error } = await supabase.from('recipes').insert([newRecipe]);
      if (error) {
        console.error('Supabase add error:', error.message);
        // Rollback state if server save fails
        setRecipes((prev) => prev.filter((r) => r.id !== newRecipe.id));
      }
    } catch (e) {
      console.error('Unexpected error adding recipe:', e);
    }
  };

  // 3. Update recipe in Supabase & update local state
  const updateRecipe = async (updated: Recipe) => {
    setRecipes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));

    try {
      const { error } = await supabase
        .from('recipes')
        .update(updated)
        .eq('id', updated.id);

      if (error) {
        console.error('Supabase update error:', error.message);
        fetchRecipes(); // Re-sync on failure
      }
    } catch (e) {
      console.error('Unexpected error updating recipe:', e);
    }
  };

  // 4. Delete recipe from Supabase & update local state
  const deleteRecipe = async (id: string) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));

    try {
      const { error } = await supabase.from('recipes').delete().eq('id', id);
      if (error) {
        console.error('Supabase delete error:', error.message);
        fetchRecipes(); // Re-sync on failure
      }
    } catch (e) {
      console.error('Unexpected error deleting recipe:', e);
    }
  };

  // 5. Toggle favorite status
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
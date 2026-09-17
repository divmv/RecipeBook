import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface Recipe {
  id: string;
  title: string;
  time: string;
  difficulty: string;
  image: string;
  ingredients: string[];
  instructions: string[];
}

interface RecipeContextType {
  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'id'>) => Promise<void>;
  updateRecipe: (updatedRecipe: Recipe) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
}

const STORAGE_KEY = '@recipes_app_data_v2';

const INITIAL_RECIPES: Recipe[] = [
  {
    id: '1',
    title: 'Dum Biryani',
    time: '15 mins',
    difficulty: 'Easy',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=800&auto=format&fit=crop',
    ingredients: [
      '2 tbsp milk',
      'For rice:',
      '2 cup Basmati Rice',
      '3 cloves',
      '3 cardamom',
      '1 bay leaf',
      '1 Cinnamon stick',
    ],
    instructions: [
      'Prep ingredients:',
      'Wash and soak basmati rice for 30 minutes.',
      '- Keep spices handy',
      'Cook:',
      'Boil rice with whole spices until 80% done.',
      'Layer with paneer gravy and dum cook on low flame for 15 mins.',
    ],
  },
];

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

// Copies temporary photo picker URIs into permanent app storage
const saveImagePermanently = async (uri: string): Promise<string> => {
  if (!uri || uri.startsWith('http') || uri.startsWith('data:')) {
    return uri;
  }
  try {
    const filename = uri.split('/').pop() || `photo_${Date.now()}.jpg`;
    const destPath = `${FileSystem.documentDirectory}${Date.now()}_${filename}`;
    await FileSystem.copyAsync({
      from: uri,
      to: destPath,
    });
    return destPath;
  } catch (error) {
    console.error('Error saving photo permanently:', error);
    return uri;
  }
};

export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useState<Recipe[]>(INITIAL_RECIPES);

  // Load stored recipes immediately on boot
  useEffect(() => {
    const loadStoredRecipes = async () => {
      try {
        const storedData = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedData !== null) {
          const parsed = JSON.parse(storedData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRecipes(parsed);
          }
        } else {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_RECIPES));
        }
      } catch (error) {
        console.error('Failed to load recipes from AsyncStorage:', error);
      }
    };

    loadStoredRecipes();
  }, []);

  const persistRecipes = async (updatedRecipes: Recipe[]) => {
    setRecipes(updatedRecipes);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecipes));
    } catch (error) {
      console.error('Failed to save recipes to disk:', error);
    }
  };

  const addRecipe = async (recipeData: Omit<Recipe, 'id'>) => {
    const permanentImage = await saveImagePermanently(recipeData.image);
    const newRecipe: Recipe = {
      ...recipeData,
      image: permanentImage,
      id: Date.now().toString(),
    };
    const updated = [newRecipe, ...recipes];
    await persistRecipes(updated);
  };

  const updateRecipe = async (updatedRecipe: Recipe) => {
    const permanentImage = await saveImagePermanently(updatedRecipe.image);
    const finalRecipe = { ...updatedRecipe, image: permanentImage };
    const updated = recipes.map((r) => (r.id === finalRecipe.id ? finalRecipe : r));
    await persistRecipes(updated);
  };

  const deleteRecipe = async (id: string) => {
    const updated = recipes.filter((r) => r.id !== id);
    await persistRecipes(updated);
  };

  return (
    <RecipeContext.Provider value={{ recipes, addRecipe, updateRecipe, deleteRecipe }}>
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipes = () => {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error('useRecipes must be used within a RecipeProvider');
  }
  return context;
};
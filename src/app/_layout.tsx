import { Stack } from 'expo-router';
import { RecipeProvider } from '../context/RecipeContext';

export default function RootLayout() {
  return (
    <RecipeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="recipe" />
      </Stack>
    </RecipeProvider>
  );
}
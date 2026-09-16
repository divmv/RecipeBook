import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRecipes } from '../context/RecipeContext';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { recipes, updateRecipe } = useRecipes();

  const recipe = recipes.find((r) => r.id === id);

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(recipe?.title ?? '');
  const [time, setTime] = useState(recipe?.time ?? '');
  const [difficulty, setDifficulty] = useState(recipe?.difficulty ?? '');
  const [ingredientsText, setIngredientsText] = useState(recipe?.ingredients.join('\n') ?? '');
  const [instructionsText, setInstructionsText] = useState(recipe?.instructions.join('\n') ?? '');

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ padding: 20 }}>Recipe not found.</Text>
      </SafeAreaView>
    );
  }

  const handleSaveEdit = () => {
    updateRecipe({
      ...recipe,
      title,
      time,
      difficulty,
      ingredients: ingredientsText.split('\n').filter((line) => line.trim() !== ''),
      instructions: instructionsText.split('\n').filter((line) => line.trim() !== ''),
    });
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Navigation Bar */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.blueBtnText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={isEditing ? handleSaveEdit : () => setIsEditing(true)}>
          <Text style={styles.blueBtnText}>{isEditing ? 'Save' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{ uri: recipe.image }} style={styles.image} />

        <View style={styles.content}>
          {isEditing ? (
            <>
              <Text style={styles.label}>Title</Text>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} />

              <Text style={styles.label}>Time & Difficulty</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput style={[styles.input, { flex: 1 }]} value={time} onChangeText={setTime} />
                <TextInput style={[styles.input, { flex: 1 }]} value={difficulty} onChangeText={setDifficulty} />
              </View>

              <Text style={styles.label}>Ingredients (use ":" at the end of a line for headers)</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                multiline
                placeholder="Salt&#10;For gravy:&#10;3 Tomatoes"
                value={ingredientsText}
                onChangeText={setIngredientsText}
              />

              <Text style={styles.label}>Instructions (one step per line)</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                multiline
                placeholder="Boil rice&#10;Prepare gravy"
                value={instructionsText}
                onChangeText={setInstructionsText}
              />
            </>
          ) : (
            <>
              <Text style={styles.title}>{recipe.title}</Text>
              <Text style={styles.meta}>
                ⏱️ {recipe.time} • 🍳 {recipe.difficulty}
              </Text>

              <Text style={styles.sectionHeader}>Ingredients</Text>
              {recipe.ingredients.map((item, index) => {
                const isSectionHeader = item.trim().endsWith(':');

                if (isSectionHeader) {
                  return (
                    <Text key={index} style={styles.subHeader}>
                      {item}
                    </Text>
                  );
                }

                return (
                  <View key={index} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                );
              })}

              <Text style={styles.sectionHeader}>Instructions</Text>
              {recipe.instructions.map((step, index) => (
                <View key={index} style={styles.stepCard}>
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  navHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  blueBtnText: { fontSize: 16, fontWeight: '600', color: '#007AFF' },
  image: { width: '100%', height: 220 },
  content: { padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1A1A1A' },
  meta: { fontSize: 15, color: '#666', marginVertical: 8 },
  sectionHeader: { fontSize: 20, fontWeight: '600', color: '#1A1A1A', marginTop: 24, marginBottom: 12 },
  subHeader: { fontSize: 17, fontWeight: '700', color: '#007AFF', marginTop: 16, marginBottom: 8 },
  bulletRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' },
  bulletDot: { fontSize: 18, color: '#007AFF', marginRight: 8 },
  bulletText: { fontSize: 16, color: '#333', flex: 1 },
  stepCard: { flexDirection: 'row', backgroundColor: '#F8F9FA', padding: 14, borderRadius: 10, marginBottom: 10, alignItems: 'center' },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#007AFF', color: '#FFF', textAlign: 'center', lineHeight: 28, fontWeight: 'bold', marginRight: 12 },
  stepText: { fontSize: 15, color: '#333', flex: 1, lineHeight: 22 },
  label: { fontSize: 14, fontWeight: '600', color: '#666', marginTop: 12, marginBottom: 4 },
  input: { backgroundColor: '#F0F2F5', padding: 12, borderRadius: 8, fontSize: 16 },
  multiline: { height: 140, textAlignVertical: 'top' },
});
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRecipes } from '../context/RecipeContext';
import { exportRecipePDF } from '../utils/recipeUtils';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { recipes, updateRecipe, deleteRecipe, toggleFavorite } = useRecipes();

  const recipe = recipes.find((r) => r.id === id);

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [image, setImage] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [instructionsText, setInstructionsText] = useState('');

  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [checkedInstructions, setCheckedInstructions] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (recipe) {
      setTitle(recipe.title || '');
      setTime(recipe.time || '');
      setDifficulty(recipe.difficulty || '');
      setTagsStr(recipe.tags ? recipe.tags.join(', ') : '');
      setImage(recipe.image || '');
      setIngredientsText(recipe.ingredients ? recipe.ingredients.join('\n') : '');
      setInstructionsText(recipe.instructions ? recipe.instructions.join('\n') : '');
    }
  }, [recipe?.id, recipe?.title, recipe?.image]);

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <TouchableOpacity style={{ padding: 16 }} onPress={() => router.back()}>
          <Text style={styles.navText}>‹ Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.2,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImage(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
    }
  };

  const handleSave = async () => {
    try {
      await updateRecipe({
        ...recipe,
        title: title.trim() || recipe.title,
        time: time.trim() || recipe.time,
        difficulty: difficulty.trim() || recipe.difficulty,
        tags: tagsStr.split(',').map((t) => t.trim()).filter(Boolean),
        image: image.trim() || recipe.image,
        ingredients: ingredientsText.split('\n').filter((l) => l.trim() !== ''),
        instructions: instructionsText.split('\n').filter((l) => l.trim() !== ''),
      });
    } catch (e) {
      console.error('Error saving edits:', e);
    } finally {
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    const executeDelete = async () => {
      try {
        await deleteRecipe(recipe.id);
      } catch (e) {
        console.error('Error deleting recipe:', e);
      } finally {
        router.back();
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this recipe?')) {
        executeDelete();
      }
    } else {
      Alert.alert('Delete Recipe', 'Are you sure you want to delete this recipe?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: executeDelete },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Navigation Header */}
      <View style={styles.navBar}>
        {!isEditing ? (
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.navText}>‹ Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 45 }} />
        )}

        <Text style={styles.navTitle} numberOfLines={1} ellipsizeMode="tail">
          {isEditing ? 'Editing Recipe' : recipe.title}
        </Text>

        <TouchableOpacity
          onPress={() => setIsEditing(!isEditing)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.navText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {isEditing ? (
            <View style={styles.card}>
              <Text style={styles.label}>Title</Text>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Time</Text>
                  <TextInput style={styles.input} value={time} onChangeText={setTime} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Difficulty</Text>
                  <TextInput style={styles.input} value={difficulty} onChangeText={setDifficulty} />
                </View>
              </View>

              <Text style={styles.label}>Recipe Photo</Text>
              <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
                <Text style={styles.photoBtnText}>📷 Select Photo</Text>
              </TouchableOpacity>
              {image ? <Image source={{ uri: image }} style={styles.previewImage} /> : null}

              <Text style={styles.label}>Tags (comma separated)</Text>
              <TextInput style={styles.input} value={tagsStr} onChangeText={setTagsStr} />

              <Text style={styles.label}>Ingredients (use "Header:" for sections)</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                multiline
                value={ingredientsText}
                onChangeText={setIngredientsText}
              />

              <Text style={styles.label}>Instructions (use "Header:" for sections)</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                multiline
                value={instructionsText}
                onChangeText={setInstructionsText}
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <Text style={styles.deleteBtnText}>🗑️ Delete Recipe</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {/* Card Hero */}
              <View style={styles.card}>
                <Image source={{ uri: recipe.image }} style={styles.heroImage} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.mainTitle}>{recipe.title}</Text>
                  <TouchableOpacity
                    onPress={() => toggleFavorite(recipe.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={{ fontSize: 24 }}>{recipe.isFavorite ? '❤️' : '🤍'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>⏱️ {recipe.time}</Text>
                  <Text style={styles.metaText}>🍳 {recipe.difficulty}</Text>
                </View>

                <TouchableOpacity style={styles.pdfBtn} onPress={() => exportRecipePDF(recipe)}>
                  <Text style={styles.pdfBtnText}>📄 Export PDF / Print Card</Text>
                </TouchableOpacity>
              </View>

              {/* Ingredients */}
              <View style={styles.card}>
                <Text style={styles.sectionHeader}>Ingredients</Text>
                {recipe.ingredients.map((item, index) => {
                  if (item.trim().endsWith(':')) {
                    return (
                      <Text key={index} style={styles.subheading}>
                        {item}
                      </Text>
                    );
                  }

                  const isChecked = checkedIngredients[index];
                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.checkRow}
                      onPress={() => setCheckedIngredients((p) => ({ ...p, [index]: !p[index] }))}
                    >
                      <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                        {isChecked && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text style={[styles.checkText, isChecked && styles.strikeText]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Instructions */}
              <View style={styles.card}>
                <Text style={styles.sectionHeader}>Instructions</Text>
                {recipe.instructions.map((step, index) => {
                  if (step.trim().endsWith(':')) {
                    return (
                      <Text key={index} style={styles.subheading}>
                        {step}
                      </Text>
                    );
                  }

                  const isChecked = checkedInstructions[index];
                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.checkRow}
                      onPress={() => setCheckedInstructions((p) => ({ ...p, [index]: !p[index] }))}
                    >
                      <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                        {isChecked && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text style={[styles.checkText, isChecked && styles.strikeText]}>
                        {step}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFF',
    minHeight: 56,
  },
  navText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  navTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#0F172A', textAlign: 'center', marginHorizontal: 8 },

  content: { padding: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  heroImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 },
  mainTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', flex: 1 },

  metaRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  metaText: { fontSize: 13, color: '#64748B', fontWeight: '600' },

  pdfBtn: { backgroundColor: '#F1F5F9', padding: 10, borderRadius: 8, marginTop: 12, alignItems: 'center' },
  pdfBtnText: { color: '#0F172A', fontWeight: '600', fontSize: 13 },

  sectionHeader: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  subheading: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginTop: 14, marginBottom: 6 },

  checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 6 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  checkmark: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

  checkText: { fontSize: 15, color: '#334155', flex: 1, lineHeight: 22 },
  strikeText: { textDecorationLine: 'line-through', color: '#94A3B8' },

  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginTop: 10, marginBottom: 4 },
  input: { backgroundColor: '#F1F5F9', padding: 12, borderRadius: 8, fontSize: 15, color: '#0F172A' },
  multiline: { height: 120, textAlignVertical: 'top' },

  photoBtn: { backgroundColor: '#EBF5FF', padding: 12, borderRadius: 8, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#007AFF', marginVertical: 4 },
  photoBtnText: { color: '#007AFF', fontWeight: '600', fontSize: 14 },
  previewImage: { width: '100%', height: 120, borderRadius: 8, marginTop: 8 },

  saveBtn: { backgroundColor: '#007AFF', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  deleteBtn: { backgroundColor: '#FEE2E2', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  deleteBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
});
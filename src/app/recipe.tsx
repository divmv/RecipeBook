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

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { recipes, updateRecipe, deleteRecipe } = useRecipes();

  const recipe = recipes.find((r) => r.id === id);

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(recipe?.title || '');
  const [time, setTime] = useState(recipe?.time || '');
  const [difficulty, setDifficulty] = useState(recipe?.difficulty || '');
  const [image, setImage] = useState(recipe?.image || '');
  const [ingredients, setIngredients] = useState(recipe?.ingredients?.join('\n') || '');
  const [instructions, setInstructions] = useState(recipe?.instructions?.join('\n') || '');

  const [activeInput, setActiveInput] = useState<'ingredients' | 'instructions' | null>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  // Keep state updated whenever recipe data updates
  useEffect(() => {
    if (recipe) {
      setTitle(recipe.title || '');
      setTime(recipe.time || '');
      setDifficulty(recipe.difficulty || '');
      setImage(recipe.image || '');
      setIngredients(recipe.ingredients ? recipe.ingredients.join('\n') : '');
      setInstructions(recipe.instructions ? recipe.instructions.join('\n') : '');
    }
  }, [recipe?.id, recipe?.title, recipe?.image, recipe?.time, recipe?.difficulty]);

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.navText}>‹ Back to Home</Text>
          </TouchableOpacity>
          <Text style={{ marginTop: 20, fontSize: 16, color: '#666' }}>
            Recipe not found or has been deleted.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    await updateRecipe({
      ...recipe,
      title: title.trim() || recipe.title,
      time: time.trim() || recipe.time,
      difficulty: difficulty.trim() || recipe.difficulty,
      image: image.trim() || recipe.image,
      ingredients: ingredients.split('\n').filter((l) => l.trim() !== ''),
      instructions: instructions.split('\n').filter((l) => l.trim() !== ''),
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    const confirmAndExecute = async () => {
      await deleteRecipe(recipe.id);
      router.back();
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this recipe?')) {
        confirmAndExecute();
      }
    } else {
      Alert.alert(
        'Delete Recipe',
        'Are you sure you want to delete this recipe?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: confirmAndExecute },
        ]
      );
    }
  };

  const applyFormatting = (type: 'bold' | 'italic' | 'bullet' | 'subbullet' | 'header') => {
    if (!activeInput) return;

    const currentText = activeInput === 'ingredients' ? ingredients : instructions;
    const { start, end } = selection;

    const before = currentText.substring(0, start);
    const selected = currentText.substring(start, end);
    const after = currentText.substring(end);

    let inserted = '';

    switch (type) {
      case 'bold':
        inserted = selected ? `**${selected}**` : '**bold**';
        break;
      case 'italic':
        inserted = selected ? `*${selected}*` : '*italic*';
        break;
      case 'bullet':
        inserted = selected ? `• ${selected}` : '• ';
        break;
      case 'subbullet':
        inserted = selected ? `- ${selected}` : '- ';
        break;
      case 'header':
        inserted = selected ? `${selected}:` : 'Header:';
        break;
    }

    const newText = before + inserted + after;
    if (activeInput === 'ingredients') {
      setIngredients(newText);
    } else {
      setInstructions(newText);
    }
  };

  const renderInlineFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text key={i} style={{ fontWeight: 'bold' }}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <Text key={i} style={{ fontStyle: 'italic' }}>
            {part.slice(1, -1)}
          </Text>
        );
      }
      return part;
    });
  };

  const renderFormattedLine = (line: string, index: number) => {
    const trimmed = line.trim();
    const isHeader = trimmed.endsWith(':');
    const isSubBullet = trimmed.startsWith('-') || trimmed.startsWith('>');
    const cleanText = trimmed.replace(/^[->•]\s*/, '');

    if (isHeader) {
      return (
        <Text key={index} style={styles.sectionSubHeader}>
          {line}
        </Text>
      );
    }

    return (
      <View key={index} style={[styles.bulletRow, isSubBullet && styles.subBulletRow]}>
        <Text style={isSubBullet ? styles.subBulletSymbol : styles.bulletSymbol}>
          {isSubBullet ? '◦' : '•'}
        </Text>
        <Text style={styles.bulletText}>{renderInlineFormattedText(cleanText)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Top Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.navText}>‹ Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          <Text style={styles.navText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isEditing ? (
            /* EDIT MODE */
            <View style={styles.editCard}>
              <Text style={styles.editSectionHeader}>Edit Recipe</Text>

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
                <Text style={styles.photoBtnText}>📷 Change Photo</Text>
              </TouchableOpacity>

              {image ? <Image source={{ uri: image }} style={styles.previewImage} /> : null}

              {/* Formatting Toolbar */}
              <View style={styles.toolbarContainer}>
                <Text style={styles.toolbarTitle}>Formatting Tools</Text>
                <View style={styles.toolbarRow}>
                  <TouchableOpacity style={styles.toolBtn} onPress={() => applyFormatting('bold')}>
                    <Text style={[styles.toolBtnText, { fontWeight: 'bold' }]}>B</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.toolBtn} onPress={() => applyFormatting('italic')}>
                    <Text style={[styles.toolBtnText, { fontStyle: 'italic' }]}>I</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.toolBtn} onPress={() => applyFormatting('header')}>
                    <Text style={styles.toolBtnText}>Header:</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.toolBtn} onPress={() => applyFormatting('bullet')}>
                    <Text style={styles.toolBtnText}>• Bullet</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.toolBtn} onPress={() => applyFormatting('subbullet')}>
                    <Text style={styles.toolBtnText}>◦ Sub</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.label}>Ingredients</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                multiline
                value={ingredients}
                onChangeText={setIngredients}
                onFocus={() => setActiveInput('ingredients')}
                onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
              />

              <Text style={styles.label}>Instructions</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                multiline
                value={instructions}
                onChangeText={setInstructions}
                onFocus={() => setActiveInput('instructions')}
                onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <Text style={styles.deleteBtnText}>🗑️ Delete Recipe</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* VIEW MODE */
            <View>
              <View style={styles.headerCard}>
                <Image source={{ uri: recipe.image }} style={styles.heroImage} />
                <Text style={styles.title}>{recipe.title}</Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaBadge}>
                    <Text style={styles.metaBadgeText}>⏱️ {recipe.time}</Text>
                  </View>
                  <View style={styles.metaBadge}>
                    <Text style={styles.metaBadgeText}>🍳 {recipe.difficulty}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeader}>Ingredients</Text>
                <View style={styles.divider} />
                {recipe.ingredients.map((item, index) => renderFormattedLine(item, index))}
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeader}>Instructions</Text>
                <View style={styles.divider} />
                {recipe.instructions.map((step, index) => renderFormattedLine(step, index))}
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
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    zIndex: 10,
  },
  navText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },

  content: { padding: 16, paddingBottom: 160 },

  headerCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heroImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0F172A', paddingHorizontal: 4 },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 8, paddingHorizontal: 4 },
  metaBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  metaBadgeText: { fontSize: 13, fontWeight: '600', color: '#475569' },

  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },

  sectionSubHeader: { fontSize: 16, fontWeight: 'bold', color: '#007AFF', marginTop: 12, marginBottom: 6 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 4, paddingLeft: 4 },
  subBulletRow: { paddingLeft: 24 },
  bulletSymbol: { fontSize: 16, color: '#007AFF', marginRight: 8, lineHeight: 22 },
  subBulletSymbol: { fontSize: 14, color: '#64748B', marginRight: 8, lineHeight: 22 },
  bulletText: { flex: 1, fontSize: 15, color: '#334155', lineHeight: 22 },

  editCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  editSectionHeader: { fontSize: 20, fontWeight: 'bold', color: '#0F172A', marginBottom: 10 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: '#F1F5F9', padding: 14, borderRadius: 10, fontSize: 15, color: '#0F172A' },
  multiline: { height: 140, textAlignVertical: 'top' },
  photoBtn: { backgroundColor: '#EBF5FF', padding: 14, borderRadius: 10, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#007AFF' },
  photoBtnText: { color: '#007AFF', fontWeight: '600', fontSize: 15 },
  previewImage: { width: '100%', height: 140, borderRadius: 10, marginTop: 10 },

  toolbarContainer: { backgroundColor: '#F1F5F9', borderRadius: 10, padding: 10, marginTop: 16 },
  toolbarTitle: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 6, textTransform: 'uppercase' },
  toolbarRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  toolBtn: { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E1' },
  toolBtnText: { fontSize: 13, color: '#0F172A' },

  saveBtn: { backgroundColor: '#007AFF', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
  deleteBtn: { backgroundColor: '#FEE2E2', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 12, marginBottom: 12 },
  deleteBtnText: { color: '#EF4444', fontWeight: '600', fontSize: 16 },
});
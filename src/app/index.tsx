import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRecipes } from '../context/RecipeContext';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { recipes, addRecipe, toggleFavorite } = useRecipes();
  const [selectedTag, setSelectedTag] = useState('All');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [image, setImage] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [instructionsText, setInstructionsText] = useState('');

  const userTags = Array.from(new Set(recipes.flatMap((r) => r.tags || []))).sort();
  const tagOptions = ['All', '❤️ Favorites', ...userTags];

  const filteredRecipes = recipes.filter((r) => {
    if (selectedTag === '❤️ Favorites') return r.isFavorite;
    if (selectedTag !== 'All') return r.tags?.includes(selectedTag);
    return true;
  });

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

  const handleCreateRecipe = async () => {
    if (!title.trim()) {
      alert('Please enter a recipe title.');
      return;
    }

    try {
      await addRecipe({
        title: title.trim(),
        time: time.trim() || '30 mins',
        difficulty: difficulty.trim() || 'Easy',
        tags: tagsStr.split(',').map((t) => t.trim()).filter(Boolean),
        isFavorite: false,
        image: image.trim() || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800',
        ingredients: ingredientsText.split('\n').filter((l) => l.trim() !== ''),
        instructions: instructionsText.split('\n').filter((l) => l.trim() !== ''),
      });
    } catch (e) {
      console.error('Error adding recipe:', e);
    } finally {
      // Guaranteed execution to exit the modal cleanly
      setTitle('');
      setTime('');
      setDifficulty('');
      setTagsStr('');
      setImage('');
      setIngredientsText('');
      setInstructionsText('');
      setIsAddModalOpen(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Recipes</Text>
        <TouchableOpacity
          style={styles.addHeaderBtn}
          onPress={() => setIsAddModalOpen(true)}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        >
          <Text style={styles.addHeaderBtnText}>+ New Recipe</Text>
        </TouchableOpacity>
      </View>

      {/* Tag Filters */}
      <View style={{ height: 44, marginBottom: 8, marginTop: 4 }}>
        <FlatList
          horizontal
          data={tagOptions}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tagChip, selectedTag === item && styles.activeTagChip]}
              onPress={() => setSelectedTag(item)}
            >
              <Text style={[styles.tagChipText, selectedTag === item && styles.activeTagChipText]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Recipe List */}
      <FlatList
        data={filteredRecipes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({ pathname: '/recipe', params: { id: item.id } })}
          >
            <Image source={{ uri: item.image }} style={styles.cardImage} />

            <TouchableOpacity
              style={styles.favBadge}
              onPress={() => toggleFavorite(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={{ fontSize: 18 }}>{item.isFavorite ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMeta}>
                ⏱️ {item.time} | 🍳 {item.difficulty}
              </Text>
              {item.tags?.length > 0 && (
                <View style={styles.tagRow}>
                  {item.tags.map((t, idx) => (
                    <View key={idx} style={styles.miniTag}>
                      <Text style={styles.miniTagText}>{t}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* New Recipe Modal */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent={false}>
        <View style={[styles.modalWrapper, { paddingTop: Math.max(insets.top, 24) }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalTouchArea}
              onPress={() => setIsAddModalOpen(false)}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>

            <Text style={styles.modalHeaderTitle}>New Recipe</Text>

            <TouchableOpacity
              style={styles.modalTouchArea}
              onPress={handleCreateRecipe}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Chicken Biryani"
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Time</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 45 mins"
                    placeholderTextColor="#94A3B8"
                    value={time}
                    onChangeText={setTime}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Difficulty</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Medium"
                    placeholderTextColor="#94A3B8"
                    value={difficulty}
                    onChangeText={setDifficulty}
                  />
                </View>
              </View>

              <Text style={styles.label}>Recipe Photo</Text>
              <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
                <Text style={styles.photoBtnText}>📷 Select Photo</Text>
              </TouchableOpacity>
              {image ? <Image source={{ uri: image }} style={styles.previewImage} /> : null}

              <Text style={styles.label}>Tags (comma separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Dinner, Indian, Spicy"
                placeholderTextColor="#94A3B8"
                value={tagsStr}
                onChangeText={setTagsStr}
              />

              <Text style={styles.label}>Ingredients (use "Header:" for subheadings)</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                multiline
                placeholder={`For gravy:\n0.5 Onions\n3 Tomatoes`}
                placeholderTextColor="#94A3B8"
                value={ingredientsText}
                onChangeText={setIngredientsText}
              />

              <Text style={styles.label}>Instructions (use "Header:" for subheadings)</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                multiline
                placeholder={`Rice:\nWash the rice twice\nSoak for 30 mins`}
                placeholderTextColor="#94A3B8"
                value={instructionsText}
                onChangeText={setInstructionsText}
              />

              <TouchableOpacity style={styles.createSubmitBtn} onPress={handleCreateRecipe}>
                <Text style={styles.createSubmitBtnText}>Create Recipe</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 56,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  addHeaderBtn: { backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  addHeaderBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  tagChip: { backgroundColor: '#FFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#CBD5E1', height: 36 },
  activeTagChip: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  tagChipText: { fontSize: 13, color: '#475569', fontWeight: '600' },
  activeTagChipText: { color: '#FFF' },

  card: { backgroundColor: '#FFF', borderRadius: 16, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  cardImage: { width: '100%', height: 160 },
  favBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: '#FFF', borderRadius: 20, padding: 6, borderWidth: 1, borderColor: '#F1F5F9' },
  cardContent: { padding: 14 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  cardMeta: { fontSize: 13, color: '#64748B', marginTop: 4 },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  miniTag: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  miniTagText: { fontSize: 11, color: '#475569', fontWeight: '600' },

  modalWrapper: { flex: 1, backgroundColor: '#F8FAFC' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 56,
  },
  modalTouchArea: { paddingVertical: 6, paddingHorizontal: 8 },
  modalHeaderTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  modalCancelText: { color: '#64748B', fontSize: 16, fontWeight: '600' },
  modalSaveText: { color: '#007AFF', fontSize: 16, fontWeight: '700' },

  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginTop: 12, marginBottom: 4 },
  input: { backgroundColor: '#FFF', padding: 12, borderRadius: 8, fontSize: 15, color: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0' },
  multiline: { height: 110, textAlignVertical: 'top' },

  photoBtn: { backgroundColor: '#EBF5FF', padding: 12, borderRadius: 8, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#007AFF', marginVertical: 4 },
  photoBtnText: { color: '#007AFF', fontWeight: '600', fontSize: 14 },
  previewImage: { width: '100%', height: 120, borderRadius: 8, marginTop: 8 },

  createSubmitBtn: { backgroundColor: '#007AFF', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 20, marginBottom: 30 },
  createSubmitBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
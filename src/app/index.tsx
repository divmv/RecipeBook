import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRecipes } from '../context/RecipeContext';

export default function HomeScreen() {
  const { recipes, addRecipe } = useRecipes();
  const [modalVisible, setModalVisible] = useState(false);

  // New Recipe Form State
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [image, setImage] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');

  // Choose photo from iPhone Photos App
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.3, // Compressed to preserve local storage space
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        setImage(`data:image/jpeg;base64,${asset.base64}`);
      } else {
        setImage(asset.uri);
      }
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;

    addRecipe({
      title: title.trim(),
      time: time.trim() || '20 mins',
      difficulty: difficulty.trim() || 'Easy',
      image: image.trim() || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600',
      ingredients: ingredients
        ? ingredients.split('\n').filter((l) => l.trim() !== '')
        : ['Sample ingredient'],
      instructions: instructions
        ? instructions.split('\n').filter((l) => l.trim() !== '')
        : ['Sample instruction step'],
    });

    // Reset Form & Close Modal
    setTitle('');
    setTime('');
    setDifficulty('');
    setImage('');
    setIngredients('');
    setInstructions('');
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.headerTitle}>My Recipe Book 📖</Text>
          <Text style={styles.headerSubtitle}>What's cooking good lookin?</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Recipe List */}
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: '/recipe' as any,
                params: { id: item.id },
              })
            }
          >
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            <View style={styles.cardDetails}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMeta}>
                ⏱️ {item.time}  •  🍳 {item.difficulty}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Add Recipe Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>New Recipe</Text>

            <Text style={styles.fieldLabel}>Recipe Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Chicken Biryani"
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Cooking Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 45 mins"
                  placeholderTextColor="#999"
                  value={time}
                  onChangeText={setTime}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Difficulty</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Medium"
                  placeholderTextColor="#999"
                  value={difficulty}
                  onChangeText={setDifficulty}
                />
              </View>
            </View>

            {/* Photo Picker Button */}
            <Text style={styles.fieldLabel}>Recipe Photo</Text>
            <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
              <Text style={styles.photoBtnText}>
                {image ? '✓ Photo Selected (Tap to Change)' : '📷 Choose from Photos'}
              </Text>
            </TouchableOpacity>

            {image ? (
              <Image source={{ uri: image }} style={styles.previewImage} />
            ) : null}

            <Text style={styles.fieldLabel}>Ingredients (Use ":" for section headers)</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              multiline
              placeholder={`Salt\nGhee\n\nFor gravy:\n3 Tomatoes`}
              placeholderTextColor="#999"
              value={ingredients}
              onChangeText={setIngredients}
            />

            <Text style={styles.fieldLabel}>Instructions (One step per line)</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              multiline
              placeholder={`1. Boil rice with spices.\n2. Layer gravy and rice.`}
              placeholderTextColor="#999"
              value={instructions}
              onChangeText={setInstructions}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleSave}>
                <Text style={[styles.btnText, { color: '#FFF' }]}>Save Recipe</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  headerContainer: { paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#1A1A1A' },
  headerSubtitle: { fontSize: 14, color: '#666', marginTop: 2 },
  addButton: { backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  listContent: { paddingHorizontal: 20, paddingBottom: 24 },
  card: { backgroundColor: '#FFF', borderRadius: 16, marginBottom: 16, overflow: 'hidden', elevation: 3 },
  cardImage: { width: '100%', height: 180 },
  cardDetails: { padding: 16 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A1A' },
  cardMeta: { fontSize: 14, color: '#666', marginTop: 6 },
  modalContainer: { flex: 1, backgroundColor: '#FFF' },
  modalContent: { padding: 20 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#1A1A1A' },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#444', marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: '#F0F2F5', padding: 14, borderRadius: 10, fontSize: 15, color: '#1A1A1A' },
  multiline: { height: 120, textAlignVertical: 'top' },
  photoBtn: { backgroundColor: '#EBF5FF', padding: 14, borderRadius: 10, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#007AFF' },
  photoBtnText: { color: '#007AFF', fontWeight: '600', fontSize: 15 },
  previewImage: { width: '100%', height: 140, borderRadius: 10, marginTop: 10 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 30 },
  btn: { flex: 1, padding: 16, borderRadius: 10, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#E5E7EB' },
  saveBtn: { backgroundColor: '#007AFF' },
  btnText: { fontWeight: '600', fontSize: 16, color: '#333' },
});
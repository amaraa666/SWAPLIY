import app from '@/config/firebase';
import { useAuth } from '@/contexts/auth-context';
import { uploadMultipleImages } from '@/services/storage-service';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { addDoc, collection, getFirestore, serverTimestamp, updateDoc } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
const db = getFirestore(app);

const categories = [
  { label: 'Electronics', value: 'electronics' },
  { label: 'Clothing', value: 'clothing' },
  { label: 'Books', value: 'books' },
  { label: 'Home & Garden', value: 'home' },
  { label: 'Sports', value: 'sports' },
  { label: 'Toys', value: 'toys' },
  { label: 'Other', value: 'other' },
];

export default function AddScreen() {
  const { user } = useAuth();
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [sellerLocation, setSellerLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("Select category");
  const [isPublic, setIsPublic] = useState(true);

  const fetchSellerLocation = useCallback(async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Байршил',
          'Барааг газрын зураг дээр харуулахын тулд байршлын зөвшөөрөл шаардлагатай.'
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setSellerLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Алдаа', 'Байршлыг уншиж чадсангүй. Дахин оролдоно уу.');
    } finally {
      setLocationLoading(false);
    }
  }, []);

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handlePostProduct = async () => {
    // Validation
    if (!productName.trim()) {
      Alert.alert('Error', 'Please enter product name');
      return;
    }
    if (!price.trim()) {
      Alert.alert('Error', 'Please enter price');
      return;
    }
    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (images.length === 0) {
      Alert.alert('Error', 'Please upload at least one image');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter product description');
      return;
    }
    if (!sellerLocation) {
      Alert.alert('Байршил', 'Эхлээд «Миний байршил» товч дарж байршлаа оруулна уу.');
      return;
    }
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setLoading(true);

      // Create temporary document first
      const tempProductRef = await addDoc(collection(db, 'products'), {
        name: productName,
        price: parseFloat(price),
        category,
        description,
        isPublic: isPublic,
        sellerId: user.uid,
        sellerEmail: user.email,
        createdAt: serverTimestamp(),
        active: true,
        images: [],
        likes: [],
        location: {
          latitude: sellerLocation.latitude,
          longitude: sellerLocation.longitude,
        },
      });

      // Upload images
      const imageUrls = await uploadMultipleImages(images, tempProductRef.id);

      // Update document with image URLs
      await updateDoc(tempProductRef, {
        images: imageUrls,
      });

      Alert.alert('Success', 'Product posted successfully!');

      // Reset form
      setProductName('');
      setPrice('');
      setCategory('');
      setDescription('');
      setImages([]);
      setSellerLocation(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to post product. Please try again.');
      console.error('Error posting product:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access the media library is required.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      aspect: [16, 9],
      quality: 1,
      allowsMultipleSelection: true,
    });

    let arr = [...images];
    if (result.assets) {
      for (const asset of result.assets) {
        arr.push(asset.uri);
      }
    }
    setImages(arr);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Бараа орууулах</Text>
          <Text style={styles.subtitle}>
            Хэрэгцээгүй болсон зүйлээ хуваалцаж, дараагийн үнэт олдвороо олоорой.
          </Text>
        </View>

        {/* Image Upload Section */}
        <View style={styles.section}>
          <TouchableOpacity onPress={pickImage} style={styles.imageUploadBox}>
            <Ionicons name="image-outline" size={48} color="#9CA3AF" />
            <Text style={styles.uploadText}>Upload Product Images</Text>
            <Text style={styles.uploadSubtext}>PNG, JPG up to 10MB</Text>
          </TouchableOpacity>


          {images.length > 0 && (
            <View style={styles.imagesGrid}>
              {images.map((img, index) => {
                return (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri: img }} style={styles.image} />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeImage(index)}
                    >
                      <View style={styles.removeCircle}>
                        <Ionicons name="close" size={16} color="#FFF" />
                      </View>
                    </TouchableOpacity>
                  </View>
                )
              })}
            </View>
          )}
        </View>

        {/* Seller location (for map / nearby) */}
        <View style={styles.section}>
          <Text style={styles.label}>Борлуулагчийн байршил</Text>
          <Text style={styles.locationHint}>
            Ойролцоох барааг газрын зураг дээр харуулахын тулд одоогийн байршлыг хадгална.
          </Text>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={fetchSellerLocation}
            disabled={locationLoading}
            activeOpacity={0.85}
          >
            {locationLoading ? (
              <ActivityIndicator size="small" color="#1F2937" />
            ) : (
              <Ionicons name="location-outline" size={22} color="#1ECE90" />
            )}
            <Text style={styles.locationButtonText}>
              {sellerLocation ? 'Байршлыг дахин авах' : 'Миний байршил авах'}
            </Text>
          </TouchableOpacity>
          {sellerLocation ? (
            <Text style={styles.locationCoords}>
              {sellerLocation.latitude.toFixed(5)}, {sellerLocation.longitude.toFixed(5)}
            </Text>
          ) : null}
        </View>

        {/* Product Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Барааны нэр</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Vintage Denim Jacket"
            placeholderTextColor="#9CA3AF"
            value={productName}
            onChangeText={setProductName}
          />
        </View>

        {/* Price */}
        <View style={styles.section}>
          <Text style={styles.label}>Үнэ</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter price"
            placeholderTextColor="#9CA3AF"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.label}>Төрөл</Text>
          <View style={styles.pickerContainer}>
          <TouchableOpacity
        style={styles.selectBox}
        onPress={() => setOpen(!open)}
      >
        <Text>{selected}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdown}>
          {categories.map((item, index) =>
           {
            const isSelected = selected === item.label;
            return(
            <TouchableOpacity
              key={index}
              style={[styles.item ,isSelected && { backgroundColor: '#fff' }]}
              onPress={() => {
                setSelected(item.label);
                setCategory(item.value);
                setOpen(false);
              }}
            >
              <Text>{item.label}</Text>
            </TouchableOpacity>
          )})}
        </View>
      )}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Тайлбар</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell us about the condition, size, or why you're swapping it..."
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Post Button */}
        <TouchableOpacity
          style={{ width: '100%', marginTop: 30, marginBottom: 40 }}
          onPress={handlePostProduct}
          disabled={loading}
        >
          <LinearGradient
            colors={['#1ECE90', '#FFD700']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.postButton, loading && { opacity: 0.6 }]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.postButtonText}>Пост хийх →</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <MaterialIcons name="lightbulb-outline" style={{ marginTop: 5 }} size={24} color="black" />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Бяцхан зөвлөмж</Text>
            <Text style={styles.infoText}>
              Сайн гэрэлтүүлэг болон тодорхой тайлбар нь амжилттай солилцоо хийх боломжийг 40% хүртэл нэмэгдүүлдэг.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 20,
    paddingTop: 10,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  imageUploadBox: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  imageContainer: {
    position: 'relative',
    width: '48%',
  },
  image: {
    width: "100%",
    height: 250,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  removeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  removeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  postButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'flex-start',
    gap: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#4B5563',
    flex: 1,
    lineHeight: 18,
  },
   selectBox: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    color: '#1F2937',
  },
  dropdown: {
    borderRadius: 8,
    marginTop: 5,
    backgroundColor: "#E5E7EB",
  },
  item: {
    padding: 10,
  },
  locationHint: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10,
    lineHeight: 18,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  locationButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#065F46',
  },
  locationCoords: {
    marginTop: 8,
    fontSize: 12,
    color: '#4B5563',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
  },
  toggleDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});

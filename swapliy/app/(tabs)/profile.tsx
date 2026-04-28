import MatchModal from '@/components/match-modal';
import { useAuth } from '@/contexts/auth-context';
import { getOrCreateDirectConversation } from '@/services/chat-service';
import { useToast } from '@/contexts/toast-context';
import {
  deleteProduct,
  getLikedProducts,
  getMatchedProducts,
  getUserProducts,
  getUserSwapCount,
  Product
} from '@/services/product-service';
import { addSampleProducts } from '@/services/sample-data';
import { uploadProfileImage } from '@/services/storage-service';
import { getUserProfile, updateUserProfile, UserProfile } from '@/services/user-service';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [likedProducts, setLikedProducts] = useState<Product[]>([]);
  const [matchedProducts, setMatchedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [seedingDatabase, setSeedingDatabase] = useState(false);
  const [activeTab, setActiveTab] = useState<'myProducts' | 'liked' | 'matched'>('myProducts');
  const [showPersonalInfoForm, setShowPersonalInfoForm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [productPendingDelete, setProductPendingDelete] = useState<Product | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingPhone, setEditingPhone] = useState('');
  const [editingAge, setEditingAge] = useState('');
  const [editingPicture, setEditingPicture] = useState('');
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [swapCount, setSwapCount] = useState(0);
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [selectedMatchData, setSelectedMatchData] = useState<{
    myProduct: Product | null;
    theirProduct: Product | null;
    theirUserEmail: string;
    theirUserAvatar?: string;
  }>({
    myProduct: null,
    theirProduct: null,
    theirUserEmail: '',
    theirUserAvatar: '',
  });

  const loadData = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const [userProducts, liked, matched, userProfile, swaps] = await Promise.all([
        getUserProducts(user.uid),
        getLikedProducts(user.uid),
        getMatchedProducts(user.uid),
        getUserProfile(user.uid),
        getUserSwapCount(user.uid),
      ]);
      setMyProducts(userProducts);
      setLikedProducts(liked);
      setMatchedProducts(matched);
      setProfile(userProfile);
      setSwapCount(swaps);

      if (userProfile) {
        setEditingName(userProfile.name || '');
        setEditingPhone(userProfile.phone || '');
        setEditingAge(userProfile.age?.toString() || '');
        setEditingPicture(userProfile.picture || '');
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      showToast('error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user?.uid])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [user?.uid]);

  const requestDeleteProduct = (product: Product) => {
    const isMatched = matchedProducts.some((p) => p.id === product.id);
    if (isMatched) {
      Alert.alert(
        'Matched product',
        'This product is already matched and cannot be deleted.',
        [{ text: 'OK' }]
      );
      return;
    }
    setProductPendingDelete(product);
  };

  const confirmDeleteProduct = async () => {
    if (!productPendingDelete) {
      return;
    }
    const productId = productPendingDelete.id;
    try {
      const success = await deleteProduct(productId);
      if (success) {
        setMyProducts((prev) => prev.filter((p) => p.id !== productId));
        showToast('success', 'Бараа амжилттай устгагдлаа.');
      } else {
        showToast('error', 'Match-той барааг устгах боломжгүй.');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast('error', 'Устгахад алдаа гарлаа.');
    } finally {
      setProductPendingDelete(null);
    }
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      await logout();
      setShowLogoutConfirm(false);
      showToast('success', 'Logged out successfully');
    } catch (error) {
      showToast('error', 'Failed to logout');
    }
  };

  const handleSeedDatabase = async () => {
    if (!user?.uid || !user?.email) {
      Alert.alert('Error', 'User information not available');
      return;
    }

    Alert.alert(
      'Seed Database',
      'This will add 12 sample products to your database. Continue?',
      [
        { text: 'Cancel', onPress: () => { } },
        {
          text: 'Add Sample Products',
          onPress: async () => {
            try {
              setSeedingDatabase(true);
              const result = await addSampleProducts(user.uid, user.email || '');

              if (result.success) {
                Alert.alert('Success', result.message);
                await loadData();
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to seed database');
              console.error('Error seeding database:', error);
            } finally {
              setSeedingDatabase(false);
            }
          },
        },
      ]
    );
  };

  const renderProductCard = (
    product: Product,
    showDelete: boolean = false,
    isMatched: boolean = false,
    onPress?: () => void
  ) => (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress} activeOpacity={onPress ? 0.92 : 1}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: product.images?.[0] }} style={styles.cardImage} />
        {isMatched && (
          <View style={styles.matchedBadge}>
            <MaterialIcons name="favorite" size={16} color="#FFF" />
            <Text style={styles.matchedBadgeText}>Matched</Text>
          </View>
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.imageOverlay} />
        <View style={styles.cardContentOverlay}>
          <View style={styles.categoryBadge}><Text style={styles.categoryText}>{product.category.toUpperCase()}</Text></View>
          <Text style={styles.cardTitle}>{product.name}</Text>
          <Text style={styles.cardSubtitle} numberOfLines={2}>
            {product.description || 'No description'}
          </Text>
          {showDelete && (
            <TouchableOpacity
              onPress={() => requestDeleteProduct(product)}
              style={[styles.deleteButton, isMatched && styles.deleteButtonDisabled]}
            >
              <MaterialIcons name="delete" size={20} color={"#ccc"} />
            </TouchableOpacity>

          )}
        </View>
      </View>
    </TouchableOpacity>

  );

  const handleSettingsPress = () => {
    setShowPersonalInfoForm(true);
  };

  const handleSavePersonalInfo = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not found');
      return;
    }

    const parsedAge = Number.parseInt(editingAge, 10);
    const safeAge = Number.isNaN(parsedAge) ? undefined : parsedAge;

    try {
      await updateUserProfile(user.uid, {
        name: editingName.trim(),
        phone: editingPhone.trim(),
        age: safeAge,
        picture: editingPicture.trim(),
      });
      showToast('success', 'Personal information updated successfully');
      setShowPersonalInfoForm(false);
      await loadData();
    } catch (error) {
      console.error('Error saving personal info:', error);
      showToast('error', 'Failed to save personal information');
    }
  };

  const handlePickProfileImage = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not found');
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access the media library is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      return;
    }

    try {
      setUploadingProfileImage(true);
      const uploadedUrl = await uploadProfileImage(result.assets[0].uri, user.uid);
      setEditingPicture(uploadedUrl);
      showToast('success', 'Profile image uploaded.');
    } catch (error) {
      console.error('Error uploading profile image:', error);
      showToast('error', 'Failed to upload profile image.');
    } finally {
      setUploadingProfileImage(false);
    }
  };

  const visibleMyProducts = myProducts.filter((product) => product.active !== false);
  const visibleLikedProducts = likedProducts.filter(
    (product) => product.active !== false && product.isPublic !== false
  );
  const visibleMatchedProducts = matchedProducts.filter(
    (product) => product.active !== false && (product.matches?.length || 0) > 0
  );

  const handleOpenMatchedModal = async (myProduct: Product) => {
    if (!user?.uid) {
      return;
    }

    const matchedUserId = myProduct.matches?.[0];
    if (!matchedUserId) {
      return;
    }

    try {
      const otherUserProducts = await getUserProducts(matchedUserId);
      const theirMatchedProduct =
        otherUserProducts.find((p) => p.matches?.includes(user.uid)) ||
        otherUserProducts.find((p) => p.likes?.includes(user.uid)) ||
        null;

      if (!theirMatchedProduct) {
        Alert.alert('Info', 'Matched product details not found yet.');
        return;
      }

      const matchedProfile = await getUserProfile(matchedUserId);
      setSelectedMatchData({
        myProduct,
        theirProduct: theirMatchedProduct,
        theirUserEmail: theirMatchedProduct.sellerEmail || '',
        theirUserAvatar: matchedProfile?.picture || '',
      });
      setMatchModalVisible(true);
    } catch (error) {
      console.error('Error opening matched modal:', error);
      Alert.alert('Error', 'Failed to open matched details.');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >

      <View style={styles.headerSection}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: profile?.picture || 'https://via.placeholder.com/150' }}
            style={styles.avatarImage}
          />
          <View style={styles.verifiedBadge}>
            <MaterialIcons name="check" size={10} color="white" />
            <Text style={styles.verifiedText}>VERIFIED</Text>
          </View>
        </View>

        <Text style={styles.headerName}>{profile?.name || user?.displayName || user?.email?.split('@')[0] || 'User'}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>Солилцоо: </Text>
            <Text style={styles.statValue}>{swapCount}</Text>
          </View>
          <View style={styles.statPill}>
            <MaterialIcons name="star" size={14} color="#FBBF24" />
            <Text style={styles.statLabel}> Үнэлгээ </Text>
            <Text style={styles.statValue}>{(profile?.ratingAverage ?? 0).toFixed(1)}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity onPress={handleLogout}>
            <LinearGradient colors={['#4FD1C5', '#E9D362']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.editButton}>
              <Text style={styles.editButtonText}>Log out</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsButton} onPress={handleSettingsPress}>
            <Ionicons name="settings-outline" size={20} color="#1ECE90" />
          </TouchableOpacity>
        </View>
      </View>
      <Modal
        animationType="slide"
        transparent
        visible={showPersonalInfoForm}
        onRequestClose={() => setShowPersonalInfoForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Personal Info</Text>

            <Image source={{ uri: editingPicture || 'https://via.placeholder.com/120' }} style={styles.profilePreviewImage} />
                        <TouchableOpacity style={styles.imageUploadButton} onPress={handlePickProfileImage} disabled={uploadingProfileImage}>
              {uploadingProfileImage ? (
                <ActivityIndicator size="small" color="#1ECE90" />
              ) : (
                <Text style={styles.imageUploadButtonText}>Upload profile image</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.inputLabel}>Full name</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={editingName}
              onChangeText={setEditingName}
            />
            <Text style={styles.inputLabel}>Phone number</Text>
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              value={editingPhone}
              onChangeText={setEditingPhone}
              keyboardType="phone-pad"
            />
            <Text style={styles.inputLabel}>Age</Text>
            <TextInput
              style={styles.input}
              placeholder="Age"
              value={editingAge}
              onChangeText={setEditingAge}
              keyboardType="numeric"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalSecondaryButton} onPress={() => setShowPersonalInfoForm(false)}>
                <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimaryButton} onPress={handleSavePersonalInfo}>
                <Text style={styles.modalPrimaryButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="fade"
        transparent
        visible={showLogoutConfirm}
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.confirmMessage}>Are you sure you want to logout?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalSecondaryButton} onPress={() => setShowLogoutConfirm(false)}>
                <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutConfirmButton} onPress={confirmLogout}>
                <Text style={styles.modalPrimaryButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="fade"
        transparent
        visible={productPendingDelete != null}
        onRequestClose={() => setProductPendingDelete(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.deleteModalIconCircle}>
              <MaterialIcons name="delete-outline" size={36} color="#DC2626" />
            </View>
            <Text style={styles.modalTitle}>Бараа устгах</Text>
            <Text style={styles.confirmMessage}>
              Та энэ барааг устгахдаа итгэлтэй байна уу? Устгасны дараа жагсаалтаас хасагдана.
            </Text>
            {productPendingDelete ? (
              <View style={styles.deleteModalPreview}>
                {productPendingDelete.images?.[0] ? (
                  <Image source={{ uri: productPendingDelete.images[0] }} style={styles.deleteModalThumb} />
                ) : (
                  <View style={[styles.deleteModalThumb, styles.deleteModalThumbPlaceholder]}>
                    <MaterialIcons name="inventory-2" size={28} color="#9CA3AF" />
                  </View>
                )}
                <View style={styles.deleteModalMeta}>
                  <Text style={styles.deleteModalName} numberOfLines={2}>
                    {productPendingDelete.name}
                  </Text>
                  <Text style={styles.deleteModalPrice}>
                    ${productPendingDelete.price.toLocaleString()}
                  </Text>
                  <Text style={styles.deleteModalCategory}>{productPendingDelete.category}</Text>
                </View>
              </View>
            ) : null}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => setProductPendingDelete(null)}
              >
                <Text style={styles.modalSecondaryButtonText}>Болих</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteModalConfirmButton} onPress={confirmDeleteProduct}>
                <Text style={styles.modalPrimaryButtonText}>Устгах</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Profile Section Tab Headers */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'myProducts' && styles.activeTab]}
          onPress={() => setActiveTab('myProducts')}
        >
          <Text style={[styles.tabText, activeTab === 'myProducts' && styles.activeTabText]}>
            My Products ({visibleMyProducts.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'liked' && styles.activeTab]}
          onPress={() => setActiveTab('liked')}
        >
          <Text style={[styles.tabText, activeTab === 'liked' && styles.activeTabText]}>
            Liked ({visibleLikedProducts.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'matched' && styles.activeTab]}
          onPress={() => setActiveTab('matched')}
        >
          <Text style={[styles.tabText, activeTab === 'matched' && styles.activeTabText]}>
            Matched ({visibleMatchedProducts.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" color="#1ECE90" style={{ marginTop: 20 }} />}

      {!loading && (
        <>
          {/* My Products Tab */}
          {activeTab === 'myProducts' && (
            <View style={styles.productsSection}>
              {visibleMyProducts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyStateText}>No products yet</Text>
                  <Text style={styles.emptyStateSubtext}>Start by adding your first product</Text>
                </View>
              ) : (
                <FlatList
                  data={visibleMyProducts}
                  renderItem={({ item }) => {
                    const isMatched = visibleMatchedProducts.some(p => p.id === item.id);
                    return renderProductCard(item, true, isMatched);
                  }}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  numColumns={2}
                  columnWrapperStyle={styles.productsGrid}
                  contentContainerStyle={{ paddingHorizontal: 10 }}
                />
              )}
            </View>
          )}

          {/* Liked Products Tab */}
          {activeTab === 'liked' && (
            <View style={styles.productsSection}>
              {visibleLikedProducts.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="favorite-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyStateText}>No liked products</Text>
                  <Text style={styles.emptyStateSubtext}>Start by swiping and liking products on the home feed</Text>
                </View>
              ) : (
                <FlatList
                  data={visibleLikedProducts}
                  renderItem={({ item }) =>
                    renderProductCard(item, false, false, () =>
                      router.push({ pathname: '/(tabs)/product/[id]', params: { id: item.id } })
                    )
                  }
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  numColumns={2}
                  columnWrapperStyle={styles.productsGrid}
                  contentContainerStyle={{ paddingHorizontal: 10 }}
                />
              )}
            </View>
          )}

          {/* Matched Products Tab */}
          {activeTab === 'matched' && (
            <View style={styles.productsSection}>
              {visibleMatchedProducts.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="favorite-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyStateText}>No matches yet</Text>
                  <Text style={styles.emptyStateSubtext}>Start by liking products on the home feed</Text>
                </View>
              ) : (
                <FlatList
                  data={visibleMatchedProducts}
                  renderItem={({ item }) =>
                    renderProductCard(item, false, true, () => handleOpenMatchedModal(item))
                  }
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  numColumns={2}
                  columnWrapperStyle={styles.productsGrid}
                  contentContainerStyle={{ paddingHorizontal: 10 }}
                />
              )}
            </View>
          )}
        </>
      )}
      <MatchModal
        visible={matchModalVisible}
        myProduct={selectedMatchData.myProduct}
        theirProduct={selectedMatchData.theirProduct}
        theirUserEmail={selectedMatchData.theirUserEmail}
        theirUserAvatar={selectedMatchData.theirUserAvatar}
        onUserPress={() => {
          if (!selectedMatchData.theirProduct) {
            return;
          }
          setMatchModalVisible(false);
          router.push({
            pathname: '/(tabs)/userprofile',
            params: {
              userId: selectedMatchData.theirProduct.sellerId,
              userName: selectedMatchData.theirUserEmail?.split('@')[0] || 'User',
            },
          });
        }}
        onClose={() => setMatchModalVisible(false)}
        onChat={async () => {
          if (!user?.uid || !selectedMatchData.theirProduct?.sellerId) {
            return;
          }

          const peerUserId = selectedMatchData.theirProduct.sellerId;
          const conversationId = await getOrCreateDirectConversation(user.uid, peerUserId, {
            myProductId: selectedMatchData.myProduct?.id,
            myProductName: selectedMatchData.myProduct?.name,
            theirProductId: selectedMatchData.theirProduct?.id,
            theirProductName: selectedMatchData.theirProduct?.name,
          });

          setMatchModalVisible(false);
          router.push({
            pathname: '/(tabs)/chat',
            params: {
              conversationId,
              peerId: peerUserId,
              peerName: selectedMatchData.theirUserEmail?.split('@')[0] || 'Matched User',
            },
          });
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  headerSection: { alignItems: 'center', paddingTop: 40, paddingBottom: 20 },
  avatarContainer: { marginBottom: 15, alignItems: 'center' },
  avatarImage: { width: 150, height: 150, borderRadius: 30, backgroundColor: '#EEE' },
  verifiedBadge: {
    position: 'absolute', bottom: -10, backgroundColor: '#FFFFFF',
    flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center',
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 2
  },
  verifiedText: { fontSize: 10, fontWeight: '800', color: '#6B7280', marginLeft: 4 },
  headerName: { fontSize: 24, fontWeight: 'bold', color: '#4B5563', marginVertical: 10 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statPill: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F3',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statLabel: { fontSize: 12, color: '#6B7280' },
  statValue: { fontSize: 12, fontWeight: 'bold', color: '#10B981' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  editButton: { paddingHorizontal: 30, paddingVertical: 10, borderRadius: 12 },
  editButtonText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  settingsButton: { backgroundColor: '#F0FDF4', padding: 10, borderRadius: 12 },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#1ECE90',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#1ECE90',
  },
  profileSection: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1ECE90',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  seedButton: {
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  seedButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  productsSection: {
    padding: 10,
    minHeight: 400,
  },
  productsGrid: {
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#E5E7EB',
  },
  matchedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
    gap: 4,
  },
  matchedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1ECE90',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  deleteButton: {
    width: "100%",
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  deleteButtonDisabled: {
    width: "100%",
  },
  deleteButtonText: {
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
  deleteButtonTextDisabled: {
    color: '#9CA3AF',
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  cardContainer: {
    width: '48%',
    height: 260,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: '#FFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  imageWrapper: { flex: 1 },
  cardImage: { width: '100%', height: '100%' },
  imageOverlay: { ...StyleSheet.absoluteFillObject },
  premiumBadge: {
    position: 'absolute', top: 15, left: 15,
    backgroundColor: 'rgba(79, 209, 197, 0.7)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8
  },
  premiumText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  cardContentOverlay: { position: 'absolute', bottom: 15, left: 15, right: 15 },
  categoryBadge: { backgroundColor: 'rgba(255,255,255,0.3)', alignSelf: 'flex-start', paddingHorizontal: 8, borderRadius: 4, marginBottom: 5 },
  categoryText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  cardTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  cardSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12 }
  ,
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  imageUploadButton: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  imageUploadButtonText: {
    color: '#065F46',
    fontWeight: '600',
  },
  profilePreviewImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignSelf: 'center',
    marginBottom: 10,
    backgroundColor: '#E5E7EB',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 14,
    color: '#111827',
  },
  inputLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  modalSecondaryButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalSecondaryButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  modalPrimaryButton: {
    backgroundColor: '#1ECE90',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalPrimaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  confirmMessage: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 12,
  },
  logoutConfirmButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  deleteModalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  deleteModalPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deleteModalThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  deleteModalThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteModalMeta: {
    flex: 1,
    minWidth: 0,
  },
  deleteModalName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  deleteModalPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1ECE90',
    marginBottom: 2,
  },
  deleteModalCategory: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'capitalize',
  },
  deleteModalConfirmButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
});

import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/toast-context';
import { getUserProducts, getUserSwapCount, Product } from '@/services/product-service';
import {
  getUserProfile,
  getUserVoteByVoter,
  rateUserProfile,
  UserProfile,
} from '@/services/user-service';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

function UserProfileProductCard({
  product,
  estimatedWidth,
  onOpenDetail,
}: {
  product: Product;
  estimatedWidth: number;
  onOpenDetail: (id: string) => void;
}) {
  const urls = useMemo(
    () => (product.images || []).filter((u): u is string => typeof u === 'string' && u.length > 0),
    [product.images]
  );
  const [pageW, setPageW] = useState(Math.max(120, estimatedWidth));
  const [slideIndex, setSlideIndex] = useState(0);

  const onImageScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (pageW <= 0) {
      return;
    }
    const x = e.nativeEvent.contentOffset.x;
    setSlideIndex(Math.round(x / pageW));
  };

  return (
    <View
      style={styles.cardContainer}
      onLayout={(e) => {
        const w = Math.round(e.nativeEvent.layout.width);
        if (w > 0 && w !== pageW) {
          setPageW(w);
        }
      }}
    >
      <View style={styles.cardImageArea}>
        {urls.length === 0 ? (
          <View style={styles.cardImageSingleWrap}>
            <View style={styles.cardImagePlaceholder}>
              <MaterialIcons name="image-not-supported" size={40} color="#D1D5DB" />
            </View>
          </View>
        ) : urls.length === 1 ? (
          <Image source={{ uri: urls[0] }} style={styles.cardImageSingle} resizeMode="cover" />
        ) : (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            onMomentumScrollEnd={onImageScrollEnd}
            scrollEventThrottle={16}
            style={styles.cardImageScroll}
          >
            {urls.map((uri) => (
              <Image key={uri} source={{ uri }} style={[styles.cardImagePage, { width: pageW }]} resizeMode="cover" />
            ))}
          </ScrollView>
        )}
      </View>
      <View style={styles.imageOverlay} pointerEvents="none" />
      {urls.length > 1 ? (
        <View style={styles.pagerDots} pointerEvents="none">
          {urls.map((_, i) => (
            <View key={i} style={[styles.pagerDot, i === slideIndex && styles.pagerDotActive]} />
          ))}
        </View>
      ) : null}
      <TouchableOpacity
        style={styles.cardContentOverlay}
        activeOpacity={0.88}
        onPress={() => onOpenDetail(product.id)}
      >
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{product.category?.toUpperCase?.() || 'ITEM'}</Text>
        </View>
        <Text style={styles.cardTitle}>{product.name}</Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {product.description || 'No description'}
        </Text>
        <View style={styles.detailHintRow}>
          <Text style={styles.detailHint}>Дэлгэрэнгүй</Text>
          <MaterialIcons name="chevron-right" size={18} color="rgba(255,255,255,0.95)" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

export default function UserProfileScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { user } = useAuth();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ userId?: string; userName?: string }>();
  const userId = typeof params.userId === 'string' ? params.userId : '';
  const userName = typeof params.userName === 'string' ? params.userName : 'User';
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [swapCount, setSwapCount] = useState(0);
  const [myVote, setMyVote] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const loadProfileData = useCallback(async () => {
    if (!userId) {
      return;
    }

    try {
      setLoading(true);
      const [products, userProfile, swaps] = await Promise.all([
        getUserProducts(userId),
        getUserProfile(userId),
        getUserSwapCount(userId),
      ]);
      setUserProducts(products);
      setProfile(userProfile);
      setSwapCount(swaps);

      if (user?.uid) {
        const vote = await getUserVoteByVoter(userId, user.uid);
        setMyVote(vote);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      showToast('error', 'Failed to load user profile.');
    } finally {
      setLoading(false);
    }
  }, [showToast, user?.uid, userId]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const handleRateUser = async (rating: number) => {
    if (!user?.uid) {
      Alert.alert('Login required', 'Please login to rate this profile.');
      return;
    }
    if (!userId) {
      return;
    }
    if (user.uid === userId) {
      Alert.alert('Not allowed', 'You cannot rate your own profile.');
      return;
    }

    const updated = await rateUserProfile(userId, user.uid, rating);
    if (!updated) {
      showToast('error', 'Failed to save rating.');
      return;
    }

    setMyVote(rating);
    setProfile(updated);
    showToast('success', `Your үнэлгээ: ${rating} stars`);
  };

  const estimatedCardWidth = Math.max(140, Math.floor((screenWidth - 20) * 0.48));

  const openProductDetail = (productId: string) => {
    router.push({ pathname: '/(tabs)/product/[id]', params: { id: productId } });
  };

  const renderProductCard = ({ item }: { item: Product }) => (
    <UserProfileProductCard
      product={item}
      estimatedWidth={estimatedCardWidth}
      onOpenDetail={openProductDetail}
    />
  );

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: profile?.picture || 'https://via.placeholder.com/120' }}
          style={styles.avatarImage}
        />
        <View style={styles.verifiedBadge}>
          <MaterialIcons name="check" size={10} color="white" />
          <Text style={styles.verifiedText}>VERIFIED</Text>
        </View>
      </View>
      <Text style={styles.headerName}>{profile?.name || userName}</Text>
      <Text style={styles.metaText}>{profile?.phone || 'No phone added'}</Text>
      <Text style={styles.metaText}>{profile?.age ? `Age: ${profile.age}` : 'Age: Not set'}</Text>
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
      {user?.uid !== userId && (
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => handleRateUser(star)}>
              <MaterialIcons
                name={(myVote ?? 0) >= star ? 'star' : 'star-border'}
                size={28}
                color="#FBBF24"
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
      <View style={styles.productsHeader}>
        <Text style={styles.productsTitle}>Products</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#1ECE90" />
      ) : (
        <FlatList
          data={userProducts}
          renderItem={renderProductCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.productsGrid}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={<Text style={styles.emptyText}>No products uploaded yet.</Text>}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  productsHeader:{
    width: '100%',
    height: 40,
    backgroundColor:"#fff",
    flex:1,
    justifyContent:'center',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  avatarContainer: {
    marginBottom: 15,
    alignItems: 'center',
  },
  avatarImage: {
    width: 150,
    height: 150,
    borderRadius: 30,
    backgroundColor: '#EEE',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    marginLeft: 4,
  },
  headerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4B5563',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
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
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10B981',
  },
  ratingRow: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 14,
    gap: 6,
    alignItems: 'center',
  },
  productsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  listContainer: {
    paddingBottom: 140,
    paddingHorizontal: 10,
  },
  productsGrid: {
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  cardContainer: {
    width: '48%',
    height: 260,
    marginBottom: 10,
    backgroundColor: '#FFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImageArea: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E5E7EB',
  },
  cardImageScroll: {
    flexGrow: 0,
    height: '100%',
  },
  cardImageSingleWrap: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
  },
  cardImageSingle: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
  },
  cardImagePage: {
    height: '100%',
    backgroundColor: '#E5E7EB',
  },
  cardImagePlaceholder: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pagerDots: {
    position: 'absolute',
    bottom: 72,
    left: 0,
    right: 0,
    zIndex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  pagerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  pagerDotActive: {
    backgroundColor: '#fff',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    zIndex: 1,
  },
  cardContentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 3,
    paddingHorizontal: 15,
    paddingTop: 28,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  detailHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 2,
  },
  detailHint: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 12,
    fontWeight: '700',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 5,
  },
  categoryText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 16,
  },
});
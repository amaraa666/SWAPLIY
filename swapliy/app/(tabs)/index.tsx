import MatchModal from '@/components/match-modal';
import { ProductFeedCard } from '@/components/product-feed-card';
import { useAuth } from '@/contexts/auth-context';
import { useFilter } from '@/contexts/filter-context';
import { getOrCreateDirectConversation } from '@/services/chat-service';
import { getAllProducts, getUserProducts, likeProduct, Product } from '@/services/product-service';
import { getUserProfile } from '@/services/user-service';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Swiper from 'react-native-deck-swiper';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedCategory, minPrice, maxPrice } = useFilter();
  const [products, setProducts] = useState<Product[]>([]);
  const [likedProductIds, setLikedProductIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sellerProfileImages, setSellerProfileImages] = useState<Record<string, string>>({});
  const [matchedUserAvatar, setMatchedUserAvatar] = useState('');
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [matchedData, setMatchedData] = useState<{
    myProduct: Product | null;
    theirProduct: Product | null;
    theirUserEmail: string;
  }>({
    myProduct: null,
    theirProduct: null,
    theirUserEmail: '',
  });
  const swiperRef = useRef<Swiper<Product>>(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const fetchedProducts = await getAllProducts();
      const filteredProducts = user?.uid
        ? fetchedProducts.filter(
            (product) =>
              product.sellerId !== user.uid &&
              (!selectedCategory || product.category === selectedCategory) &&
              (minPrice == null || product.price >= minPrice) &&
              (maxPrice == null || product.price <= maxPrice) &&
              !(product.matches && product.matches.includes(user.uid))
          )
        : fetchedProducts.filter(
            (product) =>
              (!selectedCategory || product.category === selectedCategory) &&
              (minPrice == null || product.price >= minPrice) &&
              (maxPrice == null || product.price <= maxPrice)
          );
      setProducts(filteredProducts);

      const uniqueSellerIds = Array.from(new Set(filteredProducts.map((product) => product.sellerId)));
      const imageEntries = await Promise.all(
        uniqueSellerIds.map(async (sellerId) => {
          const profile = await getUserProfile(sellerId);
          return [sellerId, profile?.picture || ''] as const;
        })
      );
      setSellerProfileImages(Object.fromEntries(imageEntries));

      // Set up liked products
      if (user?.uid) {
        const userLiked = new Set<string>();
        filteredProducts.forEach((product) => {
          if (product.likes && product.likes.includes(user.uid)) {
            userLiked.add(product.id);
          }
        });
        setLikedProductIds(userLiked);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [user?.uid, selectedCategory, minPrice, maxPrice])
  );

  const handleSwipedLeft = (cardIndex: number) => {
    // Do nothing on left swipe (dislike)
  };

  const handleSwipedRight = async (cardIndex: number) => {
    // Handle like on right swipe
    if (!user?.uid || cardIndex < 0 || cardIndex >= products.length) {
      return;
    }

    const product = products[cardIndex];

    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to like products');
      return;
    }

    try {
      const result = await likeProduct(product.id, user.uid);
      if (result.success) {
        const newLiked = new Set(likedProductIds);
        newLiked.add(product.id);
        setLikedProductIds(newLiked);

        // Update product in list
        const updatedProducts = products.map((p) =>
          p.id === product.id
            ? { ...p, likes: [...(p.likes || []), user.uid] }
            : p
        );
        setProducts(updatedProducts);
        
        // Show match modal if there's a mutual like
        if (result.isMatch) {
          // Find one of the user's products that the product owner liked
          const userProducts = await getUserProducts(user.uid);
          const matchedUserProduct = userProducts.find(
            (p) => p.likes && p.likes.includes(product.sellerId)
          );

          if (matchedUserProduct) {
            const matchedProfile = await getUserProfile(product.sellerId);
            setMatchedUserAvatar(matchedProfile?.picture || '');
            setMatchedData({
              myProduct: matchedUserProduct,
              theirProduct: product,
              theirUserEmail: product.sellerEmail,
            });
            setMatchModalVisible(true);
          }
        }
      }
    } catch (error) {
      console.error('Error liking product:', error);
    }
  };

  const handleCloseMatchModal = () => {
    setMatchModalVisible(false);
  };

  const handleChat = async () => {
    setMatchModalVisible(false);
    if (!user?.uid || !matchedData.theirProduct?.sellerId) {
      return;
    }

    const peerUserId = matchedData.theirProduct.sellerId;
    const conversationId = await getOrCreateDirectConversation(user.uid, peerUserId, {
      myProductId: matchedData.myProduct?.id,
      myProductName: matchedData.myProduct?.name,
      theirProductId: matchedData.theirProduct?.id,
      theirProductName: matchedData.theirProduct?.name,
    });

    router.push({
      pathname: '/(tabs)/chat',
      params: {
        conversationId,
        peerId: peerUserId,
        peerName: matchedData.theirProduct.sellerEmail?.split('@')[0] || 'Matched User',
      },
    });
  };

  const navigateToUserProfile = (userId: string, userName: string) => {
    router.push({
      pathname: '/(tabs)/userprofile',
      params: { userId, userName },
    });
  };

  const renderProductCard = (product: Product) => {
    return (
      <View style={styles.cardWrapper}>
        <ProductFeedCard
          product={product}
          sellerProfileImage={sellerProfileImages[product.sellerId]}
          onSellerPress={navigateToUserProfile}
          mode="swiper"
          descriptionNumberOfLines={3}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1ECE90" />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="shopping-cart" size={60} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Products Available</Text>
          <Text style={styles.emptySubtitle}>Check back later for new public products</Text>
        </View>
      ) : (
        <>
          <Swiper
            ref={swiperRef}
            cards={products}
            renderCard={renderProductCard}
            keyExtractor={(item) => item.id}
            onSwipedLeft={handleSwipedLeft}
            onSwipedRight={handleSwipedRight}
            onTapCard={() => {}}
            cardIndex={0}
            backgroundColor="transparent"
            showSecondCard
            stackSize={3}
            stackSeparation={14}
            stackScale={5}
            verticalSwipe={false}
            useViewOverflow
            containerStyle={styles.swiperContainer}
            cardStyle={styles.swiperCard}
          />

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => swiperRef.current?.swipeLeft()}
            >
              <MaterialIcons name="close" size={32} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.superLikeButton}
              onPress={() => swiperRef.current?.swipeRight()}
            >
              <MaterialIcons name="favorite" size={32} color="#FFF" />
            </TouchableOpacity>
          </View>
          <MatchModal
            visible={matchModalVisible}
            myProduct={matchedData.myProduct}
            theirProduct={matchedData.theirProduct}
            theirUserEmail={matchedData.theirUserEmail}
            theirUserAvatar={matchedUserAvatar}
            onUserPress={() => {
              if (!matchedData.theirProduct) {
                return;
              }
              setMatchModalVisible(false);
              router.push({
                pathname: '/(tabs)/userprofile',
                params: {
                  userId: matchedData.theirProduct.sellerId,
                  userName: matchedData.theirProduct.sellerEmail?.split('@')[0] || 'User',
                },
              });
            }}
            onClose={handleCloseMatchModal}
            onChat={handleChat}
          />
        </>
      )}
    </View>
  );

  };


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swiperContainer: {
    flex: 1,
    marginTop: -42,
    paddingHorizontal: 16,
    paddingBottom: 100,
    position: 'relative',
    zIndex: 1,
  },
  swiperCard: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  cardWrapper: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  actionButtons: {
    position: 'absolute',
    bottom: -5,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 50,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  rejectButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  superLikeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1ECE90',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
});
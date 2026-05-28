import { Product } from '@/services/product-service';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { height: SCREEN_H } = Dimensions.get('window');

type ProductFeedCardProps = {
  product: Product;
  sellerProfileImage?: string;
  onSellerPress: (userId: string, userName: string) => void;
  /** Swiper deck card vs full-page detail */
  mode: 'swiper' | 'standalone';
  /** Omit or pass undefined for full description (standalone). */
  descriptionNumberOfLines?: number;
};

export function ProductFeedCard({
  product,
  sellerProfileImage,
  onSellerPress,
  mode,
  descriptionNumberOfLines,
}: ProductFeedCardProps) {
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [imageContainerWidth, setImageContainerWidth] = React.useState(0);
  const descProps =
    descriptionNumberOfLines != null ? { numberOfLines: descriptionNumberOfLines } : {};
  const hasMultipleImages = (product.images?.length || 0) > 1;

  React.useEffect(() => {
    setActiveImageIndex(0);
  }, [product.id]);

  return (
    <View style={[styles.card, mode === 'swiper' ? styles.cardSwiper : styles.cardStandalone]}>
      <View
        style={[
          styles.imageContainer,
          mode === 'swiper' ? styles.imageDeck : styles.imageStandalone,
        ]}
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          if (width > 0 && width !== imageContainerWidth) {
            setImageContainerWidth(width);
          }
        }}
      >
        {product.images && product.images.length > 0 ? (
          mode === 'standalone' && hasMultipleImages ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                  if (!imageContainerWidth) {
                    return;
                  }
                  const nextIndex = Math.round(
                    event.nativeEvent.contentOffset.x / imageContainerWidth
                  );
                  setActiveImageIndex(nextIndex);
                }}
              >
                {product.images.map((imageUri, index) => (
                  <Image
                    key={`${product.id}-image-${index}`}
                    source={{ uri: imageUri }}
                    style={[
                      styles.image,
                      imageContainerWidth > 0 ? { width: imageContainerWidth } : null,
                    ]}
                  />
                ))}
              </ScrollView>
              <View style={styles.paginationDots}>
                {product.images.map((_, index) => (
                  <View
                    key={`${product.id}-dot-${index}`}
                    style={[
                      styles.dot,
                      index === activeImageIndex ? styles.dotActive : null,
                    ]}
                  />
                ))}
              </View>
            </>
          ) : (
            <Image source={{ uri: product.images[0] }} style={styles.image} />
          )
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <MaterialIcons name="image-not-supported" size={40} color="#D1D5DB" />
          </View>
        )}
      </View>

      <View style={[styles.infoBase, mode === 'swiper' ? styles.infoDeck : styles.infoStandalone]}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={2}>
              {product.name}
            </Text>
            <Text style={styles.category}>{product.category}</Text>
          </View>
          <View>
            <Text style={styles.price}>${product.price.toLocaleString()}</Text>
            <View style={styles.likeCount}>
              <MaterialIcons name="favorite" size={14} color="#EF4444" />
              <Text style={styles.likeCountText}>{product.likes?.length || 0}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.description} {...descProps}>
          {product.description}
        </Text>

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() =>
              onSellerPress(product.sellerId, product.sellerEmail?.split('@')[0] || 'User')
            }
            style={styles.sellerInfo}
          >
            <View style={styles.sellerAvatar}>
              {sellerProfileImage ? (
                <Image source={{ uri: sellerProfileImage }} style={styles.sellerAvatarImage} />
              ) : (
                <MaterialIcons name="person" size={16} color="#1ECE90" />
              )}
            </View>
            <Text style={styles.sellerEmail} numberOfLines={1}>
              {product.sellerEmail?.split('@')[0] || 'User'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  cardSwiper: {
    height: '80%',
  },
  cardStandalone: {
    width: '100%',
    minHeight: SCREEN_H * 0.72,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
  },
  imageDeck: {
    height: '60%',
  },
  imageStandalone: {
    height: SCREEN_H * 0.38,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  dotActive: {
    width: 16,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  infoBase: {
    padding: 16,
    justifyContent: 'space-between',
  },
  infoDeck: {
    height: '40%',
  },
  infoStandalone: {
    flexGrow: 1,
    minHeight: 220,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  name: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'capitalize',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1ECE90',
    marginBottom: 4,
  },
  likeCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeCountText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sellerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  sellerEmail: {
    fontSize: 12,
    color: '#6B7280',
  },
});

import { Product } from '@/services/product-service';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  const descProps =
    descriptionNumberOfLines != null ? { numberOfLines: descriptionNumberOfLines } : {};

  return (
    <View style={[styles.card, mode === 'swiper' ? styles.cardSwiper : styles.cardStandalone]}>
      <View
        style={[
          styles.imageContainer,
          mode === 'swiper' ? styles.imageDeck : styles.imageStandalone,
        ]}
      >
        {product.images && product.images.length > 0 ? (
          <Image source={{ uri: product.images[0] }} style={styles.image} />
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
    height: '85%',
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

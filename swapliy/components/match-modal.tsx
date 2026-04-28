import { Product } from '@/services/product-service';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Dimensions,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface MatchModalProps {
  visible: boolean;
  myProduct: Product | null;
  theirProduct: Product | null;
  theirUserEmail: string;
  theirUserAvatar?: string;
  onUserPress?: () => void;
  onClose: () => void;
  onChat: () => void;
}

const { width } = Dimensions.get('window');

export default function MatchModal({
  visible,
  myProduct,
  theirProduct,
  theirUserEmail,
  theirUserAvatar,
  onUserPress,
  onClose,
  onChat,
}: MatchModalProps) {
  if (!myProduct || !theirProduct) return null;

  const userName = theirUserEmail?.split('@')[0] || 'User';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
        >
          <MaterialIcons name="close" size={28} color="#1F2937" />
        </TouchableOpacity>

        <View style={styles.matchCard}>
          <Text style={styles.matchTitle}>It&apos;s a Match!</Text>
          <Text style={styles.matchSubtitle}>
            You and {userName} have liked each other&apos;s products!
          </Text>

          {/* Products Container */}
          <View style={styles.productsContainer}>
            {/* My Product */}
            <View style={styles.productWrapper}>
              <View style={styles.productImageWrapper}>
                {myProduct.images && myProduct.images.length > 0 ? (
                  <Image
                    source={{ uri: myProduct.images[0] }}
                    style={styles.productImage}
                  />
                ) : (
                  <View style={[styles.productImage, styles.imagePlaceholder]}>
                    <MaterialIcons name="image-not-supported" size={40} color="#D1D5DB" />
                  </View>
                )}
                <View style={styles.myItemBadge}>
                  <Text style={styles.badgeText}>MY ITEM</Text>
                </View>
              </View>
              <Text style={styles.productName} numberOfLines={1}>{myProduct.name}</Text>
              <Text style={styles.productPrice}>${myProduct.price.toLocaleString()}</Text>
            </View>

            {/* Heart Connection */}
            <View style={styles.heartContainer}>
              <View style={styles.heartCircle}>
                <MaterialIcons name="favorite" size={32} color="#FFF" />
              </View>
            </View>

            {/* Their Product */}
            <View style={styles.productWrapper}>
              <View style={styles.productImageWrapper}>
                {theirProduct.images && theirProduct.images.length > 0 ? (
                  <Image
                    source={{ uri: theirProduct.images[0] }}
                    style={styles.productImage}
                  />
                ) : (
                  <View style={[styles.productImage, styles.imagePlaceholder]}>
                    <MaterialIcons name="image-not-supported" size={40} color="#D1D5DB" />
                  </View>
                )}
                <View style={styles.theirItemBadge}>
                  <Text style={styles.badgeText}>THEIR ITEM</Text>
                </View>
              </View>
              <Text style={styles.productName} numberOfLines={1}>{theirProduct.name}</Text>
              <Text style={styles.productPrice}>${theirProduct.price.toLocaleString()}</Text>
            </View>
          </View>

          {/* User Info */}
          <TouchableOpacity style={styles.userInfoContainer} onPress={onUserPress} activeOpacity={onUserPress ? 0.8 : 1}>
            {theirUserAvatar ? (
              <Image source={{ uri: theirUserAvatar }} style={styles.userAvatarImage} />
            ) : (
              <View style={styles.userAvatar}>
                <MaterialIcons name="person" size={24} color="#1ECE90" />
              </View>
            )}
            <View style={styles.userDetails}>
              <Text style={styles.userLabel}>Verified match with</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
          </TouchableOpacity>

          {/* Buttons */}
          <LinearGradient
            colors={['#1ECE90', '#10B981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.chatButtonGradient}
          >
            <TouchableOpacity
              style={styles.chatButton}
              onPress={onChat}
            >
              <MaterialIcons name="chat-bubble-outline" size={20} color="#FFF" />
              <Text style={styles.chatButtonText}>Start Chatting</Text>
            </TouchableOpacity>
          </LinearGradient>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={onClose}
          >
            <Text style={styles.continueButtonText}>Continue Exploring</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  matchCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  matchTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1ECE90',
    marginBottom: 8,
  },
  matchSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  productsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    marginBottom: 24,
    width: '100%',
  },
  productWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  productImageWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  productImage: {
    width: 110,
    height: 110,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  myItemBadge: {
    position: 'absolute',
    bottom: -10,
    left: 0,
    backgroundColor: '#FCD34D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  theirItemBadge: {
    position: 'absolute',
    bottom: -10,
    right: 0,
    backgroundColor: '#06B6D4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  productName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1ECE90',
  },
  heartContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: -20,
    zIndex: 1,
  },
  heartCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1ECE90',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    borderWidth: 4,
    borderColor: '#FFF',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  chatButtonGradient: {
    width: '100%',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  chatButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  continueButton: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
});

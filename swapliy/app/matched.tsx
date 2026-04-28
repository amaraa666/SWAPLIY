import { useAuth } from '@/contexts/auth-context';
import { getMatchedProducts, Product } from '@/services/product-service';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function MatchedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [matchedProducts, setMatchedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadMatched = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const matched = await getMatchedProducts(user.uid);
      setMatchedProducts(matched);
    } catch (error) {
      console.error('Error loading matched products:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMatched();
    }, [user?.uid])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMatched();
    setRefreshing(false);
  }, [user?.uid]);

  const renderMatchedCard = ({ item }: { item: Product }) => (
    <View style={styles.matchCard} key={item.id}>
      <View style={styles.matchCardHeader}>
        <Text style={styles.matchCardTitle}>It's a Match!</Text>
        <View style={styles.matchBadge}>
          <MaterialIcons name="favorite" size={16} color="#FFF" />
          <Text style={styles.matchBadgeText}>{item.matches?.length || 0} matched</Text>
        </View>
      </View>

      <View style={styles.imageRow}>
        {item.images && item.images.length > 0 ? (
          <Image source={{ uri: item.images[0] }} style={styles.matchImage} />
        ) : (
          <View style={[styles.matchImage, styles.imagePlaceholder]}>
            <MaterialIcons name="image-not-supported" size={40} color="#D1D5DB" />
          </View>
        )}
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productCategory}>{item.category}</Text>
        <Text style={styles.productPrice}>${item.price.toLocaleString()}</Text>
        <Text style={styles.matchInfo}>Matched with {item.matches?.length || 0} user(s)</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color="#1F2937" />
          <Text style={styles.navText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Matched</Text>
        <View style={{ width: 64 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1ECE90" />
        </View>
      ) : matchedProducts.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="heart-off" size={60} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptySubtitle}>Like items from the Home feed to start matching.</Text>
        </View>
      ) : (
        <FlatList
          data={matchedProducts}
          renderItem={renderMatchedCard}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingTop: 40,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  matchCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 6,
  },
  matchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  matchCardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1ECE90',
  },
  matchBadge: {
    backgroundColor: '#1ECE90',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matchBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  imageRow: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchImage: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    marginTop: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  productCategory: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1ECE90',
    marginBottom: 8,
  },
  matchInfo: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  emptySubtitle: {
    marginTop: 10,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

import { ProductFeedCard } from '@/components/product-feed-card';
import { useAuth } from '@/contexts/auth-context';
import { getProductById, likeProduct, type Product } from '@/services/product-service';
import { getUserProfile } from '@/services/user-service';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [sellerProfileImage, setSellerProfileImage] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [likeBusy, setLikeBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id || typeof id !== 'string') {
      setProduct(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const p = await getProductById(id);
      setProduct(p);
      if (p?.sellerId) {
        const profile = await getUserProfile(p.sellerId);
        setSellerProfileImage(profile?.picture || undefined);
      } else {
        setSellerProfileImage(undefined);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const navigateToUserProfile = (userId: string, userName: string) => {
    router.push({
      pathname: '/(tabs)/userprofile',
      params: { userId, userName },
    });
  };

  const handleLike = async () => {
    if (!user?.uid || !product) {
      Alert.alert('Нэвтрэх', 'Та эхлээд нэвтэрнэ үү.');
      return;
    }
    if (product.sellerId === user.uid) {
      return;
    }
    if (product.likes?.includes(user.uid)) {
      return;
    }
    setLikeBusy(true);
    try {
      const result = await likeProduct(product.id, user.uid);
      if (result.success) {
        const refreshed = await getProductById(product.id);
        if (refreshed) {
          setProduct(refreshed);
        }
        if (result.isMatch) {
          Alert.alert('Тохиролцоо!', 'Та энэ бараатай таарлаа.');
        }
      }
    } catch {
      Alert.alert('Алдаа', 'Дуртай болгоход алдаа гарлаа.');
    } finally {
      setLikeBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1ECE90" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="inventory-2" size={48} color="#D1D5DB" />
        <Text style={styles.notFound}>Бараа олдсонгүй</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Буцах</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const canLike =
    user?.uid && product.sellerId !== user.uid && !product.likes?.includes(user.uid);

  const tabBarReserve = 72;

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: 8 }]}>
        <TouchableOpacity
          style={styles.topBarBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialIcons name="arrow-back-ios-new" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Бараа</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(insets.bottom, 12) + (canLike ? tabBarReserve + 56 : tabBarReserve),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ProductFeedCard
          product={product}
          sellerProfileImage={sellerProfileImage}
          onSellerPress={navigateToUserProfile}
          mode="standalone"
        />
         {canLike ? (
        <View
          style={[
            styles.likeBar,
            { paddingBottom: Math.max(insets.bottom, 8) + tabBarReserve },
          ]}
        >
          <TouchableOpacity
            style={[styles.likeBtn, likeBusy && { opacity: 0.6 }]}
            onPress={handleLike}
            disabled={likeBusy}
          >
            {likeBusy ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialIcons name="favorite" size={24} color="#fff" />
                <Text style={styles.likeBtnText}>Дуртай</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
      </ScrollView>

     
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    gap: 12,
  },
  notFound: {
    fontSize: 16,
    color: '#6B7280',
  },
  backBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#1ECE90',
    borderRadius: 10,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
    backgroundColor: '#F3F4F6',
  },
  topBarBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  likeBar: {
    marginTop: 20,
    height: 200,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
    borderTopColor: '#E5E7EB',
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1ECE90',
    paddingVertical: 14,
    borderRadius: 14,
  },
  likeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

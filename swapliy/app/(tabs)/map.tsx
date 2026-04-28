import { useAuth } from '@/contexts/auth-context';
import { getProductsNearby, type Product } from '@/services/product-service';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const RADIUS_PRESETS_KM = [1, 3, 5, 10, 25, 50] as const;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function MapScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [locLoading, setLocLoading] = useState(true);
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [pinnedProduct, setPinnedProduct] = useState<Product | null>(null);
  const mapRef = useRef<MapView>(null);

  const refreshLocation = useCallback(async () => {
    setLocLoading(true);
    setLocError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocError('Байршлын зөвшөөрөл өгөгдөөгүй байна.');
        setCoords(null);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
    } catch {
      setLocError('Байршлыг уншиж чадсангүй.');
      setCoords(null);
    } finally {
      setLocLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  useEffect(() => {
    if (!coords) {
      setProducts([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setProductsLoading(true);
      try {
        const list = await getProductsNearby(coords.latitude, coords.longitude, radiusKm);
        const filtered = user?.uid ? list.filter((p) => p.sellerId !== user.uid) : list;
        if (!cancelled) {
          setProducts(filtered);
        }
      } finally {
        if (!cancelled) {
          setProductsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [coords, radiusKm, user?.uid]);

  const region = useMemo(() => {
    if (!coords) {
      return null;
    }
    const latDelta = Math.min(0.5, (radiusKm / 111) * 2.2);
    const lonDelta = latDelta;
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: latDelta,
      longitudeDelta: lonDelta,
    };
  }, [coords, radiusKm]);

  useEffect(() => {
    if (Platform.OS === 'web' || !mapRef.current || !region) {
      return;
    }
    mapRef.current.animateToRegion(region, 350);
  }, [region]);

  const openProductDetail = (p: Product) => {
    setPinnedProduct(null);
    router.push({ pathname: '/(tabs)/product/[id]', params: { id: p.id } });
  };

  if (locLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1ECE90" />
        <Text style={styles.muted}>Байршил ачаалж байна…</Text>
      </View>
    );
  }

  if (!coords && locError) {
    return (
      <View style={[styles.centered, { paddingHorizontal: 24 }]}>
        <MaterialIcons name="location-off" size={48} color="#9CA3AF" />
        <Text style={styles.errorTitle}>{locError}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refreshLocation}>
          <Text style={styles.retryText}>Дахин оролдох</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!coords) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Байршил олдсонгүй.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refreshLocation}>
          <Text style={styles.retryText}>Дахин оролдох</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const panelBottom = Math.max(insets.bottom, 12) + 8;

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.webBanner}>
          <MaterialIcons name="map" size={22} color="#065F46" />
          <Text style={styles.webBannerText}>
            Вэб дээр газрын зураг идэвхгүй. Ойролцоох жагсаалт доор харагдана.
          </Text>
        </View>
        <View style={styles.radiusRow}>
          <Text style={styles.radiusLabel}>Радиус (км)</Text>
          <View style={styles.chipsWrap}>
            {RADIUS_PRESETS_KM.map((km) => (
              <TouchableOpacity
                key={km}
                style={[styles.chip, radiusKm === km && styles.chipActive]}
                onPress={() => setRadiusKm(km)}
              >
                <Text style={[styles.chipText, radiusKm === km && styles.chipTextActive]}>{km}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {productsLoading ? (
          <ActivityIndicator style={{ marginTop: 16 }} color="#1ECE90" />
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: panelBottom + 24, paddingHorizontal: 16 }}
            ListEmptyComponent={
              <Text style={styles.empty}>Энэ радиус дотор байршилтай бараа олдсонгүй.</Text>
            }
            renderItem={({ item }) => {
              const loc = item.location!;
              const d = haversineKm(coords.latitude, coords.longitude, loc.latitude, loc.longitude);
              return (
                <TouchableOpacity
                  style={styles.listCard}
                  onPress={() => openProductDetail(item)}
                  activeOpacity={0.85}
                >
                  <View style={styles.listRow}>
                    <View style={styles.listPinIcon}>
                      <MaterialIcons name="place" size={28} color="#1ECE90" />
                    </View>
                    <View style={styles.listTextCol}>
                      <Text style={styles.listTitle} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.listMeta}>
                        ${item.price.toLocaleString()} · {d.toFixed(1)} км
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {region ? (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={region}
          showsUserLocation
          showsMyLocationButton
        >
          <Circle
            zIndex={1}
            center={{ latitude: coords.latitude, longitude: coords.longitude }}
            radius={radiusKm * 1000}
            strokeColor="rgba(30, 206, 144, 0.85)"
            fillColor="rgba(30, 206, 144, 0.12)"
            strokeWidth={2}
          />
          {products.map((p) => {
            const loc = p.location;
            if (!loc) {
              return null;
            }
            return (
              <Marker
                key={p.id}
                coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
                anchor={{ x: 0.5, y: 1 }}
                zIndex={1000}
                tracksViewChanges
                onPress={() => setPinnedProduct(p)}
              >
                <MaterialIcons name="location-on" size={40} color="#1ECE90" />
              </Marker>
            );
          })}
        </MapView>
      ) : null}

      <Modal
        visible={pinnedProduct != null}
        transparent
        animationType="fade"
        onRequestClose={() => setPinnedProduct(null)}
      >
        <View style={styles.sheetRoot}>
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityLabel="Хаах"
            onPress={() => setPinnedProduct(null)}
          />
          <View style={styles.sheetCardWrap} pointerEvents="box-none">
            {pinnedProduct ? (
              <View style={styles.sheetCard}>
                <Text style={styles.sheetTitle}>Барааны мэдээлэл</Text>
                {pinnedProduct.images?.[0] ? (
                  <Image source={{ uri: pinnedProduct.images[0] }} style={styles.sheetImage} />
                ) : null}
                <Text style={styles.sheetName} numberOfLines={2}>
                  {pinnedProduct.name}
                </Text>
                <Text style={styles.sheetCategory}>{pinnedProduct.category}</Text>
                <Text style={styles.sheetPrice}>${pinnedProduct.price.toLocaleString()}</Text>
                {coords && pinnedProduct.location ? (
                  <Text style={styles.sheetDistance}>
                    {haversineKm(
                      coords.latitude,
                      coords.longitude,
                      pinnedProduct.location.latitude,
                      pinnedProduct.location.longitude
                    ).toFixed(1)}{' '}
                    км · таны байршлаас
                  </Text>
                ) : null}
                <ScrollView style={styles.sheetDescScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  <Text style={styles.sheetDescription}>{pinnedProduct.description || '—'}</Text>
                </ScrollView>
                <Text style={styles.sheetSeller} numberOfLines={1}>
                  Зарагч: {pinnedProduct.sellerEmail?.split('@')[0] || '—'}
                </Text>
                <View style={styles.sheetActions}>
                  <TouchableOpacity style={styles.sheetBtnSecondary} onPress={() => setPinnedProduct(null)}>
                    <Text style={styles.sheetBtnSecondaryText}>Хаах</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sheetBtnPrimary}
                    onPress={() => openProductDetail(pinnedProduct)}
                  >
                    <Text style={styles.sheetBtnPrimaryText}>Дэлгэрэнгүй</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      <View style={[styles.overlay, { paddingBottom: panelBottom }]}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Ойролцоох</Text>
            {productsLoading ? (
              <ActivityIndicator size="small" color="#1ECE90" />
            ) : (
              <Text style={styles.count}>{products.length} бараа</Text>
            )}
          </View>
          <Text style={styles.radiusLabel}>Радиус (км)</Text>
          <View style={styles.chipsWrap}>
            {RADIUS_PRESETS_KM.map((km) => (
              <TouchableOpacity
                key={km}
                style={[styles.chip, radiusKm === km && styles.chipActive]}
                onPress={() => setRadiusKm(km)}
              >
                <Text style={[styles.chipText, radiusKm === km && styles.chipTextActive]}>{km}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.refreshLoc} onPress={refreshLocation}>
            <MaterialIcons name="my-location" size={18} color="#065F46" />
            <Text style={styles.refreshLocText}>Байршлыг шинэчлэх</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#F3F4F6',
  },
  muted: {
    fontSize: 14,
    color: '#6B7280',
  },
  errorTitle: {
    fontSize: 15,
    color: '#374151',
    textAlign: 'center',
    marginTop: 8,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#1ECE90',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  count: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1ECE90',
  },
  radiusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#1ECE90',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  chipTextActive: {
    color: '#065F46',
  },
  refreshLoc: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
  },
  refreshLocText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
  },
  webBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    padding: 14,
    margin: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  webBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#065F46',
    lineHeight: 18,
  },
  radiusRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listPinIcon: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listTextCol: {
    flex: 1,
    minWidth: 0,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  listMeta: {
    marginTop: 6,
    fontSize: 13,
    color: '#6B7280',
  },
  empty: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 24,
    fontSize: 14,
  },
  markerPinWrap: {
    width: 48,
    height: 56,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  markerHead: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1ECE90',
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  markerPoint: {
    width: 0,
    height: 0,
    marginTop: -4,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderTopWidth: 13,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1ECE90',
  },
  sheetRoot: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetCardWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sheetCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    maxHeight: '78%',
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1ECE90',
    textAlign: 'center',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sheetImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  sheetName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sheetCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  sheetPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1ECE90',
    marginBottom: 6,
  },
  sheetDistance: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 10,
  },
  sheetDescScroll: {
    maxHeight: 120,
    marginBottom: 10,
  },
  sheetDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  sheetSeller: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
  },
  sheetBtnSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  sheetBtnSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  sheetBtnPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1ECE90',
    alignItems: 'center',
  },
  sheetBtnPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});

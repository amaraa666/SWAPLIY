import { useFilter } from '@/contexts/filter-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const categories = [
  { label: 'All', value: null, icon: 'apps-outline' as const },
  { label: 'Electronics', value: 'electronics', icon: 'phone-portrait-outline' as const },
  { label: 'Clothing', value: 'clothing', icon: 'shirt-outline' as const },
  { label: 'Books', value: 'books', icon: 'book-outline' as const },
  { label: 'Home & Garden', value: 'home', icon: 'home-outline' as const },
  { label: 'Sports', value: 'sports', icon: 'football-outline' as const },
  { label: 'Toys', value: 'toys', icon: 'game-controller-outline' as const },
  { label: 'Other', value: 'other', icon: 'grid-outline' as const },
];

export default function FiltersScreen() {
  const router = useRouter();
  const { selectedCategory, setSelectedCategory, minPrice, maxPrice, setPriceRange } = useFilter();
  const [minInput, setMinInput] = useState('');
  const [maxInput, setMaxInput] = useState('');

  useEffect(() => {
    setMinInput(minPrice != null ? String(minPrice) : '');
    setMaxInput(maxPrice != null ? String(maxPrice) : '');
  }, [maxPrice, minPrice]);

  const applyFilter = () => {
    const parsedMin = minInput.trim() ? Number(minInput) : null;
    const parsedMax = maxInput.trim() ? Number(maxInput) : null;
    const safeMin = parsedMin != null && !Number.isNaN(parsedMin) ? parsedMin : null;
    const safeMax = parsedMax != null && !Number.isNaN(parsedMax) ? parsedMax : null;
    setPriceRange(safeMin, safeMax);
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={26} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Category Filter</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.list}>
        {categories.map((item) => {
          const isActive = selectedCategory === item.value;
          return (
            <TouchableOpacity
              key={item.label}
              style={[styles.item, isActive && styles.itemActive]}
              onPress={() => setSelectedCategory(item.value)}
            >
              <View style={[styles.itemIconWrap, isActive && styles.itemIconWrapActive]}>
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={isActive ? '#059669' : '#6B7280'}
                />
              </View>
              <Text style={[styles.itemText, isActive && styles.itemTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Price range</Text>
      <View style={styles.priceCard}>
        <View style={styles.priceRow}>
          <View style={styles.priceInputWrap}>
            <Text style={styles.priceLabel}>Minimum</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.pricePrefix}>RM</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0"
                keyboardType="numeric"
                value={minInput}
                onChangeText={setMinInput}
              />
            </View>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceInputWrap}>
            <Text style={styles.priceLabel}>Maximum</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.pricePrefix}>RM</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="1000"
                keyboardType="numeric"
                value={maxInput}
                onChangeText={setMaxInput}
              />
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.applyButton} onPress={applyFilter}>
        <Text style={styles.applyButtonText}>Apply Filter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },
  priceInputWrap: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 8,
    fontWeight: '600',
  },
  priceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  priceDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 6,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  pricePrefix: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    marginRight: 6,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 12,
    color: '#1F2937',
    fontSize: 14,
  },
  item: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemActive: {
    borderColor: '#1ECE90',
    backgroundColor: '#ECFDF5',
  },
  itemIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemIconWrapActive: {
    backgroundColor: '#D1FAE5',
  },
  itemText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
    flexShrink: 1,
  },
  itemTextActive: {
    color: '#059669',
  },
  applyButton: {
    marginTop: 'auto',
    backgroundColor: '#1ECE90',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});

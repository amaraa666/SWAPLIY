import { useFilter } from '@/contexts/filter-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const categories = [
  { label: 'All', value: null },
  { label: 'Electronics', value: 'electronics' },
  { label: 'Clothing', value: 'clothing' },
  { label: 'Books', value: 'books' },
  { label: 'Home & Garden', value: 'home' },
  { label: 'Sports', value: 'sports' },
  { label: 'Toys', value: 'toys' },
  { label: 'Other', value: 'other' },
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
              <Text style={[styles.itemText, isActive && styles.itemTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Price range</Text>
      <View style={styles.priceRow}>
        <View style={styles.priceInputWrap}>
          <Text style={styles.priceLabel}>Min</Text>
          <TextInput
            style={styles.priceInput}
            placeholder="0"
            keyboardType="numeric"
            value={minInput}
            onChangeText={setMinInput}
          />
        </View>
        <View style={styles.priceInputWrap}>
          <Text style={styles.priceLabel}>Max</Text>
          <TextInput
            style={styles.priceInput}
            placeholder="1000"
            keyboardType="numeric"
            value={maxInput}
            onChangeText={setMaxInput}
          />
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
    gap: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priceInputWrap: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '600',
  },
  priceInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#1F2937',
    fontSize: 14,
  },
  item: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemActive: {
    borderColor: '#1ECE90',
    backgroundColor: '#ECFDF5',
  },
  itemText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
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

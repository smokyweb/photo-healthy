import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  TextInput, Alert, useWindowDimensions, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getProducts } from '../services/api';
import GradientButton from '../components/GradientButton';
import LoadingSpinner from '../components/LoadingSpinner';
import AppFooter from '../components/AppFooter';
import { C, borderRadius } from '../theme';

const fullUrl = (u?: string) =>
  u ? (u.startsWith('http') ? u : 'https://photoai.betaplanets.com' + u) : null;

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

export default function ShopScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { addItem, itemCount } = useCart();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1024;
  const isTablet = width >= 640;

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [categoryOpen, setCategoryOpen] = useState(false);

  const load = async () => {
    try {
      const data = await getProducts();
      setProducts(data?.products || data || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const categories = [
    'All Categories',
    ...Array.from(new Set<string>(products.map((p: any) => p.category).filter(Boolean))),
  ];

  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === 'All Categories' || p.category === selectedCategory;
    const matchSearch = !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const featuredProducts = filteredProducts.filter((p: any) => p.is_featured || p.featured);
  const allProducts = filteredProducts;

  const handleAddToCart = (product: any) => {
    if (product.is_pro_only && user?.subscription_status !== 'active') {
      Alert.alert(
        'Pro Members Only',
        'This item is available for Pro members. Upgrade to access exclusive products.',
        [
          { text: 'Maybe Later' },
          { text: 'Go Pro', onPress: () => navigation.navigate('Subscription' as never) },
        ]
      );
      return;
    }
    addItem({
      id: product.id,
      name: product.title || product.name,
      price: product.price,
      image: fullUrl(product.image_url) || product.image_url,
    });
    Alert.alert('Added!', `${product.title} added to cart.`);
  };

  const numFeaturedCols = isDesktop ? 4 : isTablet ? 2 : 1;
  const numAllCols = isDesktop ? 3 : isTablet ? 2 : 1;

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          tintColor={C.ORANGE}
        />
      }
    >
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.pageTitle}>Shop</Text>
            <Text style={styles.pageSubtitle}>Photography gear & Photo Healthy merchandise</Text>
          </View>
          {itemCount > 0 && (
            <TouchableOpacity
              style={styles.cartBtn}
              onPress={() => navigation.navigate('Cart' as never)}
            >
              <Text style={styles.cartBtnText}>🛒 Cart ({itemCount})</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Controls Bar */}
      <View style={[styles.controls, isDesktop && styles.controlsDesktop]}>
        <View style={styles.controlsLeft}>
          {/* Category Dropdown */}
          <View>
            <TouchableOpacity
              style={styles.dropdownBtn}
              onPress={() => setCategoryOpen(o => !o)}
            >
              <Text style={styles.dropdownText}>{selectedCategory} ▼</Text>
            </TouchableOpacity>
            {categoryOpen && (
              <View style={styles.dropdownMenu}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={styles.dropdownItem}
                    onPress={() => { setSelectedCategory(cat); setCategoryOpen(false); }}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      selectedCategory === cat && styles.dropdownItemActive,
                    ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          {/* Price Filter */}
          <TouchableOpacity style={styles.dropdownBtn}>
            <Text style={styles.dropdownText}>Filter by Price ▼</Text>
          </TouchableOpacity>
        </View>
        {/* Search */}
        <View style={[styles.searchWrapper, isDesktop && styles.searchWrapperDesktop]}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={C.TEXT_MUTED}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Featured</Text>
          {chunkArray(featuredProducts, numFeaturedCols).map((row, rowIdx) => (
            <View key={rowIdx} style={styles.productRow}>
              {row.map((item: any) => {
                const imgUri = fullUrl(item.image_url);
                const isPro = item.is_pro_only && !user?.subscription_status === 'active';
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.card, { flex: 1 }]}
                    onPress={() => navigation.navigate('ProductDetail' as never, { productId: item.id } as never)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.imgWrap}>
                      {imgUri ? (
                        <Image source={{ uri: imgUri }} style={styles.productImg} resizeMode="cover" />
                      ) : (
                        <View style={[styles.productImg, styles.imgPlaceholder]}>
                          <Text style={{ fontSize: 36 }}>🛒️</Text>
                        </View>
                      )}
                      <View style={styles.featuredBadge}>
                        <Text style={styles.featuredBadgeText}>Featured</Text>
                      </View>
                      {item.is_pro_only && (
                        <View style={styles.proBadge}>
                          <Text style={styles.proBadgeText}>⭐ Pro Only</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.productName} numberOfLines={2}>{item.title}</Text>
                      <Text style={styles.price}>${Number(item.price).toFixed(2)}</Text>
                      <GradientButton
                        label={isPro ? '⭐ Pro Only' : 'Add to Cart'}
                        onPress={() => handleAddToCart(item)}
                        disabled={isPro}
                        style={styles.addBtn}
                        size="sm"
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
              {/* Fill empty cells in last row */}
              {Array(numFeaturedCols - row.length).fill(0).map((_, i) => (
                <View key={`ef-${i}`} style={{ flex: 1 }} />
              ))}
            </View>
          ))}
        </View>
      )}

      {/* All Products */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>All Products</Text>
        {allProducts.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No products available yet</Text>
          </View>
        ) : (
          chunkArray(allProducts, numAllCols).map((row: any[], rowIdx) => (
            <View key={rowIdx} style={styles.productRow}>
              {row.map((item: any) => {
                const imgUri = fullUrl(item.image_url);
                const isPro = item.is_pro_only && !user?.subscription_status === 'active';
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.card, { flex: 1 }]}
                    onPress={() => navigation.navigate('ProductDetail' as never, { productId: item.id } as never)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.imgWrap}>
                      {imgUri ? (
                        <Image source={{ uri: imgUri }} style={styles.productImg} resizeMode="cover" />
                      ) : (
                        <View style={[styles.productImg, styles.imgPlaceholder]}>
                          <Text style={{ fontSize: 32 }}>🛒️</Text>
                        </View>
                      )}
                      {item.is_pro_only && (
                        <View style={styles.proBadge}>
                          <Text style={styles.proBadgeText}>⭐ Pro Only</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.productName} numberOfLines={2}>{item.title}</Text>
                      <Text style={styles.price}>${Number(item.price).toFixed(2)}</Text>
                      <GradientButton
                        label={isPro ? '⭐ Pro Only' : 'Add to Cart'}
                        onPress={() => handleAddToCart(item)}
                        disabled={isPro}
                        variant="outline"
                        style={styles.addBtn}
                        size="sm"
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
              {Array(numAllCols - row.length).fill(0).map((_, i) => (
                <View key={`ea-${i}`} style={{ flex: 1 }} />
              ))}
            </View>
          ))
        )}
      </View>

      <AppFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: C.BG },
  content: { paddingBottom: 0 },

  pageHeader: { paddingHorizontal: 24, paddingTop: 36, paddingBottom: 20 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 12,
  },
  headerLeft: {},
  pageTitle: { color: C.TEXT, fontSize: 36, fontWeight: '900', marginBottom: 4 },
  pageSubtitle: { color: C.TEXT_SECONDARY, fontSize: 15 },
  cartBtn: {
    backgroundColor: C.ORANGE,
    borderRadius: borderRadius.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  cartBtnText: { color: C.WHITE, fontWeight: '700', fontSize: 14 },

  controls: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 12,
  },
  controlsDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlsLeft: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  dropdownBtn: {
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  dropdownText: { color: C.TEXT_SECONDARY, fontSize: 14 },
  dropdownMenu: {
    position: 'absolute',
    top: 44,
    left: 0,
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    zIndex: 100,
    minWidth: 180,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 10 },
  dropdownItemText: { color: C.TEXT_SECONDARY, fontSize: 14 },
  dropdownItemActive: { color: C.ORANGE, fontWeight: '700' },
  searchWrapper: {},
  searchWrapperDesktop: { flex: 1, maxWidth: 320 },
  searchInput: {
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    color: C.TEXT,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  section: { paddingHorizontal: 24, paddingBottom: 32 },
  sectionLabel: {
    color: C.TEXT,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  productRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  card: {
    backgroundColor: C.CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    overflow: 'hidden',
  },
  imgWrap: { position: 'relative' },
  productImg: { width: '100%', aspectRatio: 1 },
  imgPlaceholder: {
    backgroundColor: '#2E3145',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: C.ORANGE,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  featuredBadgeText: { color: C.WHITE, fontSize: 10, fontWeight: '800' },
  proBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#7C3AED',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  proBadgeText: { color: C.WHITE, fontSize: 10, fontWeight: '700' },
  cardInfo: { padding: 12 },
  productName: {
    color: C.TEXT,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 18,
  },
  price: { color: C.ORANGE, fontSize: 17, fontWeight: '800', marginBottom: 8 },
  addBtn: { height: 36 },

  empty: { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  emptyText: { color: C.TEXT_MUTED, fontSize: 16 },
});

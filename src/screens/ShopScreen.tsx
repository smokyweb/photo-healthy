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
import { C, borderRadius, brandGradients, fontFamilies } from '../theme';
import { fullUrl as resolveUrl } from '../config/api';

const fullUrl = (u?: string) => resolveUrl(u) || null;

const isEnabledFlag = (value: any) => {
  if (value === true || value === 1) return true;
  const normalized = String(value ?? '').trim().toLowerCase();
  return ['1', 'true', 'yes', 'y', 'pro', 'pro_only', 'pro-only'].includes(normalized);
};

const isProOnlyProduct = (product: any) =>
  isEnabledFlag(product?.is_pro_only) || isEnabledFlag(product?.pro_only) || isEnabledFlag(product?.requires_pro);

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
  const currentReturnTo = () => (
    typeof window !== 'undefined'
      ? `${window.location.pathname}${window.location.search}`
      : '/shop'
  );
  const goToSubscription = () => {
    const parent = navigation.getParent?.();
    const params = { returnTo: currentReturnTo() } as never;
    if (parent) parent.navigate('Subscription' as never, params);
    else navigation.navigate('Subscription' as never, params);
  };

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartAdded, setCartAdded] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [priceFilter, setPriceFilter] = useState('All Prices');
  const [priceOpen, setPriceOpen] = useState(false);

  const load = async () => {
    try {
      const data = await getProducts();
      const allProds = data?.products || data || [];
      setProducts(allProds.filter((p: any) => p.is_active === 1 || p.is_active === true || p.is_active === undefined));
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const categories = [
    'All Categories',
    ...Array.from(new Set<string>(products.map((p: any) => p.category).filter(Boolean))),
  ];
  const priceFilters = ['All Prices', 'Under $25', '$25 - $50', '$50 - $100', '$100+'];

  const matchesPrice = (price: number) => {
    if (priceFilter === 'Under $25') return price < 25;
    if (priceFilter === '$25 - $50') return price >= 25 && price <= 50;
    if (priceFilter === '$50 - $100') return price > 50 && price <= 100;
    if (priceFilter === '$100+') return price > 100;
    return true;
  };

  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === 'All Categories' || p.category === selectedCategory;
    const productName = p.title || p.name || '';
    const matchSearch = !searchQuery || productName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPrice = matchesPrice(Number(p.price || 0));
    return matchCat && matchSearch && matchPrice;
  });

  const featuredProducts = filteredProducts.filter((p: any) => p.is_featured || p.featured);
  const allProducts = filteredProducts;

  const isPro = user?.subscription_status === 'active' || user?.role === 'pro' || !!user?.is_pro;
  const handleAddToCart = (product: any) => {
    if (isProOnlyProduct(product) && !isPro) {
      Alert.alert(
        'Pro Members Only',
        'This item is available for Pro members. Upgrade to access exclusive products.',
        [
          { text: 'Maybe Later' },
          { text: 'Go Pro', onPress: goToSubscription },
        ]
      );
      return;
    }
    addItem({
      id: product.id,
      name: product.title || product.name,
      price: Number(product.price),
      image: fullUrl(product.image_url) || undefined,
      size: null,
    });
    // Visual feedback - highlight the button briefly
    setCartAdded(product.id);
    setToastMsg((product.title || product.name || 'Item').slice(0, 28));
    setTimeout(() => { setCartAdded(null); setToastMsg(null); }, 2500);
  };

  const numFeaturedCols = isDesktop ? 3 : isTablet ? 2 : 1;
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
      {toastMsg !== null && (
        <View style={{ position: 'fixed' as any, top: 80, left: 0, right: 0, alignItems: 'center', zIndex: 9999, pointerEvents: 'none' as any }}>
          <View style={{ backgroundColor: C.TEAL, borderRadius: 28, paddingVertical: 13, paddingHorizontal: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 12 }}>
            <Text style={{ color: C.BG, fontFamily: fontFamilies.heading, fontWeight: '800', fontSize: 15 }}>✓ Added: {toastMsg}</Text>
          </View>
        </View>
      )}
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.pageTitle}>Shop</Text>
            <Text style={styles.pageSubtitle}>Photography gear & Photo Healthy merchandise</Text>
          </View>
          <TouchableOpacity
            style={styles.cartBtn}
            onPress={() => navigation.navigate('Cart' as never)}
          >
            <Text style={styles.cartBtnText}>Cart ({itemCount})</Text>
          </TouchableOpacity>
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
          <View>
            <TouchableOpacity
              style={styles.dropdownBtn}
              onPress={() => setPriceOpen(o => !o)}
            >
              <Text style={styles.dropdownText}>{priceFilter} ▼</Text>
            </TouchableOpacity>
            {priceOpen && (
              <View style={styles.dropdownMenu}>
                {priceFilters.map(filter => (
                  <TouchableOpacity
                    key={filter}
                    style={styles.dropdownItem}
                    onPress={() => { setPriceFilter(filter); setPriceOpen(false); }}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      priceFilter === filter && styles.dropdownItemActive,
                    ]}>
                      {filter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
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
                const isProOnly = isProOnlyProduct(item);
                const requiresProUpgrade = isProOnly && !isPro;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.card, { flex: 1 }]}
                    onPress={() => navigation.navigate('ProductDetail' as never, { productId: item.id, id: item.id } as never)}
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
                      {isProOnly && (
                        <View style={styles.proBadge}>
                          <Text style={styles.proBadgeText}>Pro Only</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.productName} numberOfLines={2}>{item.title}</Text>
                      <Text style={styles.price}>${Number(item.price).toFixed(2)}</Text>
                      <GradientButton
                        label={requiresProUpgrade ? 'Pro Only' : cartAdded === item.id ? 'Added!' : 'Add to Cart'}
                        onPress={() => handleAddToCart(item)}
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
                const isProOnly = isProOnlyProduct(item);
                const requiresProUpgrade = isProOnly && !isPro;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.card, { flex: 1 }]}
                    onPress={() => navigation.navigate('ProductDetail' as never, { productId: item.id, id: item.id } as never)}
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
                      {isProOnly && (
                        <View style={styles.proBadge}>
                          <Text style={styles.proBadgeText}>Pro Only</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.productName} numberOfLines={2}>{item.title}</Text>
                      <Text style={styles.price}>${Number(item.price).toFixed(2)}</Text>
                      <GradientButton
                        label={requiresProUpgrade ? 'Pro Only' : cartAdded === item.id ? 'Added!' : 'Add to Cart'}
                        onPress={() => handleAddToCart(item)}
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
  screen: { backgroundColor: 'transparent' },
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
  pageTitle: { color: C.TEXT, fontSize: 36, fontWeight: '900', marginBottom: 4, fontFamily: fontFamilies.heading },
  pageSubtitle: { color: C.TEXT_SECONDARY, fontSize: 15, fontFamily: fontFamilies.body },
  cartBtnActive: {
    borderColor: C.ORANGE,
  },
  cartBtn: {
    backgroundColor: C.ORANGE,
    backgroundImage: brandGradients.primaryCss,
    borderRadius: borderRadius.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
  } as any,
  cartBtnText: { color: C.WHITE, fontWeight: '800', fontSize: 14, fontFamily: fontFamilies.heading },

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
  dropdownText: { color: C.TEXT_SECONDARY, fontSize: 14, fontFamily: fontFamilies.body },
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
  dropdownItemText: { color: C.TEXT_SECONDARY, fontSize: 14, fontFamily: fontFamilies.body },
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
    backgroundImage: brandGradients.primaryCss,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  } as any,
  featuredBadgeText: { color: C.WHITE, fontSize: 10, fontWeight: '800', fontFamily: fontFamilies.heading },
  proBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: C.TEAL,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  proBadgeText: { color: C.BG, fontSize: 10, fontWeight: '800', fontFamily: fontFamilies.heading },
  cardInfo: { padding: 12 },
  productName: {
    color: C.TEXT,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 18,
    fontFamily: fontFamilies.heading,
  },
  price: { color: C.ORANGE, fontSize: 17, fontWeight: '800', marginBottom: 8, fontFamily: fontFamilies.heading },
  addBtn: { height: 36 },

  empty: { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  emptyText: { color: C.TEXT_MUTED, fontSize: 16 },
});

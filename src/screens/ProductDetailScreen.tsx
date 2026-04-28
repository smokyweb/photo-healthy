import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, useWindowDimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getProducts } from '../services/api';
import GradientButton from '../components/GradientButton';
import LoadingSpinner from '../components/LoadingSpinner';
import AppFooter from '../components/AppFooter';
import { C, borderRadius } from '../theme';

const BASE = 'https://photoai.betaplanets.com';
const fullUrl = (u) => u ? (u.startsWith('http') ? u : BASE + u) : null;

export default function ProductDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { productId, id } = route.params || {};
  const resolvedId = productId || id;
  const { user } = useAuth();
  const { addItem, itemCount } = useCart();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    getProducts()
      .then((data) => {
        const list = data?.products || data || [];
        setProduct(list.find((p) => p.id === resolvedId || p.id === Number(resolvedId)) || null);
      })
      .finally(() => setLoading(false));
  }, [resolvedId]);

  const isPro = user?.subscription_status === 'active' || user?.role === 'pro';

  const handleAddToCart = () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to add items to your cart.', [
        { text: 'Cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    if (product.is_pro_only && !isPro) {
      Alert.alert('Pro Members Only', 'Upgrade to Pro to purchase this item.', [
        { text: 'Cancel' },
        { text: 'Go Pro', onPress: () => navigation.navigate('Subscription') },
      ]);
      return;
    }
    const name = product.title || product.name || 'Product';
    for (let i = 0; i < qty; i++) {
      addItem({ id: product.id, name, price: Number(product.price), image: fullUrl(product.image_url) || undefined });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  if (loading) return <LoadingSpinner fullScreen />;

  if (!product) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ color: C.TEXT_MUTED, fontSize: 16 }}>Product not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: C.ORANGE }}>← Back to Shop</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const name = product.title || product.name || 'Product';
  const imgUrl = fullUrl(product.image_url);
  const price = Number(product.price || 0);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ flexGrow: 1 }}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← Back to Shop</Text>
      </TouchableOpacity>

      <View style={[styles.productLayout, isDesktop && styles.productLayoutDesktop]}>
        {/* Image */}
        <View style={[styles.imageWrap, isDesktop && styles.imageWrapDesktop]}>
          {imgUrl ? (
            <Image source={{ uri: imgUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={{ fontSize: 72 }}>{product.emoji || '🛒'}</Text>
              <Text style={styles.placeholderLabel}>{name}</Text>
            </View>
          )}
          {!!product.featured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>⭐ Featured</Text>
            </View>
          )}
          {!!product.is_pro_only && (
            <View style={styles.proBadgeImg}>
              <Text style={styles.proBadgeImgText}>⭐ Pro Only</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={[styles.infoPanel, isDesktop && styles.infoPanelDesktop]}>
          {!!product.category && <Text style={styles.category}>{product.category}</Text>}
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.price}>${price.toFixed(2)}</Text>

          {!!product.is_pro_only && !isPro && (
            <View style={styles.proAlert}>
              <Text style={styles.proAlertText}>🔒 Pro members only</Text>
            </View>
          )}

          {product.description ? (
            <Text style={styles.description}>{product.description}</Text>
          ) : (
            <Text style={styles.description}>
              Premium Photo Healthy merchandise. Show your wellness journey with quality gear.
            </Text>
          )}

          <View style={styles.divider} />

          {/* Quantity selector */}
          <Text style={styles.qtyLabel}>Quantity</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQty(q => Math.max(1, q - 1))}
              activeOpacity={0.7}
            >
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyNum}>{qty}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQty(q => q + 1)}
              activeOpacity={0.7}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
            <Text style={styles.qtyTotal}>= ${(price * qty).toFixed(2)}</Text>
          </View>

          <GradientButton
            label={added ? '✓ Added to Cart!' : 'Add to Cart'}
            variant={added ? 'teal' : 'primary'}
            onPress={handleAddToCart}
            disabled={!!product.is_pro_only && !isPro}
            style={{ marginTop: 16 }}
          />

          {itemCount > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.cartHint}>
              <Text style={styles.cartHintText}>
                🛒 {itemCount} item{itemCount !== 1 ? 's' : ''} in cart — View Cart →
              </Text>
            </TouchableOpacity>
          )}

          {!!product.is_pro_only && !isPro && (
            <GradientButton
              label="Upgrade to Pro"
              variant="outline"
              onPress={() => navigation.navigate('Subscription')}
              style={{ marginTop: 10 }}
            />
          )}
        </View>
      </View>

      <AppFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: C.BG },
  back: { padding: 16, paddingBottom: 8 },
  backText: { color: C.ORANGE, fontSize: 14, fontWeight: '600' },
  productLayout: { padding: 16 },
  productLayoutDesktop: {
    flexDirection: 'row', gap: 40, maxWidth: 1100,
    alignSelf: 'center', width: '100%', paddingHorizontal: 32, paddingTop: 8,
  },
  imageWrap: {
    position: 'relative', borderRadius: borderRadius.xl,
    overflow: 'hidden', backgroundColor: C.CARD_BG, aspectRatio: 1, marginBottom: 20,
  },
  imageWrapDesktop: { flex: 1, marginBottom: 0, maxWidth: 480 },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    width: '100%', height: '100%', minHeight: 280,
    backgroundColor: C.CARD_BG2, alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  placeholderLabel: { color: C.TEXT_MUTED, fontSize: 14, textAlign: 'center', paddingHorizontal: 16 },
  featuredBadge: {
    position: 'absolute', top: 12, left: 12, backgroundColor: C.ORANGE,
    borderRadius: borderRadius.pill, paddingHorizontal: 10, paddingVertical: 4,
    backgroundImage: 'linear-gradient(90deg,#F55B09,#FFD000)',
  },
  featuredBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  proBadgeImg: {
    position: 'absolute', top: 12, right: 12, backgroundColor: '#7c3aed',
    borderRadius: borderRadius.pill, paddingHorizontal: 10, paddingVertical: 4,
  },
  proBadgeImgText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  infoPanel: { flex: 1 },
  infoPanelDesktop: { flex: 1, paddingTop: 8 },
  category: { color: C.ORANGE, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  name: { color: C.TEXT, fontSize: 26, fontWeight: '800', fontFamily: "'Lexend', sans-serif", marginBottom: 10, lineHeight: 32 },
  price: { color: C.ORANGE, fontSize: 30, fontWeight: '800', marginBottom: 14 },
  proAlert: {
    backgroundColor: '#7c3aed22', borderWidth: 1, borderColor: '#7c3aed',
    borderRadius: borderRadius.lg, padding: 10, marginBottom: 12,
  },
  proAlertText: { color: '#a78bfa', fontSize: 13, fontWeight: '600' },
  description: { color: C.TEXT_SECONDARY, fontSize: 15, lineHeight: 24, marginBottom: 16 },
  divider: { height: 1, backgroundColor: C.CARD_BORDER, marginVertical: 16 },
  qtyLabel: { color: C.TEXT_MUTED, fontSize: 13, fontWeight: '600', marginBottom: 10 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  qtyBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.CARD_BG, borderWidth: 1, borderColor: C.CARD_BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnText: { color: C.TEXT, fontSize: 20, fontWeight: '700', lineHeight: 24 },
  qtyNum: { color: C.TEXT, fontSize: 20, fontWeight: '800', minWidth: 32, textAlign: 'center' },
  qtyTotal: { color: C.TEXT_MUTED, fontSize: 14, marginLeft: 4 },
  cartHint: { marginTop: 12, alignItems: 'center' },
  cartHintText: { color: C.TEAL, fontSize: 13, fontWeight: '600' },
});

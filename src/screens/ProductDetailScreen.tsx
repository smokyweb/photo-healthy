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
const fullUrl = (u?: string) => u ? (u.startsWith('http') ? u : BASE + u) : null;

export default function ProductDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { productId, id } = route.params || {}; const resolvedId = productId || id;
  const { user } = useAuth();
  const { addItem, itemCount } = useCart();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    getProducts()
      .then((data: any) => {
        const list = data?.products || data || [];
        setProduct(list.find((p: any) => p.id === resolvedId || p.id === Number(resolvedId)) || null);
      })
      .finally(() => setLoading(false));
  }, [productId]);

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
    addItem({
      id: product.id,
      name,
      price: Number(product.price),
      image: fullUrl(product.image_url) || undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return <LoadingSpinner fullScreen />;

  if (!product) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ color: C.TEXT_MUTED, fontSize: 16 }}>Product not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: C.ORANGE }}>â† Back to Shop</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const name = product.title || product.name || 'Product';
  const imgUrl = fullUrl(product.image_url);
  const price = Number(product.price || 0);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ flexGrow: 1 }}>
      {/* Back button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>â† Back to Shop</Text>
      </TouchableOpacity>

      <View style={[styles.productLayout, isDesktop && styles.productLayoutDesktop]}>
        {/* Product Image */}
        <View style={[styles.imageWrap, isDesktop && styles.imageWrapDesktop]}>
          {imgUrl ? (
            <Image source={{ uri: imgUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={{ fontSize: 72 }}>{product.emoji || '\uD83D\uDED2'}</Text>
              <Text style={styles.placeholderLabel}>{name}</Text>
            </View>
          )}
          {product.featured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>\u2B50 Featured</Text>
            </View>
          )}
          {!!product.is_pro_only && (
            <View style={styles.proBadgeImg}>
              <Text style={styles.proBadgeImgText}>\u2B50 Pro Only</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={[styles.infoPanel, isDesktop && styles.infoPanelDesktop]}>
          {/* Category */}
          {product.category && (
            <Text style={styles.category}>{product.category}</Text>
          )}

          {/* Name */}
          <Text style={styles.name}>{name}</Text>

          {/* Price */}
          <Text style={styles.price}>${price.toFixed(2)}</Text>

          {/* Pro badge */}
          {!!product.is_pro_only && !isPro && (
            <View style={styles.proAlert}>
              <Text style={styles.proAlertText}>\uD83D\uDD12 This item is exclusive to Pro members</Text>
            </View>
          )}

          {/* Description */}
          {product.description ? (
            <Text style={styles.description}>{product.description}</Text>
          ) : (
            <Text style={styles.description}>
              Premium Photo Healthy merchandise. Show your wellness journey with quality gear.
            </Text>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Cart info */}
          <View style={styles.cartRow}>
            <Text style={styles.cartLabel}>Quantity</Text>
            <Text style={styles.cartQty}>1</Text>
          </View>

          {/* Add to Cart button */}
          <GradientButton
            label={added ? '\u2713 Added to Cart!' : 'Add to Cart'}
            variant={added ? 'teal' : 'primary'}
            onPress={handleAddToCart}
            disabled={!!product.is_pro_only && !isPro}
            style={{ marginTop: 12 } as any}
          />

          {/* Cart count hint */}
          {itemCount > 0 && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Cart')}
              style={styles.cartHint}
            >
              <Text style={styles.cartHintText}>\uD83D\uDED2 {itemCount} item{itemCount !== 1 ? 's' : ''} in cart â€” View Cart â†’</Text>
            </TouchableOpacity>
          )}

          {/* Pro upsell */}
          {!!product.is_pro_only && !isPro && (
            <GradientButton
              label="Upgrade to Pro"
              variant="outline"
              onPress={() => navigation.navigate('Subscription')}
              style={{ marginTop: 8 } as any}
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
    flexDirection: 'row',
    gap: 40,
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 32,
    paddingTop: 8,
  },

  imageWrap: {
    position: 'relative',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: C.CARD_BG,
    aspectRatio: 1,
    marginBottom: 20,
  },
  imageWrapDesktop: {
    flex: 1,
    marginBottom: 0,
    maxWidth: 480,
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    minHeight: 280,
    backgroundColor: C.CARD_BG2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  placeholderLabel: { color: C.TEXT_MUTED, fontSize: 14, textAlign: 'center', paddingHorizontal: 16 },
  featuredBadge: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: C.ORANGE, borderRadius: borderRadius.pill,
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundImage: 'linear-gradient(90deg,#F55B09,#FFD000)' as any,
  },
  featuredBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  proBadgeImg: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: '#7c3aed', borderRadius: borderRadius.pill,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  proBadgeImgText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  infoPanel: { flex: 1 },
  infoPanelDesktop: { flex: 1, paddingTop: 8 },

  category: { color: C.ORANGE, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' as any, letterSpacing: 1, marginBottom: 8 },
  name: { color: C.TEXT, fontSize: 28, fontWeight: '800', fontFamily: "'Lexend', sans-serif", marginBottom: 10, lineHeight: 34 },
  price: { color: C.ORANGE, fontSize: 32, fontWeight: '800', marginBottom: 16 },

  proAlert: {
    backgroundColor: '#7c3aed22', borderWidth: 1, borderColor: '#7c3aed',
    borderRadius: borderRadius.lg, padding: 10, marginBottom: 12,
  },
  proAlertText: { color: '#a78bfa', fontSize: 13, fontWeight: '600' },

  description: { color: C.TEXT_SECONDARY, fontSize: 15, lineHeight: 24, marginBottom: 16 },
  divider: { height: 1, backgroundColor: C.CARD_BORDER, marginVertical: 16 },

  cartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cartLabel: { color: C.TEXT_MUTED, fontSize: 14 },
  cartQty: { color: C.TEXT, fontSize: 16, fontWeight: '700', backgroundColor: C.CARD_BG, paddingHorizontal: 16, paddingVertical: 6, borderRadius: borderRadius.md },

  cartHint: { marginTop: 10, alignItems: 'center' },
  cartHintText: { color: C.TEAL, fontSize: 13, fontWeight: '600' },
});

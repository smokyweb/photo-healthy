import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getProducts } from '../services/api';
import GradientButton from '../components/GradientButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { C, borderRadius } from '../theme';
import AppFooter from '../components/AppFooter';

export default function ProductDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { productId } = route.params || {};
  const { user } = useAuth();
  const { addItem } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts()
      .then(data => {
        const list = data?.products || data || [];
        setProduct(list.find((p: any) => p.id === productId) || null);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  const handleAddToCart = () => {
    if (product.is_pro_only && !user?.is_pro) {
      Alert.alert('Pro Only', 'Upgrade to Pro to purchase this item.', [
        { text: 'Cancel' },
        { text: 'Go Pro', onPress: () => navigation.navigate('Subscription') },
      ]);
      return;
    }
    addItem({ id: product.id, name: product.name, price: product.price, image: product.image_url });
    Alert.alert('Added to Cart!', `${product.name} is in your cart.`);
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!product) return (
    <View style={styles.center}><Text style={{ color: C.TEXT_MUTED }}>Product not found</Text></View>
  );

  return (
    <ScrollView style={styles.screen}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.imagePlaceholder}><Text style={{ fontSize: 80 }}>🛍️</Text></View>
      )}

      <View style={styles.content}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>${Number(product.price).toFixed(2)}</Text>

        {product.is_pro_only && (
          <View style={styles.proBadge}>
            <Text style={styles.proText}>⭐ Pro Members Only</Text>
          </View>
        )}

        {product.description && (
          <Text style={styles.description}>{product.description}</Text>
        )}

        <GradientButton
          label="Add to Cart"
          onPress={handleAddToCart}
          style={{ marginTop: 24 }}
        />
      </View>
          <AppFooter />
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.BG },
  center: { flex: 1, backgroundColor: C.BG, alignItems: 'center', justifyContent: 'center' },
  back: { padding: 16 },
  backText: { color: C.ORANGE, fontSize: 15 },
  image: { width: '100%', height: 300 },
  imagePlaceholder: {
    width: '100%',
    height: 250,
    backgroundColor: C.CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 20 },
  name: { color: C.TEXT, fontSize: 24, fontWeight: '800', marginBottom: 8 },
  price: { color: C.ORANGE, fontSize: 28, fontWeight: '800', marginBottom: 12 },
  proBadge: {
    backgroundColor: C.ORANGE_MID + '33',
    borderRadius: borderRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.ORANGE_MID,
  },
  proText: { color: C.ORANGE_MID, fontSize: 13, fontWeight: '700' },
  description: { color: C.TEXT_SECONDARY, fontSize: 15, lineHeight: 22 },
});

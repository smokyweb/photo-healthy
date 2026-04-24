import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getProducts } from '../services/api';
import GradientButton from '../components/GradientButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { C, borderRadius } from '../theme';

export default function ShopScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { addItem, itemCount } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await getProducts();
      setProducts(data?.products || data || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const handleAddToCart = (product: any) => {
    if (product.is_pro_only && !user?.is_pro) {
      Alert.alert(
        'Pro Members Only',
        'This item is available for Pro members. Upgrade to access exclusive products.',
        [
          { text: 'Maybe Later' },
          { text: 'Go Pro', onPress: () => navigation.navigate('Subscription') },
        ]
      );
      return;
    }
    addItem({ id: product.id, name: product.name, price: product.price, image: product.image_url });
    Alert.alert('Added!', `${product.name} added to cart.`);
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.screen}>
      {/* Cart Button */}
      {itemCount > 0 && (
        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => navigation.navigate('Cart')}
        >
          <Text style={styles.cartBtnText}>🛒 Cart ({itemCount})</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={products}
        keyExtractor={i => String(i.id)}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.ORANGE} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Shop</Text>
            <Text style={styles.subtitle}>Gear up for your healthy journey</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
          >
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.img} />
            ) : (
              <View style={[styles.img, styles.imgPlaceholder]}>
                <Text style={{ fontSize: 36 }}>🛍️</Text>
              </View>
            )}
            {item.is_pro_only && (
              <View style={styles.proBadge}>
                <Text style={styles.proText}>PRO</Text>
              </View>
            )}
            <View style={styles.cardInfo}>
              <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.price}>${Number(item.price).toFixed(2)}</Text>
              <GradientButton
                label="Add to Cart"
                onPress={() => handleAddToCart(item)}
                style={styles.addBtn}
              />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No products available yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.BG },
  cartBtn: {
    margin: 12,
    backgroundColor: C.ORANGE,
    borderRadius: borderRadius.lg,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cartBtnText: { color: C.WHITE, fontWeight: '700', fontSize: 15 },
  header: { padding: 16, paddingBottom: 0 },
  title: { color: C.TEXT, fontSize: 26, fontWeight: '800', marginBottom: 4 },
  subtitle: { color: C.TEXT_SECONDARY, fontSize: 14, marginBottom: 12 },
  grid: { padding: 8 },
  row: { gap: 8 },
  card: {
    flex: 1,
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    marginBottom: 8,
    position: 'relative',
  },
  img: { width: '100%', aspectRatio: 1 },
  imgPlaceholder: { backgroundColor: C.CARD_BG2, alignItems: 'center', justifyContent: 'center' },
  proBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: C.ORANGE,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  proText: { color: C.WHITE, fontSize: 10, fontWeight: '800' },
  cardInfo: { padding: 10 },
  productName: { color: C.TEXT, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  price: { color: C.ORANGE, fontSize: 16, fontWeight: '800', marginBottom: 8 },
  addBtn: { height: 36 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: C.TEXT_MUTED, fontSize: 16 },
});

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createCheckoutSession } from '../services/api';
import GradientButton from '../components/GradientButton';
import { C, borderRadius } from '../theme';
import AppFooter from '../components/AppFooter';

export default function CartScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { items, removeItem, updateQuantity, clearCart, total } = useCart();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!user) { navigation.navigate('Login'); return; }
    setLoading(true);
    try {
      const data = await createCheckoutSession(
        items.map(i => ({ product_id: i.id, quantity: i.quantity }))
      );
      if (data.url) {
        window.location.href = data.url;
      } else {
        clearCart();
        navigation.navigate('CheckoutSuccess');
      }
    } catch (e: any) {
      Alert.alert('Checkout Failed', e.message);
    }
    setLoading(false);
  };

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <GradientButton
          label="Browse Shop"
          onPress={() => navigation.navigate('Shop')}
          style={{ marginTop: 20 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Cart ({items.length})</Text>
        <TouchableOpacity onPress={() => Alert.alert('Clear Cart', 'Remove all items?', [
          { text: 'Cancel' },
          { text: 'Clear', style: 'destructive', onPress: clearCart },
        ])}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.item}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.itemImg} />
            ) : (
              <View style={[styles.itemImg, styles.itemImgPlaceholder]}>
                <Text>🛍️</Text>
              </View>
            )}
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)} style={styles.qtyBtn}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qty}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} style={styles.qtyBtn}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmt}>${total.toFixed(2)}</Text>
        </View>
        <GradientButton label="Checkout" onPress={handleCheckout} loading={loading} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: C.BG },
  empty: {
    flex: 1, backgroundColor: C.BG,
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  emptyIcon: { fontSize: 60, marginBottom: 12 },
  emptyTitle: { color: C.TEXT, fontSize: 20, fontWeight: '700' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: C.DIVIDER,
  },
  back: { color: C.ORANGE, fontSize: 15 },
  title: { color: C.TEXT, fontSize: 18, fontWeight: '700' },
  clearText: { color: C.DANGER, fontSize: 14 },
  list: { padding: 12 },
  item: {
    flexDirection: 'row', backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.lg, overflow: 'hidden',
    marginBottom: 10, borderWidth: 1, borderColor: C.CARD_BORDER,
  },
  itemImg: { width: 90, height: 90 },
  itemImgPlaceholder: { backgroundColor: C.CARD_BG2, alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1, padding: 10 },
  itemName: { color: C.TEXT, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  itemPrice: { color: C.ORANGE, fontSize: 16, fontWeight: '800', marginBottom: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 28, height: 28, backgroundColor: C.CARD_BG2,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnText: { color: C.TEXT, fontSize: 18, fontWeight: '700', lineHeight: 22 },
  qty: { color: C.TEXT, fontSize: 15, fontWeight: '700', minWidth: 20, textAlign: 'center' },
  removeBtn: {},
  removeBtnText: { color: C.DANGER, fontSize: 13 },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: C.DIVIDER,
    backgroundColor: C.NAV_BG,
  },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  totalLabel: { color: C.TEXT_SECONDARY, fontSize: 16 },
  totalAmt: { color: C.TEXT, fontSize: 22, fontWeight: '800' },
});

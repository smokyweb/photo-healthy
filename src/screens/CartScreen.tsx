import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createCheckoutSession } from '../services/api';
import GradientButton from '../components/GradientButton';
import AppFooter from '../components/AppFooter';
import { C, borderRadius } from '../theme';

export default function CartScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { items, removeItem, updateQuantity, clearCart, total } = useCart();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!user) { navigation.navigate('Login' as never); return; }
    setLoading(true);
    try {
      const data = await createCheckoutSession(
        items.map(i => ({ product_id: i.id, quantity: i.quantity }))
      );
      if (data?.url) {
        (window as any).location.href = data.url;
      } else {
        clearCart();
        navigation.navigate('CheckoutSuccess' as never);
      }
    } catch (e: any) {
      Alert.alert('Checkout Failed', e.message || 'Something went wrong.');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ flexGrow: 1 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{'\uD83D\uDED2'} Shopping Cart ({items.length})</Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={() => Alert.alert('Clear Cart', 'Remove all items?', [
            { text: 'Cancel' },
            { text: 'Clear All', style: 'destructive', onPress: clearCart },
          ])}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>{'\uD83D\uDED2'}</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyBody}>Browse the shop to find something you love.</Text>
          <GradientButton
            label="Browse Shop"
            onPress={() => navigation.navigate('Shop' as never)}
            style={{ marginTop: 24, paddingHorizontal: 32 } as any}
          />
        </View>
      ) : (
        <>
          {/* Item list */}
          <View style={styles.itemList}>
            {items.map(item => (
              <View key={item.id} style={styles.item}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.itemImg} resizeMode="cover" />
                ) : (
                  <View style={[styles.itemImg, styles.itemImgPlaceholder]}>
                    <Text style={{ fontSize: 28 }}>{'\uD83D\uDED2'}</Text>
                  </View>
                )}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.itemUnitPrice}>${Number(item.price).toFixed(2)} each</Text>
                  <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      onPress={() => updateQuantity(item.id, item.quantity - 1)}
                      style={styles.qtyBtn}
                    >
                      <Text style={styles.qtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qty}>{item.quantity}</Text>
                    <TouchableOpacity
                      onPress={() => updateQuantity(item.id, item.quantity + 1)}
                      style={styles.qtyBtn}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.removeBtn}>
                      <Text style={styles.removeBtnText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Order summary */}
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal ({items.reduce((s,i) => s+i.quantity, 0)} items)</Text>
              <Text style={styles.summaryValue}>${total.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>Calculated at checkout</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmt}>${total.toFixed(2)}</Text>
            </View>
            <GradientButton
              label={loading ? 'Redirecting...' : 'Proceed to Checkout'}
              onPress={handleCheckout}
              loading={loading}
              style={{ marginTop: 4 } as any}
            />
            <TouchableOpacity
              onPress={() => navigation.navigate('Shop' as never)}
              style={styles.continueShopping}
            >
              <Text style={styles.continueShoppingText}>← Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <AppFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: C.BG },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.DIVIDER,
  },
  back: { color: C.ORANGE, fontSize: 14, fontWeight: '600' },
  title: { color: C.TEXT, fontSize: 17, fontWeight: '700', fontFamily: "'Lexend', sans-serif" },
  clearText: { color: '#ef4444', fontSize: 13 },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { color: C.TEXT, fontSize: 22, fontWeight: '800', marginBottom: 8, fontFamily: "'Lexend', sans-serif" },
  emptyBody: { color: C.TEXT_MUTED, fontSize: 15, textAlign: 'center' },

  itemList: { padding: 16, gap: 12 },
  item: {
    flexDirection: 'row',
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  itemImg: { width: 100, height: 100 },
  itemImgPlaceholder: { backgroundColor: C.CARD_BG2, alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1, padding: 12 },
  itemName: { color: C.TEXT, fontSize: 14, fontWeight: '700', marginBottom: 3, lineHeight: 20 },
  itemUnitPrice: { color: C.TEXT_MUTED, fontSize: 12, marginBottom: 2 },
  itemPrice: { color: C.ORANGE, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 30, height: 30,
    backgroundColor: C.CARD_BG2,
    borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.CARD_BORDER,
  },
  qtyBtnText: { color: C.TEXT, fontSize: 18, fontWeight: '700', lineHeight: 20 },
  qty: { color: C.TEXT, fontSize: 16, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  removeBtn: { marginLeft: 8 },
  removeBtnText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },

  summary: {
    margin: 16,
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  summaryTitle: { color: C.TEXT, fontSize: 16, fontWeight: '700', marginBottom: 14, fontFamily: "'Lexend', sans-serif" },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { color: C.TEXT_MUTED, fontSize: 14 },
  summaryValue: { color: C.TEXT_SECONDARY, fontSize: 14 },
  totalRow: { borderTopWidth: 1, borderTopColor: C.DIVIDER, paddingTop: 12, marginTop: 4, marginBottom: 16 },
  totalLabel: { color: C.TEXT, fontSize: 16, fontWeight: '700' },
  totalAmt: { color: C.ORANGE, fontSize: 22, fontWeight: '800' },

  continueShopping: { alignItems: 'center', marginTop: 12 },
  continueShoppingText: { color: C.TEXT_MUTED, fontSize: 13 },
});

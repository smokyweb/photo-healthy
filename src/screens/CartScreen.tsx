import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, TextInput, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createCheckoutSession } from '../services/api';
import GradientButton from '../components/GradientButton';
import AppFooter from '../components/AppFooter';
import { C, borderRadius } from '../theme';

export default function CartScreen() {
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const { items, removeItem, updateQuantity, clearCart, total, itemCount } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [giftCode, setGiftCode] = useState('');
  const [shippingAddress, setShippingAddress] = useState({
    name: user?.name || '',
    email: user?.email || '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
  });
  const isDesktop = width >= 1100;
  const isMobile = width < 1100;

  useEffect(() => {
    if (!user) return;
    setShippingAddress(s => ({
      ...s,
      name: s.name || user.name || '',
      email: s.email || user.email || '',
    }));
  }, [user?.id]);

  const handleBack = () => {
    if (navigation.canGoBack?.()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('Shop' as never);
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const data = await createCheckoutSession(
        items.map(i => ({ id: i.id, quantity: i.quantity, size: i.size || null })),
        {
          couponCode: couponCode.trim(),
          giftCode: giftCode.trim(),
          successUrl: `${(window as any).location.origin}/checkout/success?ref={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${(window as any).location.origin}/cart`,
          shippingAddress,
        },
      );
      if (data?.url) { (window as any).location.href = data.url; }
      else { clearCart(); navigation.navigate('CheckoutSuccess' as never, { freeOrder: true } as never); }
    } catch (e: any) { Alert.alert('Checkout Failed', e.message || 'Something went wrong.'); }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🛒 Cart ({itemCount})</Text>
        {items.length > 0 && <TouchableOpacity onPress={() => Alert.alert('Clear Cart', 'Remove all?', [{ text: 'Cancel' }, { text: 'Clear All', style: 'destructive', onPress: clearCart }])}><Text style={styles.clearText}>Clear</Text></TouchableOpacity>}
      </View>
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyBody}>Browse the shop to find something you love.</Text>
          <GradientButton label='Browse Shop' onPress={() => navigation.navigate('Shop' as never)} style={{ marginTop: 24 } as any} />
        </View>
      ) : (
        <>
          <View style={styles.itemList}>
            {items.map(item => (
              <View key={item.id + '-' + (item.size || '')} style={[styles.item, isMobile && styles.itemMobile]}>
                {item.image ? (<Image source={{ uri: item.image }} style={[styles.itemImg, isMobile && styles.itemImgMobile]} resizeMode='cover' />) : (<View style={[styles.itemImg, isMobile && styles.itemImgMobile, styles.itemImgPlaceholder]}><Text style={{ fontSize: 28 }}>🛒</Text></View>)}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                  {item.size && <Text style={{ color: C.TEAL, fontWeight: '700', fontSize: 13 }}>Size: {item.size}</Text>}
                  <Text style={styles.itemUnitPrice}>${Number(item.price).toFixed(2)} each</Text>
                  <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
                  <View style={styles.qtyRow}>
                    <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1, item.size)} style={styles.qtyBtn}><Text style={styles.qtyBtnText}>−</Text></TouchableOpacity>
                    <Text style={styles.qty}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1, item.size)} style={styles.qtyBtn}><Text style={styles.qtyBtnText}>+</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => removeItem(item.id, item.size)} style={styles.removeBtn}><Text style={styles.removeBtnText}>Remove</Text></TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
          <View style={[styles.checkoutGrid, isMobile && styles.checkoutGridMobile, isDesktop && styles.checkoutGridDesktop]}>
            <View style={[styles.checkoutInfo, isMobile && styles.cartPanelMobile]}>
              <Text style={styles.summaryTitle}>Checkout Details</Text>
              <Text style={styles.checkoutLine}>Shipping address and delivery options are collected during secure checkout.</Text>
              <Text style={styles.checkoutLine}>If a coupon or gift code covers the full order, use these shipping fields so the order can still be mailed.</Text>
              <View style={styles.shippingFields}>
                <Text style={styles.codeLabel}>Name</Text>
                <TextInput value={shippingAddress.name} onChangeText={v => setShippingAddress(s => ({ ...s, name: v }))} placeholder="Full name" placeholderTextColor={C.TEXT_MUTED} style={styles.codeInput} />
                <Text style={styles.codeLabel}>Email</Text>
                <TextInput value={shippingAddress.email} onChangeText={v => setShippingAddress(s => ({ ...s, email: v }))} placeholder="Email address" placeholderTextColor={C.TEXT_MUTED} keyboardType="email-address" autoCapitalize="none" style={styles.codeInput} />
                <Text style={styles.codeLabel}>Address</Text>
                <TextInput value={shippingAddress.line1} onChangeText={v => setShippingAddress(s => ({ ...s, line1: v }))} placeholder="Street address" placeholderTextColor={C.TEXT_MUTED} style={styles.codeInput} />
                <TextInput value={shippingAddress.line2} onChangeText={v => setShippingAddress(s => ({ ...s, line2: v }))} placeholder="Apartment, suite, etc." placeholderTextColor={C.TEXT_MUTED} style={styles.codeInput} />
                <View style={styles.shippingRow}>
                  <TextInput value={shippingAddress.city} onChangeText={v => setShippingAddress(s => ({ ...s, city: v }))} placeholder="City" placeholderTextColor={C.TEXT_MUTED} style={[styles.codeInput, styles.shippingRowField]} />
                  <TextInput value={shippingAddress.state} onChangeText={v => setShippingAddress(s => ({ ...s, state: v }))} placeholder="State" placeholderTextColor={C.TEXT_MUTED} autoCapitalize="characters" style={[styles.codeInput, styles.shippingRowField]} />
                </View>
                <View style={styles.shippingRow}>
                  <TextInput value={shippingAddress.postal_code} onChangeText={v => setShippingAddress(s => ({ ...s, postal_code: v }))} placeholder="ZIP" placeholderTextColor={C.TEXT_MUTED} style={[styles.codeInput, styles.shippingRowField]} />
                  <TextInput value={shippingAddress.country} onChangeText={v => setShippingAddress(s => ({ ...s, country: v.toUpperCase() }))} placeholder="Country" placeholderTextColor={C.TEXT_MUTED} autoCapitalize="characters" style={[styles.codeInput, styles.shippingRowField]} />
                </View>
              </View>
              <Text style={styles.checkoutLine}>Coupons and gift codes can be entered before checkout.</Text>
              <Text style={styles.checkoutLine}>Card details are entered on the payment screen, not saved on this cart page.</Text>
              <Text style={styles.returnNote}>Shipping and return options are determined by the customer address.</Text>
            </View>
            <View style={[styles.summary, isMobile && styles.cartPanelMobile]}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.codeGrid}>
              <View style={styles.codeField}>
                <Text style={styles.codeLabel}>Coupon code</Text>
                <TextInput
                  value={couponCode}
                  onChangeText={setCouponCode}
                  placeholder="Enter coupon"
                  placeholderTextColor={C.TEXT_MUTED}
                  autoCapitalize="characters"
                  style={styles.codeInput}
                />
              </View>
              <View style={styles.codeField}>
                <Text style={styles.codeLabel}>Gift code</Text>
                <TextInput
                  value={giftCode}
                  onChangeText={setGiftCode}
                  placeholder="Enter gift code"
                  placeholderTextColor={C.TEXT_MUTED}
                  autoCapitalize="characters"
                  style={styles.codeInput}
                />
              </View>
            </View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal ({items.reduce((s,i) => s+i.quantity, 0)} items)</Text><Text style={styles.summaryValue}>${total.toFixed(2)}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Shipping</Text><Text style={styles.summaryValue}>Calculated at checkout</Text></View>
            <View style={[styles.summaryRow, styles.totalRow]}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalAmt}>${total.toFixed(2)}</Text></View>
            <GradientButton
              label={loading ? 'Redirecting...' : 'Proceed to Checkout'}
              onPress={handleCheckout}
              loading={loading}
              disabled={loading}
              style={styles.checkoutButton as any}
              textStyle={styles.checkoutButtonText as any}
            />
            <TouchableOpacity onPress={() => navigation.navigate('Shop' as never)} style={styles.continueShopping}><Text style={styles.continueShoppingText}>← Continue Shopping</Text></TouchableOpacity>
            </View>
          </View>
        </>
      )}
      <AppFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: 'transparent' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: C.DIVIDER, gap: 10 },
  back: { color: C.ORANGE, fontSize: 14, fontWeight: '600' },
  title: { color: C.TEXT, fontSize: 17, fontWeight: '700' },
  clearText: { color: '#ef4444', fontSize: 13 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 32 },
  emptyTitle: { color: C.TEXT, fontSize: 22, fontWeight: '800', marginBottom: 8 },
  emptyBody: { color: C.TEXT_MUTED, fontSize: 15, textAlign: 'center' },
  itemList: { padding: 16, gap: 12 },
  item: { flexDirection: 'row', backgroundColor: C.CARD_BG, borderRadius: borderRadius.xl, overflow: 'hidden', borderWidth: 1, borderColor: C.CARD_BORDER, maxWidth: '100%' },
  itemMobile: { flexDirection: 'column' },
  itemImg: { width: 100, height: 100 },
  itemImgMobile: { width: '100%', height: 150 },
  itemImgPlaceholder: { backgroundColor: C.CARD_BG2, alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1, padding: 12, minWidth: 0 },
  itemName: { color: C.TEXT, fontSize: 14, fontWeight: '700', marginBottom: 3, lineHeight: 20 },
  itemUnitPrice: { color: C.TEXT_MUTED, fontSize: 12, marginBottom: 2 },
  itemPrice: { color: C.ORANGE, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  qtyBtn: { width: 30, height: 30, backgroundColor: C.CARD_BG2, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.CARD_BORDER },
  qtyBtnText: { color: C.TEXT, fontSize: 18, fontWeight: '700', lineHeight: 20 },
  qty: { color: C.TEXT, fontSize: 16, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  removeBtn: { marginLeft: 8, paddingVertical: 6 },
  removeBtnText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },
  checkoutGrid: { margin: 16, gap: 16, maxWidth: '100%' },
  checkoutGridMobile: { marginHorizontal: 12 },
  checkoutGridDesktop: { flexDirection: 'row', alignItems: 'stretch' },
  checkoutInfo: { flex: 1, backgroundColor: C.CARD_BG, borderRadius: borderRadius.xl, padding: 20, borderWidth: 1, borderColor: C.CARD_BORDER, minWidth: 0 },
  cartPanelMobile: { padding: 14, borderRadius: borderRadius.lg },
  checkoutLine: { color: C.TEXT_SECONDARY, fontSize: 14, lineHeight: 22, marginBottom: 10 },
  returnNote: { color: C.TEAL, fontSize: 13, lineHeight: 20, marginTop: 4, fontWeight: '700' },
  shippingFields: { gap: 8, marginTop: 4, marginBottom: 14 },
  shippingRow: { flexDirection: 'row', gap: 8 },
  shippingRowField: { flex: 1, minWidth: 0 },
  summary: { flex: 1, backgroundColor: C.CARD_BG, borderRadius: borderRadius.xl, padding: 20, borderWidth: 1, borderColor: C.CARD_BORDER, minWidth: 0 },
  summaryTitle: { color: C.TEXT, fontSize: 16, fontWeight: '700', marginBottom: 14 },
  codeGrid: { gap: 10, marginBottom: 16 },
  codeField: { gap: 6 },
  codeLabel: { color: C.TEXT_SECONDARY, fontSize: 12, fontWeight: '700' },
  codeInput: {
    backgroundColor: C.INPUT_BG,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    borderRadius: borderRadius.lg,
    color: C.TEXT,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minWidth: 0,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  summaryLabel: { color: C.TEXT_MUTED, fontSize: 14, flexShrink: 1 },
  summaryValue: { color: C.TEXT_SECONDARY, fontSize: 14, flexShrink: 1, textAlign: 'right' },
  totalRow: { borderTopWidth: 1, borderTopColor: C.DIVIDER, paddingTop: 12, marginTop: 4, marginBottom: 16 },
  totalLabel: { color: C.TEXT, fontSize: 16, fontWeight: '700' },
  totalAmt: { color: C.ORANGE, fontSize: 22, fontWeight: '800' },
  checkoutButton: { marginTop: 4, width: '100%', maxWidth: '100%', alignSelf: 'stretch', paddingHorizontal: 10, minWidth: 0, boxSizing: 'border-box' },
  checkoutButtonText: { textAlign: 'center', flexShrink: 1 },
  continueShopping: { alignItems: 'center', marginTop: 12 },
  continueShoppingText: { color: C.TEXT_MUTED, fontSize: 13 },
});

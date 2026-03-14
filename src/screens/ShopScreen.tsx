import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme';

const PRODUCTS = [
  { name: 'Photo Healthy Tee', price: '$29.99', icon: '👕', badge: 'Popular' },
  { name: 'Camera Lens Mug', price: '$18.99', icon: '☕', badge: null },
  { name: 'Photography Journal', price: '$24.99', icon: '📓', badge: 'New' },
  { name: 'Canvas Print (16x20)', price: '$49.99', icon: '🖼️', badge: null },
  { name: 'Pro Membership', price: '$9.99/mo', icon: '⭐', badge: 'Best Value' },
  { name: 'Lens Cleaning Kit', price: '$14.99', icon: '🧹', badge: null },
  { name: 'Photo Healthy Cap', price: '$22.99', icon: '🧢', badge: null },
  { name: 'Sticker Pack', price: '$8.99', icon: '✨', badge: null },
];

const ShopScreen = () => (
  <ScrollView style={styles.container}>
    <View style={styles.hero}>
      <Text style={styles.heroTitle}>Shop</Text>
      <Text style={styles.heroSub}>Gear, merch, and more for the Photo Healthy community</Text>
    </View>
    <View style={styles.content}>
      <View style={styles.grid}>
        {PRODUCTS.map((p, i) => (
          <View key={i} style={styles.card}>
            {p.badge && (
              <View style={styles.badge}><Text style={styles.badgeText}>{p.badge}</Text></View>
            )}
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>{p.icon}</Text>
            </View>
            <Text style={styles.name}>{p.name}</Text>
            <Text style={styles.price}>{p.price}</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => { if (typeof window !== 'undefined') window.alert('Shop coming soon!'); }}>
              <Text style={styles.addBtnText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          Shop is coming soon! Products shown are placeholders. Stay tuned for our official launch.
        </Text>
      </View>
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  hero: { backgroundColor: colors.primary, paddingVertical: 60, paddingHorizontal: 24, alignItems: 'center' },
  heroTitle: { color: '#FFFFFF', fontSize: 36, fontWeight: '700', textAlign: 'center' },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 18, marginTop: 12, textAlign: 'center' },
  content: { maxWidth: 1000, width: '100%', alignSelf: 'center', padding: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: {
    width: '23%', minWidth: 200, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  badge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: colors.primary, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3,
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  iconWrap: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  icon: { fontSize: 36 },
  name: { fontSize: 16, fontWeight: '600', color: '#1F2937', textAlign: 'center', marginBottom: 6 },
  price: { fontSize: 18, fontWeight: '700', color: colors.primary, marginBottom: 16 },
  addBtn: {
    backgroundColor: colors.primary, borderRadius: 8,
    paddingHorizontal: 20, paddingVertical: 10, width: '100%', alignItems: 'center',
  },
  addBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  notice: {
    marginTop: 32, backgroundColor: '#FEF3C7', borderRadius: 8, padding: 16,
  },
  noticeText: { color: '#92400E', fontSize: 14, textAlign: 'center' },
});

export default ShopScreen;

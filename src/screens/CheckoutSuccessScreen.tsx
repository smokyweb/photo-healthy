import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import GradientButton from '../components/GradientButton';
import AppFooter from '../components/AppFooter';
import { C, borderRadius } from '../theme';

export default function CheckoutSuccessScreen() {
  const navigation = useNavigation<any>();
  const { clearCart } = useCart();
  useEffect(() => { clearCart(); }, []);

  return (
    <ScrollView style={{ backgroundColor: C.BG }} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.container}>
        <Text style={styles.icon}>🎉</Text>
        <Text style={styles.title}>Order Confirmed!</Text>
        <Text style={styles.body}>
          Thank you for your purchase. You'll receive a confirmation email shortly.
        </Text>
        <GradientButton label="Continue Shopping" onPress={() => navigation.navigate('Shop' as never)} style={{ marginTop: 24, width: 280 } as any} />
        <GradientButton label="Go Home" onPress={() => navigation.navigate('Main' as never)} variant="outline" style={{ marginTop: 12, width: 280 } as any} />
      </View>
      <AppFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 32, paddingTop: 60, paddingBottom: 40 },
  icon: { fontSize: 80, marginBottom: 16 },
  title: { color: C.TEXT, fontSize: 28, fontWeight: '800', marginBottom: 12, fontFamily: "'Lexend', sans-serif" },
  body: { color: C.TEXT_SECONDARY, fontSize: 16, textAlign: 'center', lineHeight: 24, maxWidth: 400 },
});

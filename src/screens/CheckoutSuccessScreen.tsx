import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import GradientButton from '../components/GradientButton';
import { C } from '../theme';
import AppFooter from '../components/AppFooter';

export default function CheckoutSuccessScreen() {
  const navigation = useNavigation<any>();
  const { clearCart } = useCart();

  useEffect(() => { clearCart(); }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🎉</Text>
      <Text style={styles.title}>Order Confirmed!</Text>
      <Text style={styles.body}>
        Thank you for your purchase. You'll receive a confirmation email shortly.
      </Text>
      <GradientButton
        label="Continue Shopping"
        onPress={() => navigation.navigate('Shop')}
        style={{ marginTop: 24, width: '100%' }}
      />
      <GradientButton
        label="Go Home"
        onPress={() => navigation.navigate('Main')}
        variant="outline"
        style={{ marginTop: 12, width: '100%' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#0D1117',
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  icon: { fontSize: 80, marginBottom: 16 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', marginBottom: 12 },
  body: { color: '#C0C7D1', fontSize: 16, textAlign: 'center', lineHeight: 24 },
});

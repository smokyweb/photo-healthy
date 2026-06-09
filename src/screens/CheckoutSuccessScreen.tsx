import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import { verifyCheckoutSession } from '../services/api';
import GradientButton from '../components/GradientButton';
import AppFooter from '../components/AppFooter';
import { C } from '../theme';

export default function CheckoutSuccessScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { clearCart } = useCart();
  const [checking, setChecking] = useState(true);
  const [title, setTitle] = useState('Checking Order...');
  const [message, setMessage] = useState('Please wait while we confirm your payment.');

  useEffect(() => {
    let active = true;
    const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const params = route.params || {};
    const sessionId = params.ref || params.session_id || search?.get('ref') || search?.get('session_id');
    const returnType = params.type || search?.get('type');
    const returnStatus = params.status || search?.get('status');
    const isFreeOrder = params.freeOrder === true || search?.get('free_order') === '1';

    if (returnStatus === 'cancelled' || returnType === 'cancel') {
      setTitle('Checkout Cancelled');
      setMessage('Your cart was not changed. You can return to the shop whenever you are ready.');
      setChecking(false);
      return () => { active = false; };
    }

    if (!sessionId) {
      if (returnType === 'sub' && returnStatus === 'success') {
        setTitle('Subscription Updated!');
        setMessage('Your membership change has been received.');
      } else if (isFreeOrder) {
        clearCart();
        setTitle('Order Confirmed!');
        setMessage('Thank you for your purchase. You will receive a confirmation email shortly.');
      } else {
        setTitle('Could Not Verify Payment');
        setMessage('This checkout return did not include a Stripe reference. Your cart was not changed.');
      }
      setChecking(false);
      return () => { active = false; };
    }

    verifyCheckoutSession(String(sessionId))
      .then((data: any) => {
        if (!active) return;
        if (data?.paid) {
          clearCart();
          setTitle('Order Confirmed!');
          setMessage('Thank you for your purchase. You will receive a confirmation email shortly.');
        } else {
          setTitle('Payment Not Finished');
          setMessage('Stripe has not marked this payment as complete yet. Please return to checkout or contact support if you were charged.');
        }
      })
      .catch((e: any) => {
        if (!active) return;
        setTitle('Could Not Verify Payment');
        setMessage(e?.message || 'We could not confirm this payment. Please check your orders before trying again.');
      })
      .finally(() => active && setChecking(false));

    return () => { active = false; };
  }, []);

  return (
    <ScrollView style={{ backgroundColor: 'transparent' }} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.container}>
        <Text style={styles.icon}>{checking ? '...' : 'OK'}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{message}</Text>
        <GradientButton label="Continue Shopping" onPress={() => navigation.navigate('Shop' as never)} style={{ marginTop: 24, width: 280 } as any} />
        <GradientButton label="Go Home" onPress={() => navigation.navigate('Main' as never)} variant="outline" style={{ marginTop: 12, width: 280 } as any} />
      </View>
      <AppFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 32, paddingTop: 60, paddingBottom: 40 },
  icon: { color: C.TEAL, fontSize: 44, fontWeight: '900', marginBottom: 16 },
  title: { color: C.TEXT, fontSize: 28, fontWeight: '800', marginBottom: 12, fontFamily: "'Lexend', sans-serif" },
  body: { color: C.TEXT_SECONDARY, fontSize: 16, textAlign: 'center', lineHeight: 24, maxWidth: 520 },
});

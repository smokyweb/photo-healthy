/**
 * BottomNavBar - shows on outer stack screens (non-tab screens)
 * Gives users quick access to main sections without needing back button chains
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { C } from '../theme';

const NAV_ITEMS = [
  { label: 'Home', icon: '🏠', screen: 'Main', params: { screen: 'HomeTab' } },
  { label: 'Challenges', icon: '📷', screen: 'Main', params: { screen: 'ChallengesTab' } },
  { label: 'Shop', icon: '🛍️', screen: 'Shop' },
  { label: 'Profile', icon: '👤', screen: 'Main', params: { screen: 'ProfileTab' } },
];

export default function BottomNavBar() {
  const nav = useNavigation<any>();
  if (Platform.OS !== 'web') return null; // Only show on web

  return (
    <View style={styles.bar}>
      {NAV_ITEMS.map(item => (
        <TouchableOpacity
          key={item.label}
          style={styles.item}
          onPress={() => nav.navigate(item.screen as any, item.params)}
          activeOpacity={0.7}
        >
          <Text style={styles.icon}>{item.icon}</Text>
          <Text style={styles.label}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: C.CARD_BG,
    borderTopWidth: 1,
    borderTopColor: C.CARD_BORDER,
    paddingBottom: 8,
    paddingTop: 8,
  },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  icon: { fontSize: 20 },
  label: { color: C.TEXT_MUTED, fontSize: 10, fontWeight: '600' },
});

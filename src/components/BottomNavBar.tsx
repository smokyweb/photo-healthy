/**
 * BottomNavBar - shows on outer stack screens when used by the web shell.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { C } from '../theme';

const NAV_ITEMS = [
  { label: 'Home', icon: 'home', screen: 'Main', params: { screen: 'HomeTab' } },
  { label: 'Challenges', icon: 'challenge', screen: 'Main', params: { screen: 'ChallengesTab' } },
  { label: 'Shop', icon: 'shop', screen: 'Shop', params: undefined },
  { label: 'Profile', icon: 'profile', screen: 'Main', params: { screen: 'ProfileTab' } },
];

function LineIcon({ name }: { name: string }) {
  if (name === 'home') {
    return <View style={styles.iconBox}><View style={styles.homeRoof} /><View style={styles.homeBase} /></View>;
  }
  if (name === 'challenge') {
    return <View style={styles.iconBox}><View style={styles.cup} /><View style={styles.cupStem} /><View style={styles.cupBase} /></View>;
  }
  if (name === 'shop') {
    return <View style={styles.iconBox}><View style={styles.bagHandle} /><View style={styles.bagBody} /></View>;
  }
  return <View style={styles.iconBox}><View style={styles.profileHead} /><View style={styles.profileBody} /></View>;
}

export default function BottomNavBar() {
  const nav = useNavigation<any>();
  if (Platform.OS !== 'web') return null;

  return (
    <View style={styles.bar}>
      {NAV_ITEMS.map(item => (
        <TouchableOpacity
          key={item.label}
          style={styles.item}
          onPress={() => nav.navigate(item.screen as any, item.params)}
          activeOpacity={0.7}
        >
          <LineIcon name={item.icon} />
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
  label: { color: C.TEXT_MUTED, fontSize: 10, fontWeight: '600' },
  iconBox: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  homeRoof: { position: 'absolute', top: 5, width: 11, height: 11, borderLeftWidth: 2, borderTopWidth: 2, borderColor: C.TEXT_MUTED, transform: [{ rotate: '45deg' }] },
  homeBase: { position: 'absolute', bottom: 4, width: 15, height: 10, borderWidth: 2, borderTopWidth: 0, borderColor: C.TEXT_MUTED, borderRadius: 2 },
  cup: { width: 14, height: 10, borderWidth: 2, borderColor: C.TEXT_MUTED, borderBottomLeftRadius: 6, borderBottomRightRadius: 6 },
  cupStem: { width: 2, height: 5, backgroundColor: C.TEXT_MUTED },
  cupBase: { width: 11, height: 2, backgroundColor: C.TEXT_MUTED, borderRadius: 2 },
  bagHandle: { width: 10, height: 6, borderWidth: 2, borderBottomWidth: 0, borderColor: C.TEXT_MUTED, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  bagBody: { width: 16, height: 13, borderWidth: 2, borderColor: C.TEXT_MUTED, borderRadius: 3 },
  profileHead: { width: 8, height: 8, borderRadius: 8, borderWidth: 2, borderColor: C.TEXT_MUTED, marginBottom: 2 },
  profileBody: { width: 15, height: 8, borderTopLeftRadius: 12, borderTopRightRadius: 12, borderWidth: 2, borderBottomWidth: 0, borderColor: C.TEXT_MUTED },
});

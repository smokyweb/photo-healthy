import React from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { C, borderRadius } from '../theme';

interface Props {
  visible: boolean;
  uri?: string | null;
  title?: string;
  onClose: () => void;
}

export default function PhotoLightbox({ visible, uri, title, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const viewerWidth = Math.max(280, width - 48);
  const viewerHeight = Math.max(280, height - 120);

  return (
    <Modal visible={visible && !!uri} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.viewer, { width: viewerWidth, height: viewerHeight }]}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>{title || 'Photo'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close photo viewer">
              <Text style={styles.closeText}>x</Text>
            </TouchableOpacity>
          </View>
          {uri ? (
            <Image source={{ uri }} style={styles.image} resizeMode="contain" />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  viewer: {
    maxWidth: 1180,
    maxHeight: 900,
    backgroundColor: 'rgba(15, 18, 31, 0.96)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    overflow: 'hidden',
  },
  header: {
    minHeight: 50,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: C.CARD_BORDER,
  },
  title: {
    color: C.TEXT,
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
    paddingRight: 12,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.CARD_BG,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  closeText: {
    color: C.TEXT,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 20,
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#05070D',
  },
});

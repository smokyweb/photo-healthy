import React from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { C, borderRadius } from '../theme';

interface Props {
  visible: boolean;
  uri?: string | null;
  title?: string;
  onClose: () => void;
  downloadLabel?: string;
  downloading?: boolean;
  onDownload?: () => void;
}

export default function PhotoLightbox({ visible, uri, title, onClose, downloadLabel = 'Download Original', downloading = false, onDownload }: Props) {
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
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close photo viewer">
                <Text style={styles.closeText}>x</Text>
              </TouchableOpacity>
            </View>
          </View>
          {uri ? (
            <View style={styles.imageWrap}>
              <Image source={{ uri }} style={styles.image} resizeMode="contain" />
              <Text style={styles.watermark}>Photo Healthy</Text>
              {!!onDownload && (
                <TouchableOpacity
                  onPress={onDownload}
                  style={styles.downloadBtn}
                  accessibilityLabel={downloadLabel}
                  disabled={downloading}
                  activeOpacity={0.82}
                >
                  <View style={styles.downloadIcon}>
                    <View style={styles.downloadStem} />
                    <View style={styles.downloadArrow} />
                    <View style={styles.downloadBase} />
                  </View>
                  <Text style={styles.downloadText}>{downloading ? 'Preparing...' : downloadLabel}</Text>
                </TouchableOpacity>
              )}
            </View>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  downloadBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: C.TEAL,
    backgroundColor: 'rgba(8,12,24,0.86)',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  downloadIcon: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadStem: {
    position: 'absolute',
    top: 2,
    width: 2,
    height: 8,
    borderRadius: 2,
    backgroundColor: C.TEAL,
  },
  downloadArrow: {
    position: 'absolute',
    top: 7,
    width: 8,
    height: 8,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: C.TEAL,
    transform: [{ rotate: '45deg' }],
  },
  downloadBase: {
    position: 'absolute',
    bottom: 1,
    width: 14,
    height: 2,
    borderRadius: 2,
    backgroundColor: C.TEAL,
  },
  downloadText: {
    color: C.TEAL,
    fontSize: 13,
    fontWeight: '900',
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
  imageWrap: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#05070D',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#05070D',
  },
  watermark: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    color: 'rgba(255,255,255,0.56)',
    backgroundColor: 'rgba(8,12,24,0.32)',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 13,
    fontWeight: '900',
  },
});

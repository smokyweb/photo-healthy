import React, { useEffect, useState } from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { C, borderRadius } from '../theme';
import WatermarkedImage from './WatermarkedImage';

interface Props {
  visible: boolean;
  uri?: string | null;
  title?: string;
  onClose: () => void;
  showWatermark?: boolean;
}

export default function PhotoLightbox({ visible, uri, title, onClose, showWatermark = true }: Props) {
  const { width, height } = useWindowDimensions();
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const maxViewerWidth = Math.max(280, width - 48);
  const maxViewerHeight = Math.max(280, height - 48);
  const hasNaturalSize = !!naturalSize?.width && !!naturalSize?.height;
  const photoScale = hasNaturalSize
    ? Math.min(
        maxViewerWidth / naturalSize.width,
        maxViewerHeight / naturalSize.height,
        Math.max(1, 240 / Math.max(naturalSize.width, naturalSize.height))
      )
    : 1;
  const viewerWidth = hasNaturalSize ? naturalSize.width * photoScale : maxViewerWidth;
  const viewerHeight = hasNaturalSize ? naturalSize.height * photoScale : maxViewerHeight;

  useEffect(() => {
    if (!uri) {
      setNaturalSize(null);
      return;
    }
    let active = true;
    Image.getSize(
      uri,
      (photoWidth, photoHeight) => {
        if (active) setNaturalSize({ width: photoWidth, height: photoHeight });
      },
      () => {
        if (active) setNaturalSize(null);
      }
    );
    return () => { active = false; };
  }, [uri]);

  return (
    <Modal visible={visible && !!uri} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.viewer, { width: viewerWidth, height: viewerHeight }]}>
          {uri ? (
            <View style={styles.imageWrap}>
              <WatermarkedImage
                source={{ uri }}
                style={styles.image}
                resizeMode="contain"
                showWatermark={showWatermark}
                watermarkSize="large"
              />
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close photo viewer">
                <Text style={styles.closeText}>X</Text>
              </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  viewer: {
    maxWidth: 1180,
    maxHeight: 900,
    backgroundColor: 'transparent',
    borderRadius: borderRadius.lg,
    overflow: 'visible',
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 38,
    height: 38,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8,12,24,0.82)',
    borderWidth: 1,
    borderColor: C.ORANGE + '99',
    zIndex: 6,
  },
  closeText: {
    color: C.TEXT,
    fontSize: 17,
    fontWeight: '900',
  },
  imageWrap: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'transparent',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    borderRadius: borderRadius.lg,
  },
});

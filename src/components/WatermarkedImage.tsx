import React, { useEffect, useMemo, useState } from 'react';
import { Image, ImageStyle, LayoutChangeEvent, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import PhotoWatermark from './PhotoWatermark';

type ResizeMode = 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
type WatermarkSize = 'tiny' | 'small' | 'medium' | 'large';

type Props = {
  source: any;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  resizeMode?: ResizeMode;
  showWatermark?: boolean;
  watermarkSize?: WatermarkSize;
};

export default function WatermarkedImage({
  source,
  style,
  imageStyle,
  resizeMode = 'cover',
  showWatermark = true,
  watermarkSize = 'small',
}: Props) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);
  const sourceKey = typeof source === 'number'
    ? `asset:${source}`
    : source?.uri
      ? `uri:${source.uri}`
      : source
        ? `source:${JSON.stringify(source)}`
        : 'empty';

  useEffect(() => {
    let active = true;
    const resolved = (Image as any).resolveAssetSource?.(source) || source || {};
    const uri = resolved?.uri || source?.uri;

    if (resolved?.width && resolved?.height) {
      setNatural(prev => (
        prev?.width === resolved.width && prev?.height === resolved.height
          ? prev
          : { width: resolved.width, height: resolved.height }
      ));
    } else if (uri) {
      Image.getSize(
        uri,
        (width, height) => {
          if (active) {
            setNatural(prev => (
              prev?.width === width && prev?.height === height
                ? prev
                : { width, height }
            ));
          }
        },
        () => {
          if (active) setNatural(null);
        }
      );
    } else {
      setNatural(null);
    }

    return () => {
      active = false;
    };
  }, [sourceKey]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setLayout(prev => (
      Math.abs(prev.width - width) < 0.5 && Math.abs(prev.height - height) < 0.5
        ? prev
        : { width, height }
    ));
  };

  const watermarkFrame = useMemo(() => {
    const fullFrame = { position: 'absolute' as const, left: 0, top: 0, width: '100%' as const, height: '100%' as const };
    if (resizeMode !== 'contain' || !natural || !layout.width || !layout.height) return fullFrame;

    const imageRatio = natural.width / Math.max(1, natural.height);
    const frameRatio = layout.width / Math.max(1, layout.height);
    let width = layout.width;
    let height = layout.height;
    let left = 0;
    let top = 0;

    if (imageRatio > frameRatio) {
      height = width / imageRatio;
      top = (layout.height - height) / 2;
    } else {
      width = height * imageRatio;
      left = (layout.width - width) / 2;
    }

    return { position: 'absolute' as const, left, top, width, height };
  }, [layout.height, layout.width, natural, resizeMode]);

  return (
    <View style={[styles.wrap, style]} onLayout={onLayout}>
      <Image source={source} style={[styles.image, imageStyle]} resizeMode={resizeMode} />
      {showWatermark ? (
        <View pointerEvents="none" style={watermarkFrame}>
          <PhotoWatermark size={watermarkSize} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
});

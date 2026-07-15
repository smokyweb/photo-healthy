import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

type MasonryRenderMeta = {
  aspectRatio: number;
  columnIndex: number;
  itemIndex: number;
};

type MasonryGridProps<T> = {
  items: T[];
  numColumns: number;
  gap?: number;
  estimatedContentHeight?: number;
  getKey: (item: T, index: number) => string | number;
  getImageUri: (item: T, index: number) => string | null | undefined;
  renderItem: (item: T, meta: MasonryRenderMeta) => React.ReactNode;
};

const FALLBACK_ASPECTS = [1, 4 / 3, 3 / 4, 5 / 4, 4 / 5, 16 / 10, 10 / 14];

const clampAspectRatio = (ratio: number) => {
  if (!Number.isFinite(ratio) || ratio <= 0) return 1;
  return Math.min(1.9, Math.max(0.55, ratio));
};

export default function MasonryGrid<T>({
  items,
  numColumns,
  gap = 10,
  estimatedContentHeight = 92,
  getKey,
  getImageUri,
  renderItem,
}: MasonryGridProps<T>) {
  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({});
  const columnCount = Math.max(1, Math.min(Math.floor(numColumns || 1), Math.max(items.length, 1)));

  useEffect(() => {
    let isActive = true;

    items.forEach((item, index) => {
      const key = String(getKey(item, index));
      const uri = getImageUri(item, index);
      if (!uri || aspectRatios[key]) return;

      Image.getSize(
        uri,
        (width, height) => {
          if (!isActive) return;
          const ratio = clampAspectRatio(width / height);
          setAspectRatios(prev => (prev[key] ? prev : { ...prev, [key]: ratio }));
        },
        () => {
          if (!isActive) return;
          const fallback = FALLBACK_ASPECTS[index % FALLBACK_ASPECTS.length];
          setAspectRatios(prev => (prev[key] ? prev : { ...prev, [key]: fallback }));
        }
      );
    });

    return () => {
      isActive = false;
    };
  }, [items, getKey, getImageUri, aspectRatios]);

  const columns = useMemo(() => {
    const next = Array.from({ length: columnCount }, () => ({
      height: 0,
      items: [] as Array<{ item: T; index: number; aspectRatio: number }>,
    }));

    items.forEach((item, index) => {
      const key = String(getKey(item, index));
      const aspectRatio = clampAspectRatio(aspectRatios[key] || FALLBACK_ASPECTS[index % FALLBACK_ASPECTS.length]);
      let targetColumn = 0;

      for (let i = 1; i < next.length; i += 1) {
        if (next[i].height < next[targetColumn].height) targetColumn = i;
      }

      next[targetColumn].items.push({ item, index, aspectRatio });
      next[targetColumn].height += (1 / aspectRatio) * 240 + estimatedContentHeight + gap;
    });

    return next;
  }, [items, columnCount, aspectRatios, getKey, estimatedContentHeight, gap]);

  if (!items.length) return null;

  return (
    <View style={[styles.grid, { gap }]}>
      {columns.map((column, columnIndex) => (
        <View key={columnIndex} style={[styles.column, { gap }]}>
          {column.items.map(({ item, index, aspectRatio }) => (
            <React.Fragment key={String(getKey(item, index))}>
              {renderItem(item, { aspectRatio, columnIndex, itemIndex: index })}
            </React.Fragment>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  column: {
    flex: 1,
    minWidth: 0,
  },
});

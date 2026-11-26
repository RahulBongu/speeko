import React, { useCallback, useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  resolveFoxAnimation,
  foxMoodForReaction,
  type FoxMood,
  type MascotReactionId,
  type MascotState,
  type ProgressState,
} from '@speeko/core';
import { FOX_MASCOT_ASSETS } from './foxAssets';

export type { FoxMood };

export interface FoxProps {
  mood?: FoxMood | MascotState | 'correct' | 'incorrect' | MascotReactionId;
  accessory?: ProgressState['equippedCosmetic'];
  style?: any;
  speaking?: boolean;
  listening?: boolean;
  patrol?: boolean;
  /** Normalized gaze direction (`-1..1`) for subtle responsive lean. */
  lookAt?: { x: number; y: number } | null;
  /** Consecutive correct answers; escalates celebrations at higher combos. */
  combo?: number;
  title?: string;
  onTap?: () => void;
}

const FOX_REACTION_IDS = new Set<MascotReactionId>([
  'correct_answer',
  'incorrect_answer',
  'lesson_complete',
  'unit_complete',
  'discovery',
  'streak_milestone',
  'encouragement',
]);

const SPRITE_COLS = 6;
const SPRITE_FRAMES = 36;
const REACTION_DURATION_MS = 2300;
const LOOP_DURATION_MS = 3200;

function isReactionId(value: unknown): value is MascotReactionId {
  return typeof value === 'string' && FOX_REACTION_IDS.has(value as MascotReactionId);
}

/**
 * Speeko the fox — powered by `@speeko/core`'s 15-state animation machine and
 * Reanimated 6×6 alpha-matted Flow reference sprite sheets (`assets/mascot/sprites/*.webp`),
 * falling back to crisp static `.png` peak stills when reduced motion is enabled.
 */
export function Fox({
  mood = 'idle',
  accessory = null,
  style,
  speaking = false,
  listening = false,
  lookAt = null,
  combo = 0,
  title,
  onTap,
}: FoxProps) {
  const [tapped, setTapped] = useState(false);
  const [encouraging, setEncouraging] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const flat = StyleSheet.flatten(style) as
    | { width?: number | string; height?: number | string }
    | undefined;
  const initialSize =
    typeof flat?.width === 'number'
      ? flat.width
      : typeof flat?.height === 'number'
        ? flat.height
        : 112;
  const [cellSize, setCellSize] = useState(initialSize);

  useEffect(() => {
    setCellSize(initialSize);
  }, [initialSize]);

  const semanticMood: FoxMood | 'correct' | 'incorrect' = isReactionId(mood)
    ? foxMoodForReaction(mood)
    : mood;

  const state = resolveFoxAnimation({
    mood: encouraging ? 'encouraging' : semanticMood,
    speaking,
    listening,
    tapped,
    combo,
  });

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled?.().then((enabled) => {
      if (mounted) setReduceMotion(Boolean(enabled));
    });
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (enabled) => {
      setReduceMotion(Boolean(enabled));
    });
    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);

  useEffect(() => {
    setTapped(false);
  }, [semanticMood, speaking, listening]);

  useEffect(() => {
    if (
      semanticMood !== 'sad' &&
      semanticMood !== 'incorrect' &&
      semanticMood !== 'incorrect_supportive'
    ) {
      setEncouraging(false);
      return;
    }
    setEncouraging(false);
    const toEncourage = setTimeout(() => setEncouraging(true), 520);
    const back = setTimeout(() => setEncouraging(false), 1450);
    return () => {
      clearTimeout(toEncourage);
      clearTimeout(back);
    };
  }, [semanticMood]);

  useEffect(() => {
    if (!tapped) return;
    const t = setTimeout(() => setTapped(false), 650);
    return () => clearTimeout(t);
  }, [tapped]);

  const frameProgress = useSharedValue(0);
  const asset = FOX_MASCOT_ASSETS[state.semanticState];

  useEffect(() => {
    cancelAnimation(frameProgress);
    if (reduceMotion) {
      frameProgress.value = 0;
      return;
    }
    frameProgress.value = 0;
    const isSnappyReaction =
      asset.oneShot ||
      state.semanticState === 'encouragement' ||
      state.semanticState === 'excited' ||
      state.semanticState === 'lesson_complete' ||
      state.semanticState === 'victory_dance';
    const duration = isSnappyReaction ? REACTION_DURATION_MS : LOOP_DURATION_MS;
    if (asset.oneShot) {
      frameProgress.value = withTiming(SPRITE_FRAMES - 0.01, {
        duration,
        easing: Easing.linear,
      });
    } else {
      frameProgress.value = withRepeat(
        withTiming(SPRITE_FRAMES - 0.01, {
          duration,
          easing: Easing.linear,
        }),
        -1,
        false,
      );
    }
    return () => cancelAnimation(frameProgress);
  }, [state.semanticState, asset.oneShot, reduceMotion, tapped, frameProgress]);

  const spriteStyle = useAnimatedStyle(() => {
    const idx = Math.min(SPRITE_FRAMES - 1, Math.max(0, Math.floor(frameProgress.value)));
    const col = idx % SPRITE_COLS;
    const row = Math.floor(idx / SPRITE_COLS);
    return {
      transform: [
        { translateX: -col * cellSize },
        { translateY: -row * cellSize },
      ],
    };
  }, [cellSize]);

  const handleTap = useCallback(() => {
    setTapped(true);
    onTap?.();
  }, [onTap]);

  const decorative = !onTap && !title;
  const accessibilityLabel = title ?? state.label;

  const gazeX = lookAt ? Math.max(-1, Math.min(1, lookAt.x)) : 0;
  const gazeY = lookAt ? Math.max(-1, Math.min(1, lookAt.y)) : 0;

  const visual = (
    <View
      importantForAccessibility={decorative ? 'no-hide-descendants' : undefined}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        const h = e.nativeEvent.layout.height;
        const next = Math.round(Math.min(w, h));
        if (next > 0 && next !== cellSize) setCellSize(next);
      }}
      style={[
        {
          width: initialSize,
          height: initialSize,
          overflow: 'hidden',
          position: 'relative',
        },
        style,
        lookAt && !reduceMotion
          ? {
              transform: [
                { translateX: gazeX * 2.5 },
                { translateY: gazeY * 1.5 },
                { rotate: `${(gazeX * 2.4).toFixed(2)}deg` },
              ],
            }
          : null,
      ]}
    >
      {reduceMotion ? (
        <Image
          source={asset.still}
          resizeMode="contain"
          style={{ width: cellSize, height: cellSize }}
        />
      ) : (
        <Animated.View
          style={[
            { width: cellSize * SPRITE_COLS, height: cellSize * SPRITE_COLS },
            spriteStyle,
          ]}
        >
          <Image
            source={asset.sprite}
            resizeMode="stretch"
            style={{ width: cellSize * SPRITE_COLS, height: cellSize * SPRITE_COLS }}
          />
        </Animated.View>
      )}
      {accessory ? (
        <View pointerEvents="none" style={styles.badge}>
          <Svg viewBox="0 0 24 24" width={11} height={11}>
            {accessory === 'hat' ? (
              <Path
                d="M4 15h16M7 15l1.5-6h7L17 15"
                stroke="#fff"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ) : accessory === 'glasses' ? (
              <>
                <Circle cx="8" cy="12" r="3.2" stroke="#fff" strokeWidth="2.2" fill="none" />
                <Circle cx="16" cy="12" r="3.2" stroke="#fff" strokeWidth="2.2" fill="none" />
                <Path d="M11.2 12h1.6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
              </>
            ) : (
              <Path d="M5 10c4.5 2.5 9.5 2.5 14 0v4c-4.5 2-9.5 2-14 0v-4Z" fill="#fff" />
            )}
          </Svg>
        </View>
      ) : null}
    </View>
  );

  if (onTap) {
    return (
      <Pressable
        onPress={handleTap}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        testID="fox-mascot"
      >
        {visual}
      </Pressable>
    );
  }

  return (
    <View
      testID="fox-mascot"
      accessible={!decorative}
      accessibilityRole={decorative ? undefined : 'image'}
      accessibilityLabel={accessibilityLabel}
    >
      {visual}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#16A34A',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Fox;

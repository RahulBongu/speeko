import type { ReactNode } from 'react';
import {
  Image,
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { COLORS } from '../lib/theme';
import { Icon, type IconName } from './Icons';

/**
 * Shared "tactile" primitives.
 *
 * The Stitch screens use an extruded, hand-drawn game-board language: 2px ink
 * borders, a solid offset slab under every control, and chunky progress
 * tracks. These components carry that language into React Native without
 * pulling the HTML/Tailwind or Material Symbols dependencies into the app.
 */

const TONES = {
  green: {
    face: COLORS.green,
    edge: COLORS.greenDark,
    border: COLORS.greenDark,
    text: COLORS.white,
  },
  fox: {
    face: COLORS.fox,
    edge: '#C2410C',
    border: '#C2410C',
    text: COLORS.white,
  },
  white: {
    face: COLORS.white,
    edge: '#D8CBB2',
    border: COLORS.dark,
    text: COLORS.dark,
  },
  cream: {
    face: COLORS.creamDeep,
    edge: '#D8CBB2',
    border: COLORS.line,
    text: COLORS.dark,
  },
  disabled: {
    face: '#E7E0D4',
    edge: '#CFC6B8',
    border: '#CFC6B8',
    text: COLORS.muted,
  },
} as const;

type Tone = keyof typeof TONES;

interface TactilePressableProps {
  children: ReactNode;
  onPress?: (() => void) | undefined;
  disabled?: boolean;
  tone?: Tone;
  style?: StyleProp<ViewStyle> | undefined;
  contentStyle?: StyleProp<ViewStyle> | undefined;
  accessibilityLabel?: string | undefined;
  accessibilityHint?: string | undefined;
  accessibilityState?: { disabled?: boolean; selected?: boolean } | undefined;
}

/** A pressable with the design's extruded slab edge and pressed travel. */
export function TactilePressable({
  children,
  onPress,
  disabled = false,
  tone = 'green',
  style,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  contentStyle,
}: TactilePressableProps) {
  const palette = TONES[disabled ? 'disabled' : tone];
  return (
    <View style={[{ borderRadius: 16, backgroundColor: palette.edge }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={accessibilityState ?? { disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          {
            borderRadius: 14,
            borderWidth: 2,
            borderColor: palette.border,
            backgroundColor: palette.face,
            paddingVertical: 13,
            paddingHorizontal: 16,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
            marginBottom: pressed && !disabled ? 1 : 4,
            marginTop: pressed && !disabled ? 3 : 0,
          },
          contentStyle,
        ]}
      >
        {children}
      </Pressable>
    </View>
  );
}

/** Text-only tactile button, used for the primary actions. */
export function TactileButton({
  label,
  onPress,
  disabled = false,
  tone = 'green',
  style,
  accessibilityLabel,
  accessibilityState,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityState?: { disabled?: boolean; selected?: boolean };
}) {
  const palette = TONES[disabled ? 'disabled' : tone];
  return (
    <TactilePressable
      onPress={onPress}
      disabled={disabled}
      tone={tone}
      style={style}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
    >
      <Text style={{ fontWeight: '800', fontSize: 15, color: palette.text }}>
        {label}
      </Text>
    </TactilePressable>
  );
}

/** A static card with the same ink border and offset slab as the buttons. */
export function TactileCard({
  children,
  style,
  tone = 'white',
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: 'white' | 'green' | 'cream';
}) {
  const palette =
    tone === 'green'
      ? { face: COLORS.green, edge: COLORS.greenDark, border: COLORS.greenDark }
      : tone === 'cream'
        ? { face: COLORS.creamDeep, edge: '#D8CBB2', border: COLORS.line }
        : { face: COLORS.white, edge: '#D8CBB2', border: COLORS.dark };
  return (
    <View style={[{ borderRadius: 18, backgroundColor: palette.edge }, style]}>
      <View
        style={{
          borderRadius: 16,
          borderWidth: 2,
          borderColor: palette.border,
          backgroundColor: palette.face,
          padding: 16,
          marginBottom: 4,
        }}
      >
        {children}
      </View>
    </View>
  );
}

/** Bordered track with a rounded fill, matching the path and lesson bars. */
export function ProgressTrack({
  value,
  onGreen = false,
  height = 14,
}: {
  value: number;
  onGreen?: boolean;
  height?: number;
}) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={{
        height,
        borderRadius: 999,
        borderWidth: 2,
        borderColor: onGreen ? COLORS.greenDark : COLORS.dark,
        backgroundColor: onGreen ? 'rgba(255,255,255,0.25)' : COLORS.creamDeep,
        padding: 2,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          height: '100%',
          width: `${clamped * 100}%`,
          borderRadius: 999,
          backgroundColor: onGreen ? COLORS.cream : COLORS.green,
        }}
      />
    </View>
  );
}

/** Compact status pill for streak / XP / other single-number stats. */
export function StatPill({
  icon,
  iconName,
  value,
  label,
  iconColor,
}: {
  icon?: string;
  iconName?: IconName;
  value: number | string;
  label: string;
  iconColor?: string;
}) {
  return (
    <View
      accessibilityLabel={label}
      style={{ borderRadius: 999, backgroundColor: COLORS.dark, paddingBottom: 3 }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: COLORS.white,
          borderWidth: 2,
          borderColor: COLORS.dark,
          borderRadius: 999,
          paddingHorizontal: 9,
          paddingVertical: 4,
        }}
      >
        {iconName ? (
          <Icon name={iconName} size={14} color={iconColor ?? COLORS.dark} />
        ) : (
          <Text style={{ fontSize: 13, color: iconColor ?? COLORS.dark }}>{icon}</Text>
        )}
        <Text style={{ fontSize: 12, fontWeight: '900', color: COLORS.dark }}>{value}</Text>
      </View>
    </View>
  );
}

/** App bar with the fox avatar, wordmark, and real progress badges. */
export function SpeekoAppBar({
  subtitle,
  streak,
  xp,
}: {
  subtitle?: string;
  streak?: number;
  xp?: number;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          borderWidth: 2,
          borderColor: COLORS.dark,
          backgroundColor: COLORS.creamDeep,
          overflow: 'hidden',
        }}
      >
        <Image
          source={require('../assets/brand/speeko-flow-logo.png')}
          resizeMode="contain"
          accessibilityLabel="Speeko mascot logo"
          style={{ width: '100%', height: '100%' }}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 21, fontWeight: '900', letterSpacing: -0.4 }}>
          <Text style={{ color: COLORS.green }}>speek</Text>
          <Text style={{ color: COLORS.fox }}>o</Text>
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={1}
            style={{ fontSize: 11, fontWeight: '700', color: COLORS.muted }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {typeof streak === 'number' ? (
        <StatPill iconName="flame" iconColor={COLORS.fox} value={streak} label={`${streak} day streak`} />
      ) : null}
      {typeof xp === 'number' ? (
        <StatPill iconName="bolt" iconColor={COLORS.marigold} value={xp} label={`${xp} XP`} />
      ) : null}
    </View>
  );
}

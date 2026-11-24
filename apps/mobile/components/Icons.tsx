import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { COLORS } from '../lib/theme';

export type IconName =
  | 'home'
  | 'learn'
  | 'practice'
  | 'habits'
  | 'shop'
  | 'account'
  | 'lock'
  | 'check'
  | 'close'
  | 'play'
  | 'back'
  | 'guidebook'
  | 'trophy'
  | 'flame'
  | 'bolt'
  | 'heart';

export function Icon({ name, size = 18, color = COLORS.dark }: { name: IconName; size?: number; color?: string }) {
  const s = size;
  switch (name) {
    case 'home':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5Z" fill={color} />
        </Svg>
      );
    case 'learn':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4V4Z" fill={color} />
          <Path d="M20 4h-7a3 3 0 0 1-3 3v13a2 2 0 0 0 2-2h8V4Z" fill={color} opacity={0.7} />
        </Svg>
      );
    case 'practice':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path d="M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9Zm0 3a6 6 0 1 1-6 6 6 6 0 0 1 6-6Zm0 3a3 3 0 1 0 3 3 3 3 0 0 0-3-3Z" fill={color} />
        </Svg>
      );
    case 'habits':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Rect x="3" y="5" width="18" height="16" rx="3" fill={color} />
          <Rect x="7" y="2" width="2" height="6" rx="1" fill={color} />
          <Rect x="15" y="2" width="2" height="6" rx="1" fill={color} />
          <Rect x="7" y="11" width="4" height="4" rx="1" fill="#FFF9E0" />
          <Rect x="13" y="11" width="4" height="4" rx="1" fill="#FFF9E0" />
        </Svg>
      );
    case 'shop':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path d="M6 6h15l-1.5 9h-12L6 6Z" fill={color} />
          <Path d="M6 6 4 3H2" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
          <Circle cx="9" cy="20" r="1.8" fill={color} />
          <Circle cx="17" cy="20" r="1.8" fill={color} />
        </Svg>
      );
    case 'account':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Circle cx="12" cy="8" r="4" fill={color} />
          <Path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" fill={color} />
        </Svg>
      );
    case 'lock':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Rect x="5" y="11" width="14" height="10" rx="2.5" fill={color} />
          <Path d="M8 11V8a4 4 0 1 1 8 0v3" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        </Svg>
      );
    case 'check':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path d="M5 12.5 9.5 17 19 7.5" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'close':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path d="M5 5 19 19M19 5 5 19" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
        </Svg>
      );
    case 'play':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path d="M7 5v14l12-7-12-7Z" fill={color} />
        </Svg>
      );
    case 'back':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path d="M15 5 8 12l7 7" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'guidebook':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4V4Z" fill={color} />
          <Path d="M20 4h-7a3 3 0 0 1-3 3v13a2 2 0 0 0 2-2h8V4Z" fill={color} opacity={0.7} />
        </Svg>
      );
    case 'trophy':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path d="M6 3h12v4a6 6 0 0 1-12 0V3Z" fill={color} />
          <Path d="M6 5H3a2 2 0 0 0 0 4h3M18 5h3a2 2 0 0 0 0 4h-3" stroke={color} strokeWidth="2" fill="none" />
          <Rect x="10" y="13" width="4" height="5" fill={color} />
          <Rect x="7" y="18" width="10" height="3" rx="1.5" fill={color} />
        </Svg>
      );
    case 'flame':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path d="M12 2c0 4-4 6-4 10a4 4 0 0 0 8 0c0-2-1-3-1-5 2 1 3 3 3 5a6 6 0 1 1-12 0c0-5 4-7 6-10Z" fill={color} />
        </Svg>
      );
    case 'bolt':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill={color} />
        </Svg>
      );
    case 'heart':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path d="M12 21s-7-4.5-9.5-9C.5 8 3 4 7 4c2.2 0 3.8 1.2 5 3 1.2-1.8 2.8-3 5-3 4 0 6.5 4 4.5 8-2.5 4.5-9.5 9-9.5 9Z" fill={color} />
        </Svg>
      );
    default:
      return <View />;
  }
}

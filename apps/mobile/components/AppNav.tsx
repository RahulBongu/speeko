import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../lib/theme';

export type NavKey = 'learn' | 'practice' | 'habits' | 'shop' | 'account';

const ITEMS: { key: NavKey; label: string; href: string; icon: string }[] = [
  { key: 'learn', label: 'Learn', href: '/learn', icon: '📚' },
  { key: 'practice', label: 'Practice', href: '/practice', icon: '🔁' },
  { key: 'habits', label: 'Habits', href: '/habits', icon: '🔥' },
  { key: 'shop', label: 'Shop', href: '/shop', icon: '🛍️' },
  { key: 'account', label: 'Account', href: '/account', icon: '🦊' },
];

/** Shared bottom navigation for the app's main screens. */
export function AppNav({ active }: { active: NavKey }) {
  const router = useRouter();
  return (
    <View
      style={{
        flexDirection: 'row',
        borderTopWidth: 2,
        borderTopColor: COLORS.line,
        backgroundColor: COLORS.white,
        paddingVertical: 6,
        paddingHorizontal: 4,
        gap: 4,
      }}
    >
      {ITEMS.map((item) => {
        const isActive = item.key === active;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: isActive }}
            disabled={isActive}
            onPress={() => router.push(item.href as any)}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              paddingVertical: 6,
              borderRadius: 14,
              backgroundColor: isActive ? COLORS.greenSoft : 'transparent',
              borderWidth: isActive ? 2 : 0,
              borderColor: isActive ? COLORS.green : 'transparent',
            }}
          >
            <Text style={{ fontSize: 16 }}>{item.icon}</Text>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '900',
                color: isActive ? COLORS.greenDark : COLORS.muted,
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

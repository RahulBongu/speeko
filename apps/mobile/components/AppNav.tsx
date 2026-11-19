import { Pressable, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { COLORS } from '../lib/theme';

export type NavKey = 'learn' | 'practice' | 'habits' | 'shop' | 'account';

const ITEMS: { key: NavKey; label: string; href: Href; icon: string }[] = [
  { key: 'learn', label: 'Learn', href: '/learn', icon: '📚' },
  { key: 'practice', label: 'Practice', href: '/practice', icon: '🔁' },
  { key: 'habits', label: 'Habits', href: '/habits', icon: '📅' },
  { key: 'shop', label: 'Shop', href: '/shop', icon: '🛍️' },
  { key: 'account', label: 'Account', href: '/account', icon: '🦊' },
];

/**
 * Shared bottom navigation for the app's main screens.
 *
 * Active tabs are intentionally still pressable but a no-op: the Pressable
 * stays focusable and exposes accessibilityState.selected, and onPress
 * ignores pushes to the route you're already on. (Previously the active tab
 * was `disabled`, which hid it from some assistive-tech focus orders.)
 */
export function AppNav({ active }: { active: NavKey }) {
  return (
    <SafeAreaProvider>
      <AppNavBar active={active} />
    </SafeAreaProvider>
  );
}

function AppNavBar({ active }: { active: NavKey }) {
  const router = useRouter();
  // AppNavBar runs inside its own SafeAreaProvider, so the hook is always
  // unconditional and never misses a provider in unit tests.
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingBottom: Math.max(insets.bottom, 8),
        backgroundColor: COLORS.white,
      }}
    >
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
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: isActive }}
              onPress={() => {
                if (!isActive) {
                  router.push(item.href);
                }
              }}
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
    </View>
  );
}

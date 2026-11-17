import { View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../lib/theme';

/**
 * Shared screen scaffold for the main tab screens: safe-area top/sides,
 * cream background, dark status bar. The bottom inset is handled by
 * AppNav's bottom padding instead, so edges exclude 'bottom'.
 */
export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: COLORS.cream }}
    >
      <StatusBar style="dark" />
      <View style={[{ flex: 1 }, style]}>{children}</View>
    </SafeAreaView>
  );
}

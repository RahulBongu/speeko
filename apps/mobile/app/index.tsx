// Speeko welcome — the first screen of the Android app.
//
// Motion breakdown:
//  - Fox bobs idle (UI thread, Reanimated). This is a rare / first-launch
//    screen, so the bob is the "delight budget" doing its one job.
//  - Content fades up on mount with staggered delays (entering animations).
//  - The CTA scales to 0.97 on press with a spring and fires a success haptic.
//  - Reduced motion: bob and overshoot are dropped, only opacity remains.
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { INDIAN_LOCALES, LOCALE_LABEL } from '@speeko/core';
import { readCompletedOnboarding } from '../lib/onboarding';
import { loadProgress } from '../lib/progress';
import { Screen } from '../components/Screen';
import { Fox } from '../components/Fox';
import Animated, {
  FadeIn,
  FadeInUp,
  useReducedMotion,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const CREAM_DEEP = '#FDF0D5';
const GREEN = '#16A34A';
const GREEN_DARK = '#15803D';
const FOX = '#F97316';
const DARK = '#3F2A1D';
const MUTED = '#7A6156';

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

export default function Home() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const bob = useSharedValue(0);
  const ctaScale = useSharedValue(1);

  useEffect(() => {
    if (reduced) return;
    bob.set(
      withRepeat(withTiming(1, { duration: 1500, easing: EASE_OUT }), -1, true),
    );
    return () => bob.set(0);
  }, [bob, reduced]);

  const foxStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(bob.get(), [0, 1], [0, -12]) }],
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.get() }],
  }));

  const onStart = () => {
    ctaScale.set((v) => {
      return withSequence(
        withTiming(0.97, { duration: 80, easing: EASE_OUT }),
        withSpring(1, { duration: 220, dampingRatio: 0.7 }),
      );
    });
    // Same frame as the press — success haptic, visuals still carry the meaning.
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    void (async () => {
      const completed = await readCompletedOnboarding();
      if (!completed) {
        const progress = await loadProgress();
        if (progress.xp === 0) {
          router.push('/onboarding');
          return;
        }
      }
      router.push('/learn');
    })();
  };

  const entrance = (delay: number) =>
    reduced
      ? FadeIn.delay(delay).duration(250)
      : FadeInUp.delay(delay).duration(480).easing(EASE_OUT);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Wordmark */}
        <Animated.View entering={entrance(0)} style={styles.brandRow}>
          <View style={styles.brandDot} />
          <Text style={styles.brand}>
            <Text style={{ color: GREEN }}>speek</Text>
            <Text style={{ color: FOX }}>o</Text>
          </Text>
        </Animated.View>

        {/* Mascot */}
        <Animated.View entering={entrance(140)} style={styles.foxWrap}>
          <Animated.View style={[styles.foxHalo, foxStyle]}>
            <Fox
              mood="happy"
              style={styles.fox}
              title="Speeko, the friendly fox mascot"
            />
          </Animated.View>
        </Animated.View>

        {/* Headline + subline */}
        <Animated.Text entering={entrance(260)} style={styles.headline}>
          Speak a little more,{'\n'}every day.
        </Animated.Text>
        <Animated.Text entering={entrance(340)} style={styles.subline}>
          Three-minute lessons in ten Indian languages — streaks, hearts, and a fox who genuinely
          believes in you.
        </Animated.Text>

        {/* Language chips */}
        <Animated.ScrollView
          entering={entrance(420)}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, maxHeight: 52 }}
          contentContainerStyle={styles.chips}
        >
          {INDIAN_LOCALES.map((locale) => (
            <View key={locale} style={styles.chip}>
              <Text style={styles.chipText}>{LOCALE_LABEL[locale]}</Text>
            </View>
          ))}
        </Animated.ScrollView>

        {/* CTA */}
        <Animated.View entering={entrance(520)} style={styles.ctaWrap}>
          <Animated.View style={[styles.ctaShadow, ctaStyle]}>
            <Pressable
              onPress={onStart}
              accessibilityRole="button"
              accessibilityLabel="Start learning"
              style={styles.ctaPressable}
            >
              <Text style={styles.ctaLabel}>Start learning</Text>
              <Text style={styles.ctaArrow}>→</Text>
            </Pressable>
          </Animated.View>
          <Text style={styles.finePrint}>Free to start · progress stays on your device</Text>
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingTop: 8,
    gap: 10,
  },
  brandDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: GREEN,
  },
  brand: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  foxWrap: {
    marginTop: 18,
  },
  foxHalo: {
    width: 208,
    height: 208,
    borderRadius: 104,
    backgroundColor: CREAM_DEEP,
    borderWidth: 3,
    borderColor: '#F2E3BC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fox: {
    width: 188,
    height: 188,
    borderRadius: 94,
  },
  headline: {
    marginTop: 22,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    color: DARK,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subline: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: MUTED,
    textAlign: 'center',
    maxWidth: 330,
  },
  chips: {
    paddingVertical: 18,
    gap: 8,
    paddingHorizontal: 2,
    alignSelf: 'center',
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#E8D9B0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK,
  },
  ctaWrap: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingTop: 8,
    alignSelf: 'stretch',
  },
  ctaShadow: {
    alignSelf: 'stretch',
    borderRadius: 18,
    backgroundColor: GREEN_DARK,
    paddingBottom: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  ctaPressable: {
    height: 58,
    borderRadius: 18,
    backgroundColor: GREEN,
    borderWidth: 2,
    borderColor: GREEN_DARK,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  ctaLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  ctaArrow: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  finePrint: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
  },
});

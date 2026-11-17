import type { ReactNode } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../Screen';
import { COLORS } from '../../lib/theme';

export const ONBOARDING_STEPS = 5;

export function OnboardingFrame({
  step,
  title,
  subtitle,
  backHref,
  children,
}: {
  step: number;
  title: string;
  subtitle: string;
  backHref?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <Screen>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderBottomWidth: 2,
          borderBottomColor: COLORS.line,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: COLORS.green,
            }}
          />
          <Text style={{ fontSize: 22, fontWeight: '900', letterSpacing: -0.4 }}>
            <Text style={{ color: COLORS.green }}>speek</Text>
            <Text style={{ color: COLORS.fox }}>o</Text>
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Browse instead"
          onPress={() => router.push('/learn')}
          hitSlop={8}
          style={{ paddingHorizontal: 10, paddingVertical: 8 }}
        >
          <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.muted }}>
            Browse instead
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 24,
        }}
      >
        <View
          style={{
            alignSelf: 'stretch',
            maxWidth: 560,
            backgroundColor: COLORS.white,
            borderRadius: 24,
            borderWidth: 2,
            borderColor: COLORS.line,
            padding: 20,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Image
              source={require('../../assets/fox.png')}
              accessibilityLabel="Speeko, the friendly fox mascot"
              style={{ width: 72, height: 72, borderRadius: 36 }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  letterSpacing: 1.6,
                  color: COLORS.greenDark,
                }}
              >
                Step {step} of {ONBOARDING_STEPS}
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 22,
                  lineHeight: 27,
                  fontWeight: '900',
                  color: COLORS.dark,
                }}
              >
                {title}
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 14, lineHeight: 20, fontWeight: '600', color: COLORS.muted }}>
            {subtitle}
          </Text>

          <View
            accessibilityLabel={`Step ${step} of ${ONBOARDING_STEPS}`}
            style={{ flexDirection: 'row', gap: 6 }}
          >
            {Array.from({ length: ONBOARDING_STEPS }, (_, index) => (
              <View
                key={index}
                style={{
                  flex: 1,
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: index < step ? COLORS.green : COLORS.creamDeep,
                }}
              />
            ))}
          </View>

          <View style={{ marginTop: 4 }}>{children}</View>
        </View>

        {backHref ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.replace(backHref as any)}
            hitSlop={8}
            style={{ marginTop: 14, paddingHorizontal: 12, paddingVertical: 8 }}
          >
            <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.muted }}>← Back</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

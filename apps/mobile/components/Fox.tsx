import React, { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, Pressable } from 'react-native';
import Svg, { Circle, Ellipse, Path, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  resolveFoxAnimation,
  foxMoodForReaction,
  type FoxMood,
  type MascotReactionId,
} from '@speeko/core';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type { FoxMood };

export interface FoxProps {
  mood?: FoxMood | 'correct' | 'incorrect' | MascotReactionId;
  style?: any;
  speaking?: boolean;
  listening?: boolean;
  title?: string;
  onTap?: () => void;
}

const FOX_REACTION_IDS = new Set<MascotReactionId>([
  'correct_answer',
  'incorrect_answer',
  'lesson_complete',
  'discovery',
  'streak_milestone',
  'encouragement',
]);

function isReactionId(value: unknown): value is MascotReactionId {
  return typeof value === 'string' && FOX_REACTION_IDS.has(value as MascotReactionId);
}

/**
 * Speeko the fox, drawn as a code-based SVG rig.
 *
 * Artwork follows the supplied illustration: large glossy eyes, wide cream
 * muzzle, pointed warm ears, fluffy cream-tipped tail, dark paws and a teal
 * scarf. Independent groups (tail, arms, ears, head, pupils, mouth, scarf ends)
 * are animated with Reanimated; no flattened PNG or paid rig is used.
 */
export function Fox({
  mood = 'idle',
  style,
  speaking = false,
  listening = false,
  title,
  onTap,
}: FoxProps) {
  const [tapped, setTapped] = useState(false);
  const [encouraging, setEncouraging] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const semanticMood: FoxMood | 'correct' | 'incorrect' = isReactionId(mood)
    ? foxMoodForReaction(mood)
    : mood;

  const state = resolveFoxAnimation({
    mood: encouraging ? 'encouraging' : semanticMood,
    speaking,
    listening,
    tapped,
  });

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled?.().then((enabled) => {
      if (mounted) setReduceMotion(Boolean(enabled));
    });
    const subscription = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription?.remove?.();
    };
  }, []);

  useEffect(() => { setTapped(false); }, [semanticMood, speaking, listening]);

  useEffect(() => {
    if (semanticMood !== 'sad' && semanticMood !== 'incorrect') {
      setEncouraging(false);
      return;
    }
    setEncouraging(false);
    const toEncourage = setTimeout(() => setEncouraging(true), 850);
    const back = setTimeout(() => setEncouraging(false), 2100);
    return () => { clearTimeout(toEncourage); clearTimeout(back); };
  }, [semanticMood]);

  useEffect(() => {
    if (!tapped) return;
    const timer = setTimeout(() => setTapped(false), 720);
    return () => clearTimeout(timer);
  }, [tapped]);

  const handlePress = useCallback(() => {
    setTapped(true);
    onTap?.();
  }, [onTap]);

  const breathe = useSharedValue(0);
  const hop = useSharedValue(0);
  const celebrate = useSharedValue(0);
  const tail = useSharedValue(0);
  const mouth = useSharedValue(0);
  const blink = useSharedValue(0);
  const head = useSharedValue(0);
  const ear = useSharedValue(0);
  const pupil = useSharedValue(0);
  const leftArm = useSharedValue(-8);
  const rightArm = useSharedValue(6);

  const calm = useCallback((value: any, target = 0) => {
    if (reduceMotion) value.value = target;
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) { calm(breathe, 0); return; }
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2100, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2100, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [reduceMotion, breathe, calm]);

  useEffect(() => {
    if (reduceMotion || state.mood === 'sad') { calm(tail, 0); return; }
    tail.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 620, easing: Easing.inOut(Easing.ease) }),
        withTiming(-1, { duration: 620, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [reduceMotion, state.mood, tail, calm]);

  useEffect(() => {
    if (reduceMotion) { calm(hop, 0); calm(celebrate, 0); return; }
    if (state.animation === 'celebrate') {
      hop.value = withSequence(
        withTiming(1, { duration: 300, easing: Easing.out(Easing.back(1.7)) }),
        withTiming(0, { duration: 320, easing: Easing.in(Easing.ease) }),
      );
      celebrate.value = withSequence(
        withTiming(1, { duration: 420, easing: Easing.out(Easing.back(1.5)) }),
        withTiming(0, { duration: 460, easing: Easing.inOut(Easing.ease) }),
      );
    } else {
      celebrate.value = withTiming(0, { duration: 180 });
      if (state.animation === 'bounce') {
        hop.value = withSequence(
          withTiming(1, { duration: 360, easing: Easing.out(Easing.back(1.6)) }),
          withTiming(0, { duration: 360, easing: Easing.in(Easing.ease) }),
        );
      } else {
        hop.value = withTiming(0, { duration: 180 });
      }
    }
  }, [reduceMotion, state.animation, hop, celebrate, calm]);

  useEffect(() => {
    if (reduceMotion) { calm(head, 0); calm(ear, 0); calm(pupil, 0); return; }
    if (state.listening) {
      head.value = withRepeat(
        withSequence(
          withTiming(-2, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(2, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        ), -1, true,
      );
      ear.value = withRepeat(
        withSequence(withTiming(-4, { duration: 1200 }), withTiming(0, { duration: 1200 })), -1, true,
      );
      pupil.value = withRepeat(
        withSequence(withTiming(1, { duration: 1200 }), withTiming(-1, { duration: 1200 })), -1, true,
      );
    } else {
      head.value = withTiming(state.mood === 'encouraging' ? 2 : 0, { duration: 260 });
      ear.value = withTiming(0, { duration: 260 });
      pupil.value = withTiming(0, { duration: 260 });
    }
  }, [reduceMotion, state.listening, state.mood, head, ear, pupil, calm]);

  useEffect(() => {
    if (reduceMotion) { calm(mouth, 0); return; }
    if (state.speaking) {
      mouth.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 170, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 170, easing: Easing.inOut(Easing.ease) }),
        ), -1, false,
      );
    } else {
      mouth.value = withTiming(0, { duration: 120 });
    }
  }, [reduceMotion, state.speaking, mouth, calm]);

  useEffect(() => {
    if (reduceMotion || state.speaking) { calm(blink, 0); return; }
    const timer = setInterval(() => {
      blink.value = withSequence(
        withTiming(1, { duration: 110, easing: Easing.in(Easing.ease) }),
        withTiming(0, { duration: 110, easing: Easing.out(Easing.ease) }),
      );
    }, 3600);
    return () => clearInterval(timer);
  }, [reduceMotion, state.speaking, blink, calm]);

  useEffect(() => {
    const wave = state.waving || state.animation === 'celebrate' || state.animation === 'bounce';
    if (reduceMotion) {
      calm(leftArm, wave ? -92 : -8);
      calm(rightArm, state.animation === 'celebrate' ? 88 : 6);
      return;
    }
    if (wave || state.animation === 'celebrate') {
      leftArm.value = withSequence(
        withTiming(-92, { duration: 260, easing: Easing.out(Easing.ease) }),
        withTiming(-72, { duration: 220, easing: Easing.inOut(Easing.ease) }),
        withTiming(-92, { duration: 220, easing: Easing.inOut(Easing.ease) }),
        withTiming(-8, { duration: 320, easing: Easing.inOut(Easing.ease) }),
      );
    } else if (state.mood === 'sad') {
      leftArm.value = withTiming(12, { duration: 260 });
    } else {
      leftArm.value = withTiming(-8, { duration: 260 });
    }
    if (state.animation === 'celebrate') {
      rightArm.value = withSequence(
        withTiming(88, { duration: 300, easing: Easing.out(Easing.ease) }),
        withTiming(6, { duration: 420, easing: Easing.inOut(Easing.ease) }),
      );
    } else if (state.mood === 'sad') {
      rightArm.value = withTiming(-12, { duration: 260 });
    } else {
      rightArm.value = withTiming(6, { duration: 260 });
    }
  }, [reduceMotion, state.waving, state.animation, state.mood, leftArm, rightArm, calm]);

  const containerStyle = useAnimatedStyle(() => {
    if (reduceMotion) return {};
    return {
      transform: [
        { translateY: breathe.value * -2.5 + hop.value * -15 + celebrate.value * -4 },
        { rotate: `${celebrate.value * 5}deg` },
        { scale: 1 + breathe.value * 0.008 + hop.value * 0.02 },
      ],
    };
  });

  // Use SVG transform strings with an explicit centre instead of originX/originY.
  // react-native-svg's web renderer maps originX/originY to a DOM
  // `transform-origin` prop, which React warns about.
  const tailProps = useAnimatedProps(() => ({
    transform: `rotate(${tail.value * 6} 150 190)`,
  }));
  const headProps = useAnimatedProps(() => ({
    transform: `rotate(${head.value} 120 150)`,
  }));
  const leftEarProps = useAnimatedProps(() => ({
    transform: `rotate(${ear.value} 62 74)`,
  }));
  const rightEarProps = useAnimatedProps(() => ({
    transform: `rotate(${-ear.value} 178 74)`,
  }));
  const leftArmProps = useAnimatedProps(() => ({
    transform: `rotate(${leftArm.value} 90 160)`,
  }));
  const rightArmProps = useAnimatedProps(() => ({
    transform: `rotate(${rightArm.value} 150 160)`,
  }));
  const leftPupilProps = useAnimatedProps(() => ({ cx: 94 + pupil.value * 1.6 }));
  const rightPupilProps = useAnimatedProps(() => ({ cx: 146 - pupil.value * 1.6 }));
  const leftBlinkProps = useAnimatedProps(() => ({ ry: blink.value * 24 }));
  const rightBlinkProps = useAnimatedProps(() => ({ ry: blink.value * 24 }));

  const mouthOpenD = 'M102 136 Q120 154 138 136 Q136 160 120 164 Q104 160 102 136 Z';
  const mouthTalkD = 'M108 138 Q120 150 132 138 Q130 156 120 158 Q110 156 108 138 Z';
  const mouthClosedD = 'M108 138 Q120 148 132 138';
  const mouthProps = useAnimatedProps(() => ({
    d: mouth.value > 0.5 ? mouthTalkD : mouthClosedD,
  }));

  const happy = state.mood === 'happy' || state.mood === 'celebrate';
  const sad = state.mood === 'sad';
  const isCelebrate = state.animation === 'celebrate';

  return (
    <Pressable
      onPress={onTap ? handlePress : undefined}
      disabled={!onTap}
      testID="fox-mascot"
      accessible={Boolean(onTap || title)}
      accessibilityRole={onTap ? 'button' : title ? 'image' : undefined}
      accessibilityLabel={title ?? state.label}
      style={style}
    >
      <Animated.View style={[{ width: '100%', height: '100%' }, containerStyle]}>
        <Svg viewBox="0 0 240 240" width="100%" height="100%">
          <Defs>
            <LinearGradient id="fur" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFB067" />
              <Stop offset="1" stopColor="#F4761A" />
            </LinearGradient>
            <LinearGradient id="cream" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFDF6" />
              <Stop offset="1" stopColor="#FFE6C2" />
            </LinearGradient>
          </Defs>

          <Ellipse cx="120" cy="232" rx="68" ry="7" fill="#3F2A1D" opacity={0.09} />

          {/* Fluffy cream-tipped tail */}
          <AnimatedG animatedProps={tailProps}>
            <Path
              d="M150 190 C176 197 204 189 220 166 C233 148 233 122 220 103 C216 128 204 145 186 155 C168 165 156 176 150 190 Z"
              fill="url(#fur)"
              stroke="#4A2B1B"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <Path
              d="M220 103 C226 116 228 130 225 145 C221 133 214 124 206 118 C214 114 219 109 220 103 Z"
              fill="url(#cream)"
              stroke="#4A2B1B"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </AnimatedG>

          {/* Dark paws and feet */}
          <Ellipse cx="92" cy="224" rx="21" ry="11" fill="#4A2B1B" />
          <Ellipse cx="146" cy="224" rx="21" ry="11" fill="#4A2B1B" />
          <Path d="M80 226h8M90 229h8M100 226h8M134 226h8M144 229h8M154 226h8" stroke="#2E1A10" strokeWidth="2" strokeLinecap="round" opacity={0.7} />

          {/* Body */}
          <Ellipse cx="120" cy="184" rx="52" ry="42" fill="url(#fur)" stroke="#4A2B1B" strokeWidth="4" />
          <Path
            d="M96 156 C104 150 136 150 144 156 L150 178 L143 176 L147 198 L137 194 L132 214 L120 206 L108 214 L103 194 L93 198 L97 176 L90 178 Z"
            fill="url(#cream)"
          />

          {/* Arms */}
          <AnimatedG animatedProps={leftArmProps}>
            <Path d="M90 160 C78 150 66 136 56 122" fill="none" stroke="#F4761A" strokeWidth="20" strokeLinecap="round" />
            <Path d="M90 160 C78 150 66 136 56 122" fill="none" stroke="#4A2B1B" strokeWidth="4" strokeLinecap="round" opacity={0.35} />
            <Circle cx="52" cy="116" r="16" fill="#4A2B1B" />
            <Circle cx="45" cy="110" r="3.2" fill="#8B5A3C" />
            <Circle cx="54" cy="106" r="3.2" fill="#8B5A3C" />
            <Circle cx="62" cy="112" r="3.2" fill="#8B5A3C" />
            <Circle cx="52" cy="121" r="4.5" fill="#8B5A3C" />
          </AnimatedG>
          <AnimatedG animatedProps={rightArmProps}>
            <Path d="M150 160 C162 170 172 180 180 188" fill="none" stroke="#F4761A" strokeWidth="20" strokeLinecap="round" />
            <Path d="M150 160 C162 170 172 180 180 188" fill="none" stroke="#4A2B1B" strokeWidth="4" strokeLinecap="round" opacity={0.35} />
            <Circle cx="182" cy="192" r="15" fill="#4A2B1B" />
            <Path d="M174 190h16" stroke="#2E1A10" strokeWidth="2.4" strokeLinecap="round" opacity={0.7} />
          </AnimatedG>

          {/* Ears */}
          <AnimatedG animatedProps={leftEarProps}>
            <Path d="M50 82 L38 18 Q36 10 44 14 L86 52 Z" fill="url(#fur)" stroke="#4A2B1B" strokeWidth="4" strokeLinejoin="round" />
            <Path d="M58 70 L50 30 L78 58 Z" fill="#FFE3C6" />
          </AnimatedG>
          <AnimatedG animatedProps={rightEarProps}>
            <Path d="M190 82 L202 18 Q204 10 196 14 L154 52 Z" fill="url(#fur)" stroke="#4A2B1B" strokeWidth="4" strokeLinejoin="round" />
            <Path d="M182 70 L190 30 L162 58 Z" fill="#FFE3C6" />
          </AnimatedG>

          {/* Head */}
          <AnimatedG animatedProps={headProps}>
            <Path
              d="M120 40 C158 40 186 66 186 102 C186 134 160 154 120 154 C80 154 54 134 54 102 C54 66 82 40 120 40 Z"
              fill="url(#fur)"
              stroke="#4A2B1B"
              strokeWidth="4"
            />
            <Path d="M96 44 Q108 28 120 40 Q134 26 144 44 Q132 38 120 46 Q108 38 96 44 Z" fill="#F4761A" />

            {/* Wide cream muzzle */}
            <Path
              d="M64 106 C64 94 80 90 94 96 C104 100 112 104 120 104 C128 104 136 100 146 96 C160 90 176 94 176 106 C176 128 156 144 120 144 C84 144 64 128 64 106 Z"
              fill="url(#cream)"
              stroke="#4A2B1B"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <Path d="M52 112 L66 108 L60 120 Z" fill="url(#cream)" stroke="#4A2B1B" strokeWidth="2" strokeLinejoin="round" />
            <Path d="M188 112 L174 108 L180 120 Z" fill="url(#cream)" stroke="#4A2B1B" strokeWidth="2" strokeLinejoin="round" />

            {happy ? (
              <>
                <Circle cx="74" cy="110" r="12" fill="#FF9D8A" opacity={0.5} />
                <Circle cx="166" cy="110" r="12" fill="#FF9D8A" opacity={0.5} />
              </>
            ) : null}

            {/* Eyes */}
            <Ellipse cx="92" cy="96" rx="20" ry="24" fill="#FFFFFF" stroke="#4A2B1B" strokeWidth="3" />
            <Ellipse cx="148" cy="96" rx="20" ry="24" fill="#FFFFFF" stroke="#4A2B1B" strokeWidth="3" />
            <Circle cx={94} cy="98" r="14" fill="#7A3B16" />
            <Circle cx={146} cy="98" r="14" fill="#7A3B16" />
            <Circle cx="94" cy="98" r="7" fill="#2E1A10" />
            <Circle cx="146" cy="98" r="7" fill="#2E1A10" />
            <AnimatedCircle cx={94} cy="98" r="4" fill="#FFFFFF" animatedProps={leftPupilProps} />
            <AnimatedCircle cx={146} cy="98" r="4" fill="#FFFFFF" animatedProps={rightPupilProps} />
            <Circle cx="99" cy="106" r="2" fill="#FFFFFF" opacity={0.8} />
            <Circle cx="151" cy="106" r="2" fill="#FFFFFF" opacity={0.8} />
            <AnimatedEllipse cx="92" cy="96" rx="21" animatedProps={leftBlinkProps} fill="url(#fur)" />
            <AnimatedEllipse cx="148" cy="96" rx="21" animatedProps={rightBlinkProps} fill="url(#fur)" />

            {/* Brows */}
            <Path d="M76 68 Q92 58 108 68" fill="none" stroke="#4A2B1B" strokeWidth="5" strokeLinecap="round" />
            <Path d="M132 68 Q148 58 164 68" fill="none" stroke="#4A2B1B" strokeWidth="5" strokeLinecap="round" />

            {/* Nose + mouth */}
            <Path d="M112 120 Q120 116 128 120 Q126 130 120 132 Q114 130 112 120 Z" fill="#4A2B1B" />
            {sad ? (
              <Path d="M106 140 Q120 132 134 140" fill="none" stroke="#5C2A12" strokeWidth="4" strokeLinecap="round" />
            ) : happy ? (
              <>
                <AnimatedPath animatedProps={state.speaking ? mouthProps : {}} d={mouthOpenD} fill="#5C2A12" stroke="#4A2B1B" strokeWidth="3" strokeLinejoin="round" />
                <Path d="M110 152 Q120 147 130 152 Q126 164 120 166 Q114 164 110 152 Z" fill="#FF8F8F" />
              </>
            ) : (
              <>
                <AnimatedPath animatedProps={state.speaking ? mouthProps : {}} d={mouthClosedD} fill="none" stroke="#5C2A12" strokeWidth="4" strokeLinecap="round" />
                <Path d="M111 146 Q120 151 129 146 Q120 156 111 146 Z" fill="#FF8F8F" opacity={0.85} />
              </>
            )}
          </AnimatedG>

          {/* Teal scarf with knot and tails */}
          <G>
            <Path d="M80 150 C96 162 144 162 160 150 L168 170 C150 184 90 184 72 170 Z" fill="#159CA6" stroke="#0E6F78" strokeWidth="3" strokeLinejoin="round" />
            <Path d="M96 156 C110 164 130 164 144 156 L148 164 C132 174 108 174 92 164 Z" fill="#4ABFC7" />
            <Circle cx="160" cy="158" r="11" fill="#0E7C86" stroke="#0E6F78" strokeWidth="3" />
            <Path d="M164 162 L196 176 L186 190 L158 174 Z" fill="#159CA6" stroke="#0E6F78" strokeWidth="3" strokeLinejoin="round" />
            <Path d="M158 166 L184 198 L172 202 L152 174 Z" fill="#0E7C86" stroke="#0E6F78" strokeWidth="3" strokeLinejoin="round" />
          </G>

          {isCelebrate ? (
            <G>
              <Path d="M36 92 L40 102 L50 106 L40 110 L36 120 L32 110 L22 106 L32 102 Z" fill="#FBBF24" />
              <Path d="M204 120 L207 128 L215 131 L207 134 L204 142 L201 134 L193 131 L201 128 Z" fill="#8ADD7F" />
            </G>
          ) : null}
        </Svg>
      </Animated.View>
    </Pressable>
  );
}

export default Fox;

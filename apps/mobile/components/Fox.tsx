import React, { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, Pressable } from 'react-native';
import Svg, { Circle, Ellipse, Path, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  resolveFoxAnimation,
  foxMoodForReaction,
  type FoxMood,
  type MascotReactionId,
  type ProgressState,
} from '@speeko/core';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

export type { FoxMood };

export interface FoxProps {
  mood?: FoxMood | 'correct' | 'incorrect' | MascotReactionId;
  accessory?: ProgressState['equippedCosmetic'];
  style?: any;
  speaking?: boolean;
  listening?: boolean;
  patrol?: boolean;
  /** Normalized gaze direction (`-1..1`) for eye & subtle head tracking. */
  lookAt?: { x: number; y: number } | null;
  /** Consecutive correct answers; escalates jump energy at 3+ and 5+. */
  combo?: number;
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
 * Speeko the fox — Duolingo-inspired 60fps Reanimated SVG vector character
 * matched to `design/reference/fox-mascot-reference.png`.
 *
 * Uses spring-driven jumps with anticipation + landing squash-and-stretch,
 * dynamic ground shadow contraction, tail wags, ear twitches, glossy tracking
 * eyes, optional patrol hops, and full shop cosmetic rendering (`scarf`,
 * `hat`, `glasses`).
 */
export function Fox({
  mood = 'idle',
  accessory = null,
  style,
  speaking = false,
  listening = false,
  patrol = false,
  lookAt = null,
  combo = 0,
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
    combo,
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

  useEffect(() => {
    setTapped(false);
  }, [semanticMood, speaking, listening]);

  useEffect(() => {
    if (semanticMood !== 'sad' && semanticMood !== 'incorrect') {
      setEncouraging(false);
      return;
    }
    setEncouraging(false);
    const toEncourage = setTimeout(() => setEncouraging(true), 850);
    const back = setTimeout(() => setEncouraging(false), 2100);
    return () => {
      clearTimeout(toEncourage);
      clearTimeout(back);
    };
  }, [semanticMood]);

  useEffect(() => {
    if (!tapped) return;
    const timer = setTimeout(() => setTapped(false), 780);
    return () => clearTimeout(timer);
  }, [tapped]);

  const handlePress = useCallback(() => {
    setTapped(true);
    onTap?.();
  }, [onTap]);

  const breathe = useSharedValue(0);
  const jumpY = useSharedValue(0);
  const jumpX = useSharedValue(0);
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);
  const bodyTilt = useSharedValue(0);
  const tail = useSharedValue(0);
  const mouth = useSharedValue(0);
  const blink = useSharedValue(0);
  const head = useSharedValue(0);
  const ear = useSharedValue(0);
  const pupil = useSharedValue(0);
  const gazeX = useSharedValue(0);
  const gazeY = useSharedValue(0);
  const bandanaLag = useSharedValue(0);
  const leftArm = useSharedValue(0);
  const rightArm = useSharedValue(0);
  const sparkle = useSharedValue(0);

  const calm = useCallback(
    (value: { value: number }, target = 0) => {
      cancelAnimation(value as any);
      value.value = target;
    },
    [],
  );

  // Subtle ambient breathing
  useEffect(() => {
    if (reduceMotion) {
      calm(breathe, 0);
      return;
    }
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [reduceMotion, breathe, calm]);

  // Bushy tail wag
  useEffect(() => {
    if (reduceMotion || state.mood === 'sad') {
      calm(tail, state.mood === 'sad' ? -0.8 : 0);
      return;
    }
    const speed = state.animation === 'celebrate' || state.animation === 'bounce' ? 280 : 540;
    tail.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: speed, easing: Easing.inOut(Easing.ease) }),
        withTiming(-1, { duration: speed, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [reduceMotion, state.mood, state.animation, tail, calm]);

  // Duolingo-style anticipation crouch -> high parabolic leap -> squash-stretch landing
  useEffect(() => {
    if (reduceMotion) {
      calm(jumpY, 0);
      calm(scaleX, 1);
      calm(scaleY, 1);
      calm(bodyTilt, 0);
      calm(sparkle, state.animation === 'celebrate' ? 1 : 0);
      return;
    }

    const jumpHeight =
      state.intensity === 'ultra' ? -34 : state.intensity === 'super' ? -28 : -20;

    if (state.animation === 'celebrate') {
      jumpY.value = withRepeat(
        withSequence(
          withTiming(3, { duration: 90, easing: Easing.inOut(Easing.ease) }),
          withSpring(state.intensity === 'ultra' ? -34 : -26, { damping: 9, stiffness: 220 }),
          withTiming(2, { duration: 220, easing: Easing.in(Easing.ease) }),
          withSpring(-16, { damping: 10, stiffness: 200 }),
          withTiming(0, { duration: 220, easing: Easing.out(Easing.ease) }),
        ),
        2,
        false,
      );
      scaleX.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 90 }),
          withTiming(0.93, { duration: 200 }),
          withTiming(1.08, { duration: 110 }),
          withTiming(1, { duration: 180 }),
        ),
        2,
        false,
      );
      scaleY.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 90 }),
          withTiming(1.08, { duration: 200 }),
          withTiming(0.93, { duration: 110 }),
          withTiming(1, { duration: 180 }),
        ),
        2,
        false,
      );
      bodyTilt.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 180 }),
          withTiming(6, { duration: 200 }),
          withTiming(0, { duration: 160 }),
        ),
        2,
        false,
      );
      bandanaLag.value = withDelay(
        85,
        withRepeat(
          withSequence(
            withTiming(10, { duration: 220 }),
            withTiming(-12, { duration: 240 }),
            withTiming(0, { duration: 180 }),
          ),
          2,
          false,
        ),
      );
      sparkle.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 420, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.35, { duration: 420, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else if (state.animation === 'bounce' || state.waving) {
      jumpY.value = withSequence(
        withTiming(3.5, { duration: 85 }),
        withSpring(jumpHeight, { damping: 8, stiffness: 240 }),
        withTiming(2, { duration: 190 }),
        withSpring(0, { damping: 11, stiffness: 180 }),
      );
      bandanaLag.value = withDelay(
        85,
        withSequence(
          withTiming(11, { duration: 150 }),
          withTiming(-13, { duration: 180 }),
          withSpring(0, { damping: 10, stiffness: 180 }),
        ),
      );
      scaleX.value = withSequence(
        withTiming(1.11, { duration: 85 }),
        withTiming(0.92, { duration: 180 }),
        withTiming(1.07, { duration: 110 }),
        withTiming(1, { duration: 160 }),
      );
      scaleY.value = withSequence(
        withTiming(0.89, { duration: 85 }),
        withTiming(1.09, { duration: 180 }),
        withTiming(0.94, { duration: 110 }),
        withTiming(1, { duration: 160 }),
      );
      bodyTilt.value = withSequence(
        withTiming(state.intensity === 'normal' ? -4 : -7, { duration: 160 }),
        withTiming(state.intensity === 'normal' ? 4 : 6, { duration: 160 }),
        withTiming(0, { duration: 160 }),
      );
      sparkle.value = withSequence(withTiming(1, { duration: 220 }), withTiming(0, { duration: 650 }));
    } else if (state.animation === 'confused') {
      jumpY.value = withSequence(
        withTiming(4, { duration: 180 }),
        withTiming(0, { duration: 300 }),
      );
      bodyTilt.value = withSequence(
        withTiming(-5, { duration: 220 }),
        withTiming(3, { duration: 220 }),
        withTiming(0, { duration: 240 }),
      );
      scaleX.value = withTiming(1, { duration: 180 });
      scaleY.value = withTiming(0.96, { duration: 220 });
      bandanaLag.value = withTiming(0, { duration: 180 });
      sparkle.value = withTiming(0, { duration: 150 });
    } else {
      jumpY.value = withTiming(0, { duration: 180 });
      scaleX.value = withTiming(1, { duration: 180 });
      scaleY.value = withTiming(1, { duration: 180 });
      bodyTilt.value = withTiming(0, { duration: 180 });
      bandanaLag.value = withTiming(0, { duration: 180 });
      sparkle.value = withTiming(0, { duration: 150 });
    }
  }, [
    reduceMotion,
    state.animation,
    state.waving,
    state.intensity,
    jumpY,
    scaleX,
    scaleY,
    bodyTilt,
    bandanaLag,
    sparkle,
    calm,
  ]);

  // Smooth spring eye & subtle head tracking when learner explores options
  useEffect(() => {
    if (reduceMotion) {
      calm(gazeX, 0);
      calm(gazeY, 0);
      return;
    }
    const nx = lookAt ? Math.max(-1, Math.min(1, lookAt.x)) : 0;
    const ny = lookAt ? Math.max(-1, Math.min(1, lookAt.y)) : 0;
    gazeX.value = withSpring(nx, { damping: 14, stiffness: 180 });
    gazeY.value = withSpring(ny, { damping: 14, stiffness: 180 });
  }, [reduceMotion, lookAt, gazeX, gazeY, calm]);

  // Optional lively patrol hop across header/welcome banners
  useEffect(() => {
    if (reduceMotion || !patrol || state.animation === 'confused') {
      calm(jumpX, 0);
      return;
    }
    jumpX.value = withRepeat(
      withSequence(
        withDelay(1400, withTiming(12, { duration: 420, easing: Easing.out(Easing.ease) })),
        withDelay(900, withTiming(-10, { duration: 540, easing: Easing.inOut(Easing.ease) })),
        withDelay(900, withTiming(0, { duration: 420, easing: Easing.out(Easing.ease) })),
      ),
      -1,
      false,
    );
  }, [reduceMotion, patrol, state.animation, jumpX, calm]);

  // Head + ear + eye pupil expression
  useEffect(() => {
    if (reduceMotion) {
      calm(head, 0);
      calm(ear, 0);
      calm(pupil, 0);
      return;
    }
    if (state.listening) {
      head.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 760, easing: Easing.inOut(Easing.ease) }),
          withTiming(2.5, { duration: 760, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
      ear.value = withRepeat(
        withSequence(
          withTiming(9, { duration: 440 }),
          withTiming(-3, { duration: 440 }),
        ),
        -1,
        true,
      );
      pupil.value = withTiming(1.2, { duration: 280 });
    } else if (state.animation === 'confused') {
      head.value = withSequence(
        withTiming(-7, { duration: 240 }),
        withTiming(5, { duration: 260 }),
        withTiming(-3, { duration: 260 }),
      );
      ear.value = withTiming(-14, { duration: 280 });
      pupil.value = withTiming(-1.4, { duration: 240 });
    } else if (state.mood === 'encouraging') {
      head.value = withRepeat(
        withSequence(
          withTiming(3.5, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        ),
        2,
        false,
      );
      ear.value = withTiming(4, { duration: 280 });
      pupil.value = withTiming(0, { duration: 260 });
    } else if (state.mood === 'happy' || state.animation === 'celebrate') {
      head.value = withSequence(
        withTiming(-3, { duration: 200 }),
        withTiming(3, { duration: 220 }),
        withTiming(0, { duration: 220 }),
      );
      ear.value = withDelay(
        65,
        withSequence(
          withTiming(12, { duration: 200 }),
          withTiming(4, { duration: 240 }),
        ),
      );
      pupil.value = withTiming(0, { duration: 200 });
    } else {
      head.value = withTiming(0, { duration: 300 });
      ear.value = withRepeat(
        withSequence(
          withDelay(2400, withTiming(7, { duration: 150 })),
          withTiming(0, { duration: 220 }),
        ),
        -1,
        false,
      );
      pupil.value = withRepeat(
        withSequence(
          withDelay(2200, withTiming(1.1, { duration: 450 })),
          withDelay(900, withTiming(-1.1, { duration: 550 })),
          withDelay(900, withTiming(0, { duration: 450 })),
        ),
        -1,
        false,
      );
    }
  }, [reduceMotion, state.listening, state.animation, state.mood, head, ear, pupil, calm]);

  // Natural blinking + mouth movement when speaking
  useEffect(() => {
    if (reduceMotion) {
      calm(mouth, 0);
      calm(blink, 0);
      return;
    }
    if (state.speaking) {
      mouth.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 150 }),
          withTiming(0.2, { duration: 130 }),
        ),
        -1,
        true,
      );
    } else {
      mouth.value = withTiming(0, { duration: 160 });
    }

    blink.value = withRepeat(
      withSequence(
        withDelay(2700, withTiming(1, { duration: 80 })),
        withTiming(0, { duration: 95 }),
      ),
      -1,
      false,
    );
  }, [reduceMotion, state.speaking, mouth, blink, calm]);

  // Expressive arms (waving, both raised in victory, slumped when sad)
  useEffect(() => {
    const happyJump = state.waving || state.animation === 'celebrate' || state.animation === 'bounce';
    if (reduceMotion) {
      calm(leftArm, happyJump ? -24 : 0);
      calm(rightArm, state.animation === 'celebrate' ? 88 : 0);
      return;
    }
    if (happyJump) {
      leftArm.value = withSequence(
        withTiming(-28, { duration: 180, easing: Easing.out(Easing.ease) }),
        withTiming(8, { duration: 170, easing: Easing.inOut(Easing.ease) }),
        withTiming(-24, { duration: 170, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 280, easing: Easing.inOut(Easing.ease) }),
      );
      rightArm.value = withSequence(
        withTiming(-78, { duration: 200, easing: Easing.out(Easing.ease) }),
        withTiming(-58, { duration: 180, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 320, easing: Easing.inOut(Easing.ease) }),
      );
    } else if (state.mood === 'sad') {
      leftArm.value = withTiming(18, { duration: 260 });
      rightArm.value = withTiming(-10, { duration: 260 });
    } else {
      leftArm.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
          withTiming(3, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
      rightArm.value = withTiming(0, { duration: 260 });
    }
  }, [reduceMotion, state.waving, state.animation, state.mood, leftArm, rightArm, calm]);

  const containerStyle = useAnimatedStyle(() => {
    if (reduceMotion) return {};
    return {
      transform: [
        { translateX: jumpX.value },
        { translateY: breathe.value * -2.2 + jumpY.value },
        { rotate: `${bodyTilt.value}deg` },
        { scaleX: scaleX.value + breathe.value * 0.008 },
        { scaleY: scaleY.value + breathe.value * 0.008 },
      ],
    };
  });

  // Ground shadow reacts smoothly when fox jumps into air
  const shadowProps = useAnimatedProps(() => {
    const lift = Math.max(0, -jumpY.value);
    const shrink = Math.max(0.55, 1 - lift / 55);
    return {
      rx: 64 * shrink,
      opacity: Math.max(0.06, 0.17 * shrink),
    };
  });

  const tailProps = useAnimatedProps(() => ({
    transform: `rotate(${tail.value * 8} 152 188)`,
  }));
  const headProps = useAnimatedProps(() => ({
    transform: `rotate(${head.value + gazeX.value * 3.4} 120 144)`,
  }));
  const bandanaProps = useAnimatedProps(() => ({
    transform: `rotate(${bandanaLag.value} 150 147)`,
  }));
  const leftEarProps = useAnimatedProps(() => ({
    transform: `rotate(${ear.value} 72 68)`,
  }));
  const rightEarProps = useAnimatedProps(() => ({
    transform: `rotate(${-ear.value} 168 68)`,
  }));
  const leftArmProps = useAnimatedProps(() => ({
    transform: `rotate(${leftArm.value} 86 154)`,
  }));
  const rightArmProps = useAnimatedProps(() => ({
    transform: `rotate(${rightArm.value} 148 156)`,
  }));
  const eyeGazeProps = useAnimatedProps(() => ({
    transform: `translate(${pupil.value * 1.8 + gazeX.value * 3.8} ${gazeY.value * 2.8})`,
  }));
  const leftBlinkProps = useAnimatedProps(() => ({ ry: blink.value * 24 }));
  const rightBlinkProps = useAnimatedProps(() => ({ ry: blink.value * 24 }));
  const sparkleProps = useAnimatedProps(() => ({ opacity: sparkle.value }));

  const mouthTalkProps = useAnimatedProps(() => ({
    transform: `scale(1 ${0.78 + mouth.value * 0.35}) translate(0 ${mouth.value * -2})`,
  }));

  const happy = state.mood === 'happy' || state.mood === 'celebrate' || state.mood === 'encouraging';
  const sad = state.mood === 'sad';
  const scarfMode = accessory === 'scarf' ? 'green' : 'teal';

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
            <LinearGradient id="mobFoxFur" x1="0" y1="0" x2="0.2" y2="1">
              <Stop offset="0" stopColor="#FF8124" />
              <Stop offset="0.6" stopColor="#FA640D" />
              <Stop offset="1" stopColor="#E14B00" />
            </LinearGradient>
            <LinearGradient id="mobFoxCream" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFF5E6" />
              <Stop offset="1" stopColor="#FCDAB0" />
            </LinearGradient>
            <LinearGradient id="mobFoxEar" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FBE0C4" />
              <Stop offset="1" stopColor="#F0BC90" />
            </LinearGradient>
          </Defs>

          {/* Dynamic ground shadow */}
          <AnimatedEllipse cx="122" cy="231" ry="7.5" fill="#2A1208" animatedProps={shadowProps} />

          {/* Bushy orange + jagged cream-tip tail */}
          <AnimatedG animatedProps={tailProps}>
            <Path
              d="M148 188 C178 198 208 186 222 158 C234 132 230 98 214 82 C202 74 180 86 168 110 C158 130 156 164 148 188 Z"
              fill="url(#mobFoxFur)"
              stroke="#3B170A"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            <Path
              d="M214 82 C226 94 231 112 228 130 L214 118 L206 130 L195 117 L184 128 C189 102 200 84 214 82 Z"
              fill="url(#mobFoxCream)"
              stroke="#3B170A"
              strokeWidth="2.8"
              strokeLinejoin="round"
            />
          </AnimatedG>

          {/* Legs & dark chocolate boots */}
          <Path
            d="M84 188 C78 202 79 218 82 224 C86 228 106 228 108 221 C110 214 108 196 106 186 Z"
            fill="url(#mobFoxFur)"
            stroke="#3B170A"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <Path
            d="M134 186 C132 198 134 216 136 223 C139 229 162 229 164 221 C166 213 160 198 154 188 Z"
            fill="url(#mobFoxFur)"
            stroke="#3B170A"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Left & right paws */}
          <Path
            d="M80 206 C86 202 98 202 106 208 L108 222 C108 230 74 232 70 223 C67 217 73 210 80 206 Z"
            fill="#4A1C0E"
            stroke="#2A1008"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          <Path
            d="M136 208 C144 202 154 202 161 206 C168 210 175 217 172 224 C168 232 136 230 136 222 Z"
            fill="#4A1C0E"
            stroke="#2A1008"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />

          {/* Torso & fluffy cream chest patch */}
          <Path
            d="M86 146 C86 138 154 138 154 146 C158 172 154 202 120 204 C86 202 82 172 86 146 Z"
            fill="url(#mobFoxFur)"
            stroke="#3B170A"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <Path
            d="M100 150 L140 150 C142 162 146 168 139 172 L144 185 L134 183 L128 199 L120 191 L112 199 L106 183 L96 185 L101 172 C94 168 98 162 100 150 Z"
            fill="url(#mobFoxCream)"
          />

          {/* Waving left arm + raised dark paw with pads (reference pose) */}
          <AnimatedG animatedProps={leftArmProps}>
            <Path
              d="M86 154 C72 154 58 144 50 128"
              fill="none"
              stroke="#3B170A"
              strokeWidth="22"
              strokeLinecap="round"
            />
            <Path
              d="M86 154 C72 154 58 144 50 128"
              fill="none"
              stroke="url(#mobFoxFur)"
              strokeWidth="15.5"
              strokeLinecap="round"
            />
            <Circle cx="46" cy="122" r="16" fill="#4A1C0E" stroke="#2A1008" strokeWidth="3.2" />
            <Circle cx="36" cy="109" r="4.5" fill="#4A1C0E" stroke="#2A1008" strokeWidth="2.4" />
            <Circle cx="44" cy="105" r="4.5" fill="#4A1C0E" stroke="#2A1008" strokeWidth="2.4" />
            <Circle cx="54" cy="107" r="4.5" fill="#4A1C0E" stroke="#2A1008" strokeWidth="2.4" />
            <Circle cx="61" cy="114" r="4.5" fill="#4A1C0E" stroke="#2A1008" strokeWidth="2.4" />
            <Ellipse cx="46" cy="124" rx="6" ry="5" fill="#8C5341" />
            <Circle cx="38" cy="112" r="2" fill="#8C5341" />
            <Circle cx="45" cy="109" r="2" fill="#8C5341" />
            <Circle cx="53" cy="111" r="2" fill="#8C5341" />
          </AnimatedG>

          {/* Right arm on hip / raises on celebration */}
          <AnimatedG animatedProps={rightArmProps}>
            <Path
              d="M148 156 C164 162 170 174 160 184"
              fill="none"
              stroke="#3B170A"
              strokeWidth="22"
              strokeLinecap="round"
            />
            <Path
              d="M148 156 C164 162 170 174 160 184"
              fill="none"
              stroke="url(#mobFoxFur)"
              strokeWidth="15.5"
              strokeLinecap="round"
            />
            <Circle cx="155" cy="186" r="14" fill="#4A1C0E" stroke="#2A1008" strokeWidth="3.2" />
          </AnimatedG>

          {/* Bandana / Shop green knit scarf */}
          {scarfMode === 'green' ? (
            <G>
              <Path
                d="M84 139 C104 150 136 150 156 139 L161 154 C140 165 100 165 79 154 Z"
                fill="#16A34A"
                stroke="#14532D"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <Path d="M90 147 C110 154 130 154 150 147" fill="none" stroke="#86EFAC" strokeWidth="3" strokeLinecap="round" />
              <AnimatedG animatedProps={bandanaProps}>
                <Path d="M138 148 L164 176 L146 184 L130 158 Z" fill="#15803D" stroke="#14532D" strokeWidth="3" strokeLinejoin="round" />
              </AnimatedG>
              <Path d="M100 156 L120 178 L142 156 Z" fill="#22C55E" stroke="#14532D" strokeWidth="3" strokeLinejoin="round" />
            </G>
          ) : (
            <G>
              <Path
                d="M88 139 C104 148 136 148 152 139 L154 150 L120 176 L86 150 Z"
                fill="#009BAE"
                stroke="#094854"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <Path d="M94 146 L120 168 L146 146" fill="none" stroke="#1CC4D8" strokeWidth="2.5" strokeLinecap="round" opacity={0.7} />
              <AnimatedG animatedProps={bandanaProps}>
                <Path
                  d="M148 143 C162 141 178 146 184 154 L166 156 L176 169 L154 162 Z"
                  fill="#008C9E"
                  stroke="#094854"
                  strokeWidth="2.8"
                  strokeLinejoin="round"
                />
                <Circle cx="150" cy="147" r="7" fill="#007C8E" stroke="#094854" strokeWidth="2.6" />
              </AnimatedG>
            </G>
          )}

          {/* Ears + dark brown tips + fluffy inner fur */}
          <AnimatedG animatedProps={leftEarProps}>
            <Path
              d="M60 88 C50 62 50 30 58 20 C68 18 92 34 102 58 Z"
              fill="url(#mobFoxFur)"
              stroke="#3B170A"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            <Path d="M52 44 C52 30 54 22 58 20 C66 18 78 24 88 34 L74 36 L65 30 L60 41 Z" fill="#3B170A" />
            <Path d="M68 82 C60 62 60 44 64 36 C74 38 86 50 92 64 L80 62 L75 74 Z" fill="url(#mobFoxEar)" />
          </AnimatedG>
          <AnimatedG animatedProps={rightEarProps}>
            <Path
              d="M180 88 C190 62 190 30 182 20 C172 18 148 34 138 58 Z"
              fill="url(#mobFoxFur)"
              stroke="#3B170A"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            <Path d="M188 44 C188 30 186 22 182 20 C174 18 162 24 152 34 L166 36 L175 30 L180 41 Z" fill="#3B170A" />
            <Path d="M172 82 C180 62 180 44 176 36 C166 38 154 50 148 64 L160 62 L165 74 Z" fill="url(#mobFoxEar)" />
          </AnimatedG>

          {/* Animated Head */}
          <AnimatedG animatedProps={headProps}>
            {/* Rounded fox cranium */}
            <Path
              d="M120 42 C158 42 182 66 182 96 C182 128 154 146 120 146 C86 146 58 128 58 96 C58 66 82 42 120 42 Z"
              fill="url(#mobFoxFur)"
              stroke="#3B170A"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            {/* Forehead hair tuft */}
            <Path
              d="M104 45 C106 32 114 28 119 37 C124 27 134 30 135 42 C127 38 116 42 104 45 Z"
              fill="#FF8124"
              stroke="#3B170A"
              strokeWidth="2.8"
              strokeLinejoin="round"
            />

            {/* Fluffy double-spiked cream cheeks */}
            <Path
              d="M58 98 L45 104 L57 110 L50 116 C64 132 90 146 120 146 C150 146 176 132 190 116 L183 110 L195 104 L182 98 C168 100 156 108 140 106 C131 104 126 100 120 100 C114 100 109 104 100 106 C84 108 72 100 58 98 Z"
              fill="url(#mobFoxCream)"
              stroke="#3B170A"
              strokeWidth="3.3"
              strokeLinejoin="round"
            />

            {happy ? (
              <>
                <Ellipse cx="75" cy="115" rx="9" ry="5" fill="#FF8C7A" opacity={0.45} />
                <Ellipse cx="165" cy="115" rx="9" ry="5" fill="#FF8C7A" opacity={0.45} />
              </>
            ) : null}

            {/* Glossy eyes matching reference */}
            <Ellipse cx="96" cy="91" rx="16.5" ry="20" fill="#FFFFFF" stroke="#3B170A" strokeWidth="3.2" />
            <Ellipse cx="144" cy="91" rx="16.5" ry="20" fill="#FFFFFF" stroke="#3B170A" strokeWidth="3.2" />
            <AnimatedG animatedProps={eyeGazeProps}>
              <Circle cx="97" cy="92" r="12.5" fill="#3A180B" />
              <Circle cx="143" cy="92" r="12.5" fill="#3A180B" />
              <Circle cx="97" cy="93" r="6.5" fill="#180A05" />
              <Circle cx="143" cy="93" r="6.5" fill="#180A05" />
              <Circle cx="102" cy="84" r="4.5" fill="#FFFFFF" />
              <Circle cx="148" cy="84" r="4.5" fill="#FFFFFF" />
              <Circle cx="93" cy="98" r="2.2" fill="#FFFFFF" opacity={0.85} />
              <Circle cx="139" cy="98" r="2.2" fill="#FFFFFF" opacity={0.85} />
            </AnimatedG>
            <AnimatedEllipse cx="96" cy="91" rx="18" animatedProps={leftBlinkProps} fill="#FA640D" />
            <AnimatedEllipse cx="144" cy="91" rx="18" animatedProps={rightBlinkProps} fill="#FA640D" />

            {/* Eyebrows */}
            {sad ? (
              <>
                <Path d="M81 66 Q94 69 107 62" fill="none" stroke="#3B170A" strokeWidth="4.2" strokeLinecap="round" />
                <Path d="M133 62 Q146 69 159 66" fill="none" stroke="#3B170A" strokeWidth="4.2" strokeLinecap="round" />
              </>
            ) : (
              <>
                <Path d="M80 65 Q95 57 109 64" fill="none" stroke="#3B170A" strokeWidth="4.5" strokeLinecap="round" />
                <Path d="M131 64 Q145 57 160 65" fill="none" stroke="#3B170A" strokeWidth="4.5" strokeLinecap="round" />
              </>
            )}

            {/* Glasses cosmetic */}
            {accessory === 'glasses' ? (
              <G>
                <Circle cx="96" cy="91" r="20" fill="none" stroke="#1E293B" strokeWidth="3.5" />
                <Circle cx="144" cy="91" r="20" fill="none" stroke="#1E293B" strokeWidth="3.5" />
                <Path d="M116 90 Q120 87 124 90" fill="none" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
              </G>
            ) : null}

            {/* Party hat perched cleanly atop head inside 0..240 bounds */}
            {accessory === 'hat' ? (
              <G>
                <Path d="M98 46 L120 10 L142 46 Z" fill="#1CB0F6" stroke="#0B4A6F" strokeWidth="3" strokeLinejoin="round" />
                <Path d="M107 34 L133 34" stroke="#FCD34D" strokeWidth="5" strokeLinecap="round" />
                <Circle cx="120" cy="9" r="5.5" fill="#FDE047" stroke="#0B4A6F" strokeWidth="2.5" />
              </G>
            ) : null}

            {/* Nose + cheerful mouth & tongue */}
            <Path
              d="M111 108 C115 105 125 105 129 108 C129 114 123 117 120 117 C117 117 111 114 111 108 Z"
              fill="#3B170A"
            />
            {sad ? (
              <Path d="M110 131 Q120 124 130 131" fill="none" stroke="#3B170A" strokeWidth="3.4" strokeLinecap="round" />
            ) : (
              <AnimatedG animatedProps={mouthTalkProps}>
                <Path
                  d="M104 122 Q120 130 136 122 C135 136 128 141 120 141 C112 141 105 136 104 122 Z"
                  fill="#66141A"
                  stroke="#3B170A"
                  strokeWidth="2.8"
                  strokeLinejoin="round"
                />
                <Path d="M112 132 Q120 128 128 132 Q124 139 120 139 Q116 139 112 132 Z" fill="#FA7268" />
              </AnimatedG>
            )}
          </AnimatedG>

          {/* Celebratory jump sparkles */}
          <AnimatedG animatedProps={sparkleProps}>
            <Path d="M30 56 L33 65 L42 68 L33 71 L30 80 L27 71 L18 68 L27 65 Z" fill="#FBBF24" />
            <Path d="M210 56 L213 65 L222 68 L213 71 L210 80 L207 71 L198 68 L207 65 Z" fill="#58CC02" />
            <Circle cx="44" cy="40" r="4" fill="#38BDF8" />
            <Circle cx="198" cy="42" r="4" fill="#FBBF24" />
            {state.intensity !== 'normal' ? (
              <>
                <Path d="M120 12 L123 20 L131 23 L123 26 L120 34 L117 26 L109 23 L117 20 Z" fill="#FBBF24" />
                <Circle cx="24" cy="94" r="4.5" fill="#58CC02" />
                <Circle cx="216" cy="94" r="4.5" fill="#38BDF8" />
              </>
            ) : null}
          </AnimatedG>
        </Svg>
      </Animated.View>
    </Pressable>
  );
}

export default Fox;

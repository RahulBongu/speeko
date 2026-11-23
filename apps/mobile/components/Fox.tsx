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
  type MascotReactionId,
} from '@speeko/core';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type { FoxMood } from '@speeko/core';
import type { FoxMood } from '@speeko/core';

export interface FoxProps {
  mood?: FoxMood | 'correct' | 'incorrect' | MascotReactionId;
  style?: any;
  speaking?: boolean;
  listening?: boolean;
  title?: string;
  /** Called after a tap; the mascot also plays a short wave. */
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
 * Speeko, the mascot — vector version for mobile.
 *
 * The artwork is split into independently animated groups (head, ears, eye
 * highlights, mouth, arms, tail, feet). App events are mapped by
 * `resolveFoxAnimation` in core so web and mobile stay in sync. No paid rig or
 * animation service is used; reduced-motion users see a still vector.
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

  useEffect(() => {
    setTapped(false);
  }, [semanticMood, speaking, listening]);

  // Confused reaction → supportive nod, then back to the caller's mood.
  useEffect(() => {
    if (semanticMood !== 'sad' && semanticMood !== 'incorrect') {
      setEncouraging(false);
      return;
    }
    setEncouraging(false);
    const toEncourage = setTimeout(() => setEncouraging(true), 900);
    const back = setTimeout(() => setEncouraging(false), 2200);
    return () => {
      clearTimeout(toEncourage);
      clearTimeout(back);
    };
  }, [semanticMood]);

  useEffect(() => {
    if (!tapped) return;
    const timer = setTimeout(() => setTapped(false), 700);
    return () => clearTimeout(timer);
  }, [tapped]);

  const handlePress = useCallback(() => {
    setTapped(true);
    onTap?.();
  }, [onTap]);

  const breathe = useSharedValue(0);
  const hop = useSharedValue(0);
  const dance = useSharedValue(0);
  const tail = useSharedValue(0);
  const mouth = useSharedValue(0);
  const blink = useSharedValue(0);
  const head = useSharedValue(0);
  const ear = useSharedValue(0);
  const pupil = useSharedValue(0);
  const leftArm = useSharedValue(-4);
  const rightArm = useSharedValue(4);

  const calm = (value: any, target = 0) => {
    if (reduceMotion) value.value = target;
  };

  useEffect(() => {
    if (reduceMotion) {
      calm(breathe, 0);
      return;
    }
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2100, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2100, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [reduceMotion, breathe]);

  useEffect(() => {
    if (reduceMotion || state.mood === 'sad') {
      calm(tail, 0);
      return;
    }
    tail.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 550, easing: Easing.inOut(Easing.ease) }),
        withTiming(-1, { duration: 550, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [reduceMotion, state.mood, tail]);

  useEffect(() => {
    if (reduceMotion) {
      calm(hop, 0);
      calm(dance, 0);
      return;
    }
    if (state.animation === 'celebrate') {
      dance.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(-1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
      hop.value = withTiming(0, { duration: 100 });
    } else {
      dance.value = withTiming(0, { duration: 200 });
      if (state.animation === 'bounce') {
        hop.value = withSequence(
          withTiming(1, { duration: 380, easing: Easing.out(Easing.back(1.6)) }),
          withTiming(0, { duration: 380, easing: Easing.in(Easing.ease) }),
        );
      } else {
        hop.value = withTiming(0, { duration: 200 });
      }
    }
  }, [reduceMotion, state.animation, hop, dance]);

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
          withTiming(-2, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(2, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
      ear.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 1200 }),
          withTiming(0, { duration: 1200 }),
        ),
        -1,
        true,
      );
      pupil.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1200 }),
          withTiming(-1, { duration: 1200 }),
        ),
        -1,
        true,
      );
    } else {
      head.value = withTiming(0, { duration: 250 });
      ear.value = withTiming(0, { duration: 250 });
      pupil.value = withTiming(0, { duration: 250 });
    }
  }, [reduceMotion, state.listening, head, ear, pupil]);

  useEffect(() => {
    if (reduceMotion) {
      calm(mouth, 0);
      return;
    }
    if (state.speaking) {
      mouth.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 180, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 180, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else {
      mouth.value = withTiming(0, { duration: 120 });
    }
  }, [reduceMotion, state.speaking, mouth]);

  useEffect(() => {
    if (reduceMotion || state.speaking) {
      calm(blink, 0);
      return;
    }
    const timer = setInterval(() => {
      blink.value = withSequence(
        withTiming(1, { duration: 120, easing: Easing.in(Easing.ease) }),
        withTiming(0, { duration: 120, easing: Easing.out(Easing.ease) }),
      );
    }, 3500);
    return () => clearInterval(timer);
  }, [reduceMotion, state.speaking, blink]);

  useEffect(() => {
    const wavePose = state.waving || state.animation === 'celebrate';
    if (reduceMotion) {
      calm(leftArm, wavePose ? 104 : -4);
      calm(rightArm, state.animation === 'celebrate' ? -104 : 4);
      return;
    }
    if (wavePose) {
      leftArm.value = withRepeat(
        withSequence(
          withTiming(96, { duration: 320 }),
          withTiming(124, { duration: 320 }),
        ),
        -1,
        true,
      );
    } else if (state.mood === 'sad') {
      leftArm.value = withTiming(10, { duration: 250 });
    } else {
      leftArm.value = withTiming(-4, { duration: 250 });
    }

    if (state.animation === 'celebrate') {
      rightArm.value = withRepeat(
        withSequence(
          withTiming(-96, { duration: 320 }),
          withTiming(-124, { duration: 320 }),
        ),
        -1,
        true,
      );
    } else if (state.mood === 'sad') {
      rightArm.value = withTiming(-10, { duration: 250 });
    } else {
      rightArm.value = withTiming(4, { duration: 250 });
    }
  }, [reduceMotion, state.waving, state.animation, state.mood, leftArm, rightArm]);

  const containerStyle = useAnimatedStyle(() => {
    if (reduceMotion) return {};
    return {
      transform: [
        { translateY: breathe.value * -2.5 + hop.value * -14 + dance.value * -6 },
        { rotate: `${dance.value * 4}deg` },
        { scale: 1 + breathe.value * 0.008 + hop.value * 0.02 },
      ],
    };
  });

  const tailProps = useAnimatedProps(() => ({
    rotation: tail.value * 6,
    originX: 150,
    originY: 198,
  }));
  const headProps = useAnimatedProps(() => ({ rotation: head.value, originX: 120, originY: 150 }));
  const leftEarProps = useAnimatedProps(() => ({ rotation: ear.value, originX: 76, originY: 74 }));
  const rightEarProps = useAnimatedProps(() => ({ rotation: -ear.value, originX: 164, originY: 74 }));
  const leftPupilProps = useAnimatedProps(() => ({ cx: 99 + pupil.value * 1.5 }));
  const rightPupilProps = useAnimatedProps(() => ({ cx: 147 - pupil.value * 1.5 }));
  const leftArmProps = useAnimatedProps(() => ({
    rotation: leftArm.value,
    originX: 84,
    originY: 164,
  }));
  const rightArmProps = useAnimatedProps(() => ({
    rotation: rightArm.value,
    originX: 156,
    originY: 164,
  }));
  const leftBlinkProps = useAnimatedProps(() => ({ ry: blink.value * 10.5 }));
  const rightBlinkProps = useAnimatedProps(() => ({ ry: blink.value * 10.5 }));

  const mouthOpenD = state.mood === 'happy' ? 'M101 133q19 26 38 0Z' : 'M101 133q19 26 38 0Z';
  const mouthClosedD = 'M106 137q14 10 28 0';
  const mouthProps = useAnimatedProps(() => ({ d: mouth.value > 0.5 ? mouthOpenD : mouthClosedD }));

  const happy = state.mood === 'happy' || state.mood === 'celebrate';
  const sad = state.mood === 'sad';
  const celebrate = state.animation === 'celebrate';

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={title ?? state.label}
      style={style}
    >
      <Animated.View style={[{ width: '100%', height: '100%' }, containerStyle]}>
        <Svg viewBox="0 0 240 240" width="100%" height="100%">
          <Defs>
            <LinearGradient id="fur" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#ffa567" />
              <Stop offset="1" stopColor="#ef6a1c" />
            </LinearGradient>
            <LinearGradient id="belly" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#fff8ee" />
              <Stop offset="1" stopColor="#ffe8cf" />
            </LinearGradient>
            <LinearGradient id="tailtip" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#ffd9bd" />
              <Stop offset="1" stopColor="#fff6ea" />
            </LinearGradient>
          </Defs>

          <Ellipse cx="120" cy="225" rx="66" ry="8.5" fill="#3b2a1f" opacity={0.09} />

          <Ellipse cx="98" cy="218" rx="18" ry="11" fill="url(#fur)" stroke="#a8420f" strokeWidth="3" />
          <Path d="M87 219h7M96 221h7M105 219h6" stroke="#a8420f" strokeWidth="2.2" strokeLinecap="round" opacity={0.55} />
          <Ellipse cx="142" cy="218" rx="18" ry="11" fill="url(#fur)" stroke="#a8420f" strokeWidth="3" />
          <Path d="M129 219h6M138 221h7M147 219h7" stroke="#a8420f" strokeWidth="2.2" strokeLinecap="round" opacity={0.55} />

          <AnimatedG animatedProps={tailProps}>
            <Path
              d="M150 198c36 8 62-13 68-50 2-14 0-27-6-38-7 19-17 31-33 39-15 8-24 20-27 35Z"
              fill="url(#fur)"
              stroke="#a8420f"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <Path
              d="M211 110c6 11 8 24 6 38-2 14-7 26-16 34 9-5 16-17 19-32 3-15 0-29-9-40Z"
              fill="url(#tailtip)"
            />
          </AnimatedG>

          <Ellipse cx="120" cy="181" rx="52" ry="43" fill="url(#fur)" stroke="#a8420f" strokeWidth="3" />
          <Ellipse cx="120" cy="190" rx="34" ry="28" fill="url(#belly)" />

          <AnimatedG animatedProps={leftArmProps}>
            <Path d="M84 164c-9 9-16 19-19 30" fill="none" stroke="#a8420f" strokeWidth="18" strokeLinecap="round" opacity={0.18} />
            <Circle cx="64" cy="194" r="10.5" fill="url(#fur)" stroke="#a8420f" strokeWidth="3" />
            <Path d="M59 199h11" stroke="#a8420f" strokeWidth="2" strokeLinecap="round" opacity={0.5} />
          </AnimatedG>
          <AnimatedG animatedProps={rightArmProps}>
            <Path d="M156 164c9 9 16 19 19 30" fill="none" stroke="#a8420f" strokeWidth="18" strokeLinecap="round" opacity={0.18} />
            <Circle cx="176" cy="194" r="10.5" fill="url(#fur)" stroke="#a8420f" strokeWidth="3" />
            <Path d="M171 199h11" stroke="#a8420f" strokeWidth="2" strokeLinecap="round" opacity={0.5} />
          </AnimatedG>

          <AnimatedG animatedProps={leftEarProps}>
            <Path d="M54 83 66 23q2-7 9-2l25 35Z" fill="url(#fur)" stroke="#a8420f" strokeWidth="3" strokeLinejoin="round" />
            <Path d="M69 69 76 39l16 20Z" fill="#ffc3a1" />
          </AnimatedG>
          <AnimatedG animatedProps={rightEarProps}>
            <Path d="M186 83 174 23q-2-7-9-2l-25 35Z" fill="url(#fur)" stroke="#a8420f" strokeWidth="3" strokeLinejoin="round" />
            <Path d="M171 69 164 39l-16 20Z" fill="#ffc3a1" />
          </AnimatedG>

          <AnimatedG animatedProps={headProps}>
            <Ellipse cx="120" cy="108" rx="66" ry="58" fill="url(#fur)" stroke="#a8420f" strokeWidth="3" />

            <Path d="M78 150c13 10 27 15 42 15s29-5 42-15l7 21c-15 10-31 15-49 15s-34-5-49-15Z" fill="#37b02c" />
            <Path d="M78 150c13 10 27 15 42 15s29-5 42-15l2 6c-14 10-28 15-44 15s-30-5-44-15Z" fill="#58c94d" />
            <Circle cx="120" cy="171" r="8.5" fill="#269020" />

            <Ellipse cx="120" cy="134" rx="39" ry="30" fill="url(#belly)" />

            {happy ? (
              <>
                <Circle cx="76" cy="124" r="15" fill="#ff9d8a" opacity={0.62} />
                <Circle cx="164" cy="124" r="15" fill="#ff9d8a" opacity={0.62} />
              </>
            ) : null}

            {happy ? (
              <>
                <Path d="M85 103q11-14 22 0" fill="none" stroke="#2d1f18" strokeWidth="5" strokeLinecap="round" />
                <Path d="M133 103q11-14 22 0" fill="none" stroke="#2d1f18" strokeWidth="5" strokeLinecap="round" />
              </>
            ) : (
              <>
                <Ellipse cx="96" cy="101" rx="8.5" ry="10.5" fill="#2d1f18" />
                <AnimatedCircle cx={99} cy="97.5" r="2.7" fill="#fff8ee" animatedProps={leftPupilProps} />
                <Ellipse cx="144" cy="101" rx="8.5" ry="10.5" fill="#2d1f18" />
                <AnimatedCircle cx={147} cy="97.5" r="2.7" fill="#fff8ee" animatedProps={rightPupilProps} />
                <AnimatedEllipse cx="96" cy="101" rx="9" animatedProps={leftBlinkProps} fill="#ffa567" />
                <AnimatedEllipse cx="144" cy="101" rx="9" animatedProps={rightBlinkProps} fill="#ffa567" />
                {sad ? (
                  <>
                    <Path d="M84 86l21 7" fill="none" stroke="#8a3a12" strokeWidth="3.4" strokeLinecap="round" />
                    <Path d="M156 86l-21 7" fill="none" stroke="#8a3a12" strokeWidth="3.4" strokeLinecap="round" />
                    <Path d="M87 118q9 6 18 2" fill="none" stroke="#3b82b8" strokeWidth="3" strokeLinecap="round" />
                  </>
                ) : null}
              </>
            )}

            <Path d="M112 122h16l-8 10Z" fill="#3b2418" stroke="#3b2418" strokeWidth="2" strokeLinejoin="round" />

            {sad ? (
              <Path d="M106 145q14-10 28 0" fill="none" stroke="#5c2a12" strokeWidth="4" strokeLinecap="round" />
            ) : happy ? (
              <>
                <AnimatedPath animatedProps={state.speaking ? mouthProps : {}} d={mouthOpenD} fill="#6d2b16" stroke="#5c2a12" strokeWidth="2" strokeLinejoin="round" />
                <Path d="M110 148q10 9 20 0q-10 12-20 0Z" fill="#ff8f8f" />
              </>
            ) : (
              <>
                <AnimatedPath animatedProps={state.speaking ? mouthProps : {}} d={mouthClosedD} fill="#6d2b16" stroke="#5c2a12" strokeWidth="3.5" strokeLinejoin="round" />
                <Path d="M111 146q9 6 18 0q-9 9-18 0Z" fill="#ff8f8f" opacity={0.85} />
              </>
            )}
          </AnimatedG>

          {celebrate ? (
            <G>
              <Path d="M38 96l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="#ffd66b" />
              <Path d="M204 128l2.4 5.6 5.6 2.4-5.6 2.4-2.4 5.6-2.4-5.6-5.6-2.4 5.6-2.4Z" fill="#8add7f" />
            </G>
          ) : null}
        </Svg>
      </Animated.View>
    </Pressable>
  );
}

export default Fox;

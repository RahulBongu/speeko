import React, { useEffect } from 'react';
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

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

export type FoxMood = 'idle' | 'happy' | 'sad' | 'celebrate';

export interface FoxProps {
  mood?: FoxMood;
  style?: any;
  speaking?: boolean;
  title?: string;
}

const MOOD_LABEL: Record<FoxMood, string> = {
  idle: 'Speeko the fox, ready to learn',
  happy: 'Speeko the fox, delighted',
  sad: 'Speeko the fox, a little disappointed',
  celebrate: 'Speeko the fox, celebrating',
};

/**
 * Speeko, the mascot — vector version for mobile.
 *
 * Full body with ears, arms, tail, and a mood-driven face. The whole fox
 * breathes; celebrate adds a dance loop and happy adds a hop. The tail wags on
 * its own, the arms answer the mood, and when `speaking` is true the mouth
 * pulses open/closed and the eyes blink.
 */
export function Fox({ mood = 'idle', style, speaking = false, title }: FoxProps) {
  const happy = mood === 'happy' || mood === 'celebrate';
  const sad = mood === 'sad';
  const celebrate = mood === 'celebrate';

  const breathe = useSharedValue(0);
  const hop = useSharedValue(0);
  const dance = useSharedValue(0);
  const tail = useSharedValue(0);
  const mouth = useSharedValue(0);
  const blink = useSharedValue(0);

  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2100, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2100, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    tail.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 550, easing: Easing.inOut(Easing.ease) }),
        withTiming(-1, { duration: 550, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    if (celebrate) {
      dance.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(-1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      dance.value = withTiming(0, { duration: 200 });
    }
    if (happy && !celebrate) {
      hop.value = withSequence(
        withTiming(1, { duration: 380, easing: Easing.out(Easing.back(1.6)) }),
        withTiming(0, { duration: 380, easing: Easing.in(Easing.ease) }),
      );
    } else {
      hop.value = withTiming(0, { duration: 200 });
    }
  }, [mood, happy, sad, celebrate, breathe, tail, dance, hop]);

  useEffect(() => {
    if (speaking) {
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
  }, [speaking, mouth]);

  // Periodic blink.
  useEffect(() => {
    const cycle = () => {
      blink.value = withSequence(
        withTiming(1, { duration: 120, easing: Easing.in(Easing.ease) }),
        withTiming(0, { duration: 120, easing: Easing.out(Easing.ease) }),
      );
    };
    const id = setInterval(() => {
      // blink every ~3.5s, but skip while speaking (mouth already animates)
      if (!speaking) cycle();
    }, 3500);
    return () => clearInterval(id);
  }, [speaking, blink]);

  const containerStyle = useAnimatedStyle(() => {
    const y = breathe.value * -2.5 + hop.value * -14 + dance.value * -6;
    const rot = dance.value * 4;
    const sc = 1 + breathe.value * 0.008 + hop.value * 0.02;
    return {
      transform: [
        { translateY: y },
        { rotate: `${rot}deg` },
        { scale: sc },
      ],
    };
  });

  const tailProps = useAnimatedProps(() => ({
    rotation: tail.value * 6,
    originX: 150,
    originY: 198,
  }));

  const leftBlinkProps = useAnimatedProps(() => ({
    ry: 0 + blink.value * 10.5,
  }));
  const rightBlinkProps = useAnimatedProps(() => ({
    ry: 0 + blink.value * 10.5,
  }));

  const mouthOpenD = 'M101 133q19 26 38 0Z';
  const mouthClosedD = 'M106 137q14 10 28 0';
  const mouthProps = useAnimatedProps(() => ({
    d: mouth.value > 0.5 ? mouthOpenD : mouthClosedD,
  }));

  const leftEarRot = sad ? 13 : happy ? -5 : 0;
  const rightEarRot = sad ? -13 : happy ? 5 : 0;
  const leftArmRot = sad ? 10 : happy ? 104 : -4;
  const rightArmRot = sad ? -10 : happy ? -104 : 4;

  return (
    <Animated.View
      style={[style, containerStyle]}
      accessibilityLabel={title ?? MOOD_LABEL[mood]}
      accessibilityRole="image"
    >
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

        {/* Shadow */}
        <Ellipse cx="120" cy="225" rx="66" ry="8.5" fill="#3b2a1f" opacity={0.09} />

        {/* Feet */}
        <Ellipse cx="98" cy="218" rx="18" ry="11" fill="url(#fur)" stroke="#a8420f" strokeWidth="3" />
        <Path d="M87 219h7M96 221h7M105 219h6" stroke="#a8420f" strokeWidth="2.2" strokeLinecap="round" opacity={0.55} />
        <Ellipse cx="142" cy="218" rx="18" ry="11" fill="url(#fur)" stroke="#a8420f" strokeWidth="3" />
        <Path d="M129 219h6M138 221h7M147 219h7" stroke="#a8420f" strokeWidth="2.2" strokeLinecap="round" opacity={0.55} />

        {/* Tail (animated wag) */}
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

        {/* Body */}
        <Ellipse cx="120" cy="181" rx="52" ry="43" fill="url(#fur)" stroke="#a8420f" strokeWidth="3" />
        <Ellipse cx="120" cy="190" rx="34" ry="28" fill="url(#belly)" />

        {/* Arms */}
        <G transform={`rotate(${leftArmRot} 84 164)`}>
          <Path d="M84 164c-9 9-16 19-19 30" fill="none" stroke="#a8420f" strokeWidth="18" strokeLinecap="round" opacity={0.18} />
          <Circle cx="64" cy="194" r="10.5" fill="url(#fur)" stroke="#a8420f" strokeWidth="3" />
          <Path d="M59 199h11" stroke="#a8420f" strokeWidth="2" strokeLinecap="round" opacity={0.5} />
        </G>
        <G transform={`rotate(${rightArmRot} 156 164)`}>
          <Path d="M156 164c9 9 16 19 19 30" fill="none" stroke="#a8420f" strokeWidth="18" strokeLinecap="round" opacity={0.18} />
          <Circle cx="176" cy="194" r="10.5" fill="url(#fur)" stroke="#a8420f" strokeWidth="3" />
          <Path d="M171 199h11" stroke="#a8420f" strokeWidth="2" strokeLinecap="round" opacity={0.5} />
        </G>

        {/* Ears */}
        <G transform={`rotate(${leftEarRot} 76 74)`}>
          <Path d="M54 83 66 23q2-7 9-2l25 35Z" fill="url(#fur)" stroke="#a8420f" strokeWidth="3" strokeLinejoin="round" />
          <Path d="M69 69 76 39l16 20Z" fill="#ffc3a1" />
        </G>
        <G transform={`rotate(${rightEarRot} 164 74)`}>
          <Path d="M186 83 174 23q-2-7-9-2l-25 35Z" fill="url(#fur)" stroke="#a8420f" strokeWidth="3" strokeLinejoin="round" />
          <Path d="M171 69 164 39l-16 20Z" fill="#ffc3a1" />
        </G>

        {/* Head */}
        <G>
          <Ellipse cx="120" cy="108" rx="66" ry="58" fill="url(#fur)" stroke="#a8420f" strokeWidth="3" />

          {/* Scarf/bib accent (green) */}
          <Path
            d="M78 150c13 10 27 15 42 15s29-5 42-15l7 21c-15 10-31 15-49 15s-34-5-49-15Z"
            fill="#37b02c"
          />
          <Path d="M78 150c13 10 27 15 42 15s29-5 42-15l2 6c-14 10-28 15-44 15s-30-5-44-15Z" fill="#58c94d" />
          <Circle cx="120" cy="171" r="8.5" fill="#269020" />

          <Ellipse cx="120" cy="134" rx="39" ry="30" fill="url(#belly)" />

          {happy ? (
            <>
              <Circle cx="76" cy="124" r="15" fill="#ff9d8a" opacity={0.62} />
              <Circle cx="164" cy="124" r="15" fill="#ff9d8a" opacity={0.62} />
            </>
          ) : null}

          {/* Eyes */}
          {happy ? (
            <>
              <Path d="M85 103q11-14 22 0" fill="none" stroke="#2d1f18" strokeWidth="5" strokeLinecap="round" />
              <Path d="M133 103q11-14 22 0" fill="none" stroke="#2d1f18" strokeWidth="5" strokeLinecap="round" />
            </>
          ) : sad ? (
            <>
              <Ellipse cx="96" cy="101" rx="8.5" ry="10.5" fill="#2d1f18" />
              <Ellipse cx="144" cy="101" rx="8.5" ry="10.5" fill="#2d1f18" />
              <Path d="M84 86l21 7" fill="none" stroke="#8a3a12" strokeWidth="3.4" strokeLinecap="round" />
              <Path d="M156 86l-21 7" fill="none" stroke="#8a3a12" strokeWidth="3.4" strokeLinecap="round" />
            </>
          ) : (
            <>
              <Ellipse cx="96" cy="101" rx="8.5" ry="10.5" fill="#2d1f18" />
              <Circle cx="99" cy="97.5" r="2.7" fill="#fff8ee" />
              <Ellipse cx="144" cy="101" rx="8.5" ry="10.5" fill="#2d1f18" />
              <Circle cx="147" cy="97.5" r="2.7" fill="#fff8ee" />
            </>
          )}

          {/* Blink eyelids (animated) */}
          <AnimatedEllipse cx="96" cy="101" rx="9" animatedProps={leftBlinkProps} fill="#ffa567" />
          <AnimatedEllipse cx="144" cy="101" rx="9" animatedProps={rightBlinkProps} fill="#ffa567" />

          {/* Nose */}
          <Path d="M112 122h16l-8 10Z" fill="#3b2418" stroke="#3b2418" strokeWidth="2" strokeLinejoin="round" />

          {/* Mouth (animated open/closed when speaking) */}
          {sad ? (
            <Path d="M106 145q14-10 28 0" fill="none" stroke="#5c2a12" strokeWidth="4" strokeLinecap="round" />
          ) : happy ? (
            <>
              <AnimatedPath animatedProps={speaking ? mouthProps : {}} d="M101 133q19 26 38 0Z" fill="#6d2b16" stroke="#5c2a12" strokeWidth="2" strokeLinejoin="round" />
              <Path d="M110 148q10 9 20 0q-10 12-20 0Z" fill="#ff8f8f" />
            </>
          ) : (
            <>
              <AnimatedPath animatedProps={speaking ? mouthProps : {}} d="M106 137q14 10 28 0" fill="#6d2b16" stroke="#5c2a12" strokeWidth="3.5" strokeLinejoin="round" />
              <Path d="M111 146q9 6 18 0q-9 9-18 0Z" fill="#ff8f8f" opacity={0.85} />
            </>
          )}
        </G>

        {celebrate ? (
          <G>
            <Path d="M38 96l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="#ffd66b" />
            <Path d="M204 128l2.4 5.6 5.6 2.4-5.6 2.4-2.4 5.6-2.4-5.6-5.6-2.4 5.6-2.4Z" fill="#8add7f" />
          </G>
        ) : null}
      </Svg>
    </Animated.View>
  );
}

export default Fox;

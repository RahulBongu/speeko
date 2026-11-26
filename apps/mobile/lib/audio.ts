import { createAudioPlayer } from 'expo-audio';
import { emitMascotListening } from './mascot';

const AUDIO_MAP: Record<string, number> = {
  'bn-starter-u10-l1-e3': require('../assets/audio/bn-starter-u10-l1-e3.mp3'),
  'bn-starter-u10-l2-e2': require('../assets/audio/bn-starter-u10-l2-e2.mp3'),
  'bn-starter-u11-l1-e3': require('../assets/audio/bn-starter-u11-l1-e3.mp3'),
  'bn-starter-u11-l2-e2': require('../assets/audio/bn-starter-u11-l2-e2.mp3'),
  'bn-starter-u3-l2-e3': require('../assets/audio/bn-starter-u3-l2-e3.mp3'),
  'bn-starter-u4-l1-listen': require('../assets/audio/bn-starter-u4-l1-listen.mp3'),
  'bn-starter-u4-l2-listen': require('../assets/audio/bn-starter-u4-l2-listen.mp3'),
  'bn-starter-u5-l2-listen': require('../assets/audio/bn-starter-u5-l2-listen.mp3'),
  'bn-starter-u6-l2-listen': require('../assets/audio/bn-starter-u6-l2-listen.mp3'),
  'bn-starter-u7-l2-listen': require('../assets/audio/bn-starter-u7-l2-listen.mp3'),
  'bn-starter-u8-l2-listen': require('../assets/audio/bn-starter-u8-l2-listen.mp3'),
  'bn-starter-u9-l1-e3': require('../assets/audio/bn-starter-u9-l1-e3.mp3'),
  'bn-starter-u9-l2-e2': require('../assets/audio/bn-starter-u9-l2-e2.mp3'),
  'gu-starter-u10-l1-e3': require('../assets/audio/gu-starter-u10-l1-e3.mp3'),
  'gu-starter-u10-l2-e2': require('../assets/audio/gu-starter-u10-l2-e2.mp3'),
  'gu-starter-u11-l1-e3': require('../assets/audio/gu-starter-u11-l1-e3.mp3'),
  'gu-starter-u11-l2-e2': require('../assets/audio/gu-starter-u11-l2-e2.mp3'),
  'gu-starter-u3-l2-e3': require('../assets/audio/gu-starter-u3-l2-e3.mp3'),
  'gu-starter-u4-l1-listen': require('../assets/audio/gu-starter-u4-l1-listen.mp3'),
  'gu-starter-u4-l2-listen': require('../assets/audio/gu-starter-u4-l2-listen.mp3'),
  'gu-starter-u5-l2-listen': require('../assets/audio/gu-starter-u5-l2-listen.mp3'),
  'gu-starter-u6-l2-listen': require('../assets/audio/gu-starter-u6-l2-listen.mp3'),
  'gu-starter-u7-l2-listen': require('../assets/audio/gu-starter-u7-l2-listen.mp3'),
  'gu-starter-u8-l2-listen': require('../assets/audio/gu-starter-u8-l2-listen.mp3'),
  'gu-starter-u9-l1-e3': require('../assets/audio/gu-starter-u9-l1-e3.mp3'),
  'gu-starter-u9-l2-e2': require('../assets/audio/gu-starter-u9-l2-e2.mp3'),
  'hi-starter-u10-l1-e3': require('../assets/audio/hi-starter-u10-l1-e3.mp3'),
  'hi-starter-u10-l2-e2': require('../assets/audio/hi-starter-u10-l2-e2.mp3'),
  'hi-starter-u11-l1-e3': require('../assets/audio/hi-starter-u11-l1-e3.mp3'),
  'hi-starter-u11-l2-e2': require('../assets/audio/hi-starter-u11-l2-e2.mp3'),
  'hi-starter-u3-l2-e3': require('../assets/audio/hi-starter-u3-l2-e3.mp3'),
  'hi-starter-u4-l1-listen': require('../assets/audio/hi-starter-u4-l1-listen.mp3'),
  'hi-starter-u4-l2-listen': require('../assets/audio/hi-starter-u4-l2-listen.mp3'),
  'hi-starter-u5-l2-listen': require('../assets/audio/hi-starter-u5-l2-listen.mp3'),
  'hi-starter-u6-l2-listen': require('../assets/audio/hi-starter-u6-l2-listen.mp3'),
  'hi-starter-u7-l2-listen': require('../assets/audio/hi-starter-u7-l2-listen.mp3'),
  'hi-starter-u8-l2-listen': require('../assets/audio/hi-starter-u8-l2-listen.mp3'),
  'hi-starter-u9-l1-e3': require('../assets/audio/hi-starter-u9-l1-e3.mp3'),
  'hi-starter-u9-l2-e2': require('../assets/audio/hi-starter-u9-l2-e2.mp3'),
  'kn-starter-u10-l1-e3': require('../assets/audio/kn-starter-u10-l1-e3.mp3'),
  'kn-starter-u10-l2-e2': require('../assets/audio/kn-starter-u10-l2-e2.mp3'),
  'kn-starter-u11-l1-e3': require('../assets/audio/kn-starter-u11-l1-e3.mp3'),
  'kn-starter-u11-l2-e2': require('../assets/audio/kn-starter-u11-l2-e2.mp3'),
  'kn-starter-u3-l2-e3': require('../assets/audio/kn-starter-u3-l2-e3.mp3'),
  'kn-starter-u4-l1-listen': require('../assets/audio/kn-starter-u4-l1-listen.mp3'),
  'kn-starter-u4-l2-listen': require('../assets/audio/kn-starter-u4-l2-listen.mp3'),
  'kn-starter-u5-l2-listen': require('../assets/audio/kn-starter-u5-l2-listen.mp3'),
  'kn-starter-u6-l2-listen': require('../assets/audio/kn-starter-u6-l2-listen.mp3'),
  'kn-starter-u7-l2-listen': require('../assets/audio/kn-starter-u7-l2-listen.mp3'),
  'kn-starter-u8-l2-listen': require('../assets/audio/kn-starter-u8-l2-listen.mp3'),
  'kn-starter-u9-l1-e3': require('../assets/audio/kn-starter-u9-l1-e3.mp3'),
  'kn-starter-u9-l2-e2': require('../assets/audio/kn-starter-u9-l2-e2.mp3'),
  'ml-starter-u10-l1-e3': require('../assets/audio/ml-starter-u10-l1-e3.mp3'),
  'ml-starter-u10-l2-e2': require('../assets/audio/ml-starter-u10-l2-e2.mp3'),
  'ml-starter-u11-l1-e3': require('../assets/audio/ml-starter-u11-l1-e3.mp3'),
  'ml-starter-u11-l2-e2': require('../assets/audio/ml-starter-u11-l2-e2.mp3'),
  'ml-starter-u3-l2-e3': require('../assets/audio/ml-starter-u3-l2-e3.mp3'),
  'ml-starter-u4-l1-listen': require('../assets/audio/ml-starter-u4-l1-listen.mp3'),
  'ml-starter-u4-l2-listen': require('../assets/audio/ml-starter-u4-l2-listen.mp3'),
  'ml-starter-u5-l2-listen': require('../assets/audio/ml-starter-u5-l2-listen.mp3'),
  'ml-starter-u6-l2-listen': require('../assets/audio/ml-starter-u6-l2-listen.mp3'),
  'ml-starter-u7-l2-listen': require('../assets/audio/ml-starter-u7-l2-listen.mp3'),
  'ml-starter-u8-l2-listen': require('../assets/audio/ml-starter-u8-l2-listen.mp3'),
  'ml-starter-u9-l1-e3': require('../assets/audio/ml-starter-u9-l1-e3.mp3'),
  'ml-starter-u9-l2-e2': require('../assets/audio/ml-starter-u9-l2-e2.mp3'),
  'mr-starter-u10-l1-e3': require('../assets/audio/mr-starter-u10-l1-e3.mp3'),
  'mr-starter-u10-l2-e2': require('../assets/audio/mr-starter-u10-l2-e2.mp3'),
  'mr-starter-u11-l1-e3': require('../assets/audio/mr-starter-u11-l1-e3.mp3'),
  'mr-starter-u11-l2-e2': require('../assets/audio/mr-starter-u11-l2-e2.mp3'),
  'mr-starter-u3-l2-e3': require('../assets/audio/mr-starter-u3-l2-e3.mp3'),
  'mr-starter-u4-l1-listen': require('../assets/audio/mr-starter-u4-l1-listen.mp3'),
  'mr-starter-u4-l2-listen': require('../assets/audio/mr-starter-u4-l2-listen.mp3'),
  'mr-starter-u5-l2-listen': require('../assets/audio/mr-starter-u5-l2-listen.mp3'),
  'mr-starter-u6-l2-listen': require('../assets/audio/mr-starter-u6-l2-listen.mp3'),
  'mr-starter-u7-l2-listen': require('../assets/audio/mr-starter-u7-l2-listen.mp3'),
  'mr-starter-u8-l2-listen': require('../assets/audio/mr-starter-u8-l2-listen.mp3'),
  'mr-starter-u9-l1-e3': require('../assets/audio/mr-starter-u9-l1-e3.mp3'),
  'mr-starter-u9-l2-e2': require('../assets/audio/mr-starter-u9-l2-e2.mp3'),
  'pa-starter-u10-l1-e3': require('../assets/audio/pa-starter-u10-l1-e3.mp3'),
  'pa-starter-u10-l2-e2': require('../assets/audio/pa-starter-u10-l2-e2.mp3'),
  'pa-starter-u11-l1-e3': require('../assets/audio/pa-starter-u11-l1-e3.mp3'),
  'pa-starter-u11-l2-e2': require('../assets/audio/pa-starter-u11-l2-e2.mp3'),
  'pa-starter-u3-l2-e3': require('../assets/audio/pa-starter-u3-l2-e3.mp3'),
  'pa-starter-u4-l1-listen': require('../assets/audio/pa-starter-u4-l1-listen.mp3'),
  'pa-starter-u4-l2-listen': require('../assets/audio/pa-starter-u4-l2-listen.mp3'),
  'pa-starter-u5-l2-listen': require('../assets/audio/pa-starter-u5-l2-listen.mp3'),
  'pa-starter-u6-l2-listen': require('../assets/audio/pa-starter-u6-l2-listen.mp3'),
  'pa-starter-u7-l2-listen': require('../assets/audio/pa-starter-u7-l2-listen.mp3'),
  'pa-starter-u8-l2-listen': require('../assets/audio/pa-starter-u8-l2-listen.mp3'),
  'pa-starter-u9-l1-e3': require('../assets/audio/pa-starter-u9-l1-e3.mp3'),
  'pa-starter-u9-l2-e2': require('../assets/audio/pa-starter-u9-l2-e2.mp3'),
  'ta-starter-u10-l1-e3': require('../assets/audio/ta-starter-u10-l1-e3.mp3'),
  'ta-starter-u10-l2-e2': require('../assets/audio/ta-starter-u10-l2-e2.mp3'),
  'ta-starter-u11-l1-e3': require('../assets/audio/ta-starter-u11-l1-e3.mp3'),
  'ta-starter-u11-l2-e2': require('../assets/audio/ta-starter-u11-l2-e2.mp3'),
  'ta-starter-u3-l2-e3': require('../assets/audio/ta-starter-u3-l2-e3.mp3'),
  'ta-starter-u4-l1-listen': require('../assets/audio/ta-starter-u4-l1-listen.mp3'),
  'ta-starter-u4-l2-listen': require('../assets/audio/ta-starter-u4-l2-listen.mp3'),
  'ta-starter-u5-l2-listen': require('../assets/audio/ta-starter-u5-l2-listen.mp3'),
  'ta-starter-u6-l2-listen': require('../assets/audio/ta-starter-u6-l2-listen.mp3'),
  'ta-starter-u7-l2-listen': require('../assets/audio/ta-starter-u7-l2-listen.mp3'),
  'ta-starter-u8-l2-listen': require('../assets/audio/ta-starter-u8-l2-listen.mp3'),
  'ta-starter-u9-l1-e3': require('../assets/audio/ta-starter-u9-l1-e3.mp3'),
  'ta-starter-u9-l2-e2': require('../assets/audio/ta-starter-u9-l2-e2.mp3'),
  'te-starter-u10-l1-e3': require('../assets/audio/te-starter-u10-l1-e3.mp3'),
  'te-starter-u10-l2-e2': require('../assets/audio/te-starter-u10-l2-e2.mp3'),
  'te-starter-u11-l1-e3': require('../assets/audio/te-starter-u11-l1-e3.mp3'),
  'te-starter-u11-l2-e2': require('../assets/audio/te-starter-u11-l2-e2.mp3'),
  'te-starter-u3-l2-e3': require('../assets/audio/te-starter-u3-l2-e3.mp3'),
  'te-starter-u4-l1-listen': require('../assets/audio/te-starter-u4-l1-listen.mp3'),
  'te-starter-u4-l2-listen': require('../assets/audio/te-starter-u4-l2-listen.mp3'),
  'te-starter-u5-l2-listen': require('../assets/audio/te-starter-u5-l2-listen.mp3'),
  'te-starter-u6-l2-listen': require('../assets/audio/te-starter-u6-l2-listen.mp3'),
  'te-starter-u7-l2-listen': require('../assets/audio/te-starter-u7-l2-listen.mp3'),
  'te-starter-u8-l2-listen': require('../assets/audio/te-starter-u8-l2-listen.mp3'),
  'te-starter-u9-l1-e3': require('../assets/audio/te-starter-u9-l1-e3.mp3'),
  'te-starter-u9-l2-e2': require('../assets/audio/te-starter-u9-l2-e2.mp3'),
};

let currentPlayer: ReturnType<typeof createAudioPlayer> | null = null;
let currentSubscription: { remove(): void } | null = null;

function releasePlayer(): void {
  if (currentSubscription) {
    try {
      currentSubscription.remove();
    } catch {}
    currentSubscription = null;
  }
  if (currentPlayer) {
    try {
      currentPlayer.pause();
    } catch {}
    try {
      currentPlayer.remove();
    } catch {}
    currentPlayer = null;
  }
}

export function hasMobileAudio(exerciseId: string): boolean {
  return Object.prototype.hasOwnProperty.call(AUDIO_MAP, exerciseId);
}

export async function playMobileAudio(exerciseId: string): Promise<boolean> {
  const source = AUDIO_MAP[exerciseId];
  if (!source) return false;
  try {
    releasePlayer();
    const player = createAudioPlayer(source);
    currentPlayer = player;
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.isLoaded && status.didJustFinish) {
        if (currentPlayer === player) releasePlayer();
        emitMascotListening(false);
      }
    });
    currentSubscription = subscription;
    player.play();
    emitMascotListening(true);
    return true;
  } catch {
    return false;
  }
}

export async function stopMobileAudio(): Promise<void> {
  releasePlayer();
  emitMascotListening(false);
}

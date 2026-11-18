import { Audio } from 'expo-av';

const AUDIO_MAP: Record<string, number> = {
  'bn-starter-u3-l2-e3': require('../assets/audio/bn-starter-u3-l2-e3.mp3'),
  'gu-starter-u3-l2-e3': require('../assets/audio/gu-starter-u3-l2-e3.mp3'),
  'hi-starter-u3-l2-e3': require('../assets/audio/hi-starter-u3-l2-e3.mp3'),
  'kn-starter-u3-l2-e3': require('../assets/audio/kn-starter-u3-l2-e3.mp3'),
  'ml-starter-u3-l2-e3': require('../assets/audio/ml-starter-u3-l2-e3.mp3'),
  'mr-starter-u3-l2-e3': require('../assets/audio/mr-starter-u3-l2-e3.mp3'),
  'pa-starter-u3-l2-e3': require('../assets/audio/pa-starter-u3-l2-e3.mp3'),
  'ta-starter-u3-l2-e3': require('../assets/audio/ta-starter-u3-l2-e3.mp3'),
  'te-starter-u3-l2-e3': require('../assets/audio/te-starter-u3-l2-e3.mp3'),
};

let currentSound: Audio.Sound | null = null;

export function hasMobileAudio(exerciseId: string): boolean {
  return Object.prototype.hasOwnProperty.call(AUDIO_MAP, exerciseId);
}

export async function playMobileAudio(exerciseId: string): Promise<boolean> {
  const source = AUDIO_MAP[exerciseId];
  if (!source) return false;
  try {
    if (currentSound) {
      await currentSound.unloadAsync().catch(() => {});
      currentSound = null;
    }
    const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: true });
    currentSound = sound;
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        if (currentSound === sound) currentSound = null;
      }
    });
    return true;
  } catch {
    return false;
  }
}

export async function stopMobileAudio(): Promise<void> {
  if (currentSound) {
    await currentSound.stopAsync().catch(() => {});
    await currentSound.unloadAsync().catch(() => {});
    currentSound = null;
  }
}

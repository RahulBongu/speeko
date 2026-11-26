import type { ImageSourcePropType } from 'react-native';
import type { MascotState } from '@speeko/core';

export interface MascotClipAsset {
  sprite: ImageSourcePropType;
  still: ImageSourcePropType;
  oneShot: boolean;
}

/** Static Metro asset map for all 15 cropped, alpha-matted Flow mascot loops & stills. */
export const FOX_MASCOT_ASSETS: Record<MascotState, MascotClipAsset> = {
  idle: {
    sprite: require('../assets/mascot/sprites/idle.webp'),
    still: require('../assets/mascot/stills/idle.png'),
    oneShot: false,
  },
  greeting: {
    sprite: require('../assets/mascot/sprites/greeting.webp'),
    still: require('../assets/mascot/stills/greeting.png'),
    oneShot: true,
  },
  excited: {
    sprite: require('../assets/mascot/sprites/excited.webp'),
    still: require('../assets/mascot/stills/excited.png'),
    oneShot: false,
  },
  thinking: {
    sprite: require('../assets/mascot/sprites/thinking.webp'),
    still: require('../assets/mascot/stills/thinking.png'),
    oneShot: false,
  },
  correct_answer: {
    sprite: require('../assets/mascot/sprites/correct_answer.webp'),
    still: require('../assets/mascot/stills/correct_answer.png'),
    oneShot: true,
  },
  incorrect_supportive: {
    sprite: require('../assets/mascot/sprites/incorrect_supportive.webp'),
    still: require('../assets/mascot/stills/incorrect_supportive.png'),
    oneShot: true,
  },
  encouragement: {
    sprite: require('../assets/mascot/sprites/encouragement.webp'),
    still: require('../assets/mascot/stills/encouragement.png'),
    oneShot: false,
  },
  talking: {
    sprite: require('../assets/mascot/sprites/talking.webp'),
    still: require('../assets/mascot/stills/talking.png'),
    oneShot: false,
  },
  listening: {
    sprite: require('../assets/mascot/sprites/listening.webp'),
    still: require('../assets/mascot/stills/listening.png'),
    oneShot: false,
  },
  surprise: {
    sprite: require('../assets/mascot/sprites/surprise.webp'),
    still: require('../assets/mascot/stills/surprise.png'),
    oneShot: true,
  },
  lesson_complete: {
    sprite: require('../assets/mascot/sprites/lesson_complete.webp'),
    still: require('../assets/mascot/stills/lesson_complete.png'),
    oneShot: false,
  },
  victory_dance: {
    sprite: require('../assets/mascot/sprites/victory_dance.webp'),
    still: require('../assets/mascot/stills/victory_dance.png'),
    oneShot: false,
  },
  sleepy: {
    sprite: require('../assets/mascot/sprites/sleepy.webp'),
    still: require('../assets/mascot/stills/sleepy.png'),
    oneShot: false,
  },
  curious_discovery: {
    sprite: require('../assets/mascot/sprites/curious_discovery.webp'),
    still: require('../assets/mascot/stills/curious_discovery.png'),
    oneShot: true,
  },
  welcome_back: {
    sprite: require('../assets/mascot/sprites/welcome_back.webp'),
    still: require('../assets/mascot/stills/welcome_back.png'),
    oneShot: true,
  },
};

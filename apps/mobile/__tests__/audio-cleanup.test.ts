/**
 * Audio lifecycle regression: a lesson/practice screen must be able to stop
 * recorded audio and mascot voice, including their status subscriptions.
 */
const mockListenerRemove = jest.fn();
const mockFakePlayers: Array<{
  pause: jest.Mock;
  remove: jest.Mock;
  play: jest.Mock;
  addListener: jest.Mock;
  volume?: number;
}> = [];

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => {
    const player = {
      pause: jest.fn(),
      remove: jest.fn(),
      play: jest.fn(),
      addListener: jest.fn(() => ({ remove: mockListenerRemove })),
    };
    mockFakePlayers.push(player);
    return player;
  }),
}));

import { playMobileAudio, stopMobileAudio } from '../lib/audio';
import {
  playMascotVoice,
  stopMascotVoice,
  subscribeMascotListening,
  subscribeMascotSpeaking,
} from '../lib/mascot';

beforeEach(() => {
  mockFakePlayers.length = 0;
  mockListenerRemove.mockClear();
});

afterEach(async () => {
  await stopMobileAudio();
  await stopMascotVoice();
});

test('stopMobileAudio removes the player and its status listener', async () => {
  const listening: boolean[] = [];
  const unsubscribe = subscribeMascotListening((active) => listening.push(active));
  expect(await playMobileAudio('hi-starter-u3-l2-e3')).toBe(true);
  expect(mockFakePlayers).toHaveLength(1);
  expect(mockFakePlayers[0]!.play).toHaveBeenCalledTimes(1);
  expect(listening).toEqual([true]);

  await stopMobileAudio();

  expect(mockFakePlayers[0]!.pause).toHaveBeenCalled();
  expect(mockFakePlayers[0]!.remove).toHaveBeenCalled();
  expect(mockListenerRemove).toHaveBeenCalled();
  expect(listening).toEqual([true, false]);
  unsubscribe();
});

test('a second clip releases the first player and listener', async () => {
  expect(await playMobileAudio('hi-starter-u3-l2-e3')).toBe(true);
  expect(await playMobileAudio('bn-starter-u3-l2-e3')).toBe(true);
  expect(mockFakePlayers).toHaveLength(2);
  expect(mockFakePlayers[0]!.remove).toHaveBeenCalled();
  expect(mockListenerRemove).toHaveBeenCalledTimes(1);
});

test('stopMascotVoice clears speaking state and releases the player', async () => {
  const speaking: boolean[] = [];
  const unsubscribe = subscribeMascotSpeaking((active) => speaking.push(active));
  expect(await playMascotVoice('correct_answer')).toBe(true);
  expect(speaking).toEqual([true]);

  await stopMascotVoice();

  expect(mockFakePlayers[0]!.pause).toHaveBeenCalled();
  expect(mockFakePlayers[0]!.remove).toHaveBeenCalled();
  expect(mockListenerRemove).toHaveBeenCalled();
  expect(speaking).toEqual([true, false]);
  unsubscribe();
});

test('a missing audio id is a no-op', async () => {
  expect(await playMobileAudio('does-not-exist')).toBe(false);
  expect(mockFakePlayers).toHaveLength(0);
});

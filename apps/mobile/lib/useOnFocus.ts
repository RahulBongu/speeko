import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Runs `onFocus` on mount and whenever the screen regains focus in Expo Router.
 */
export function useOnFocus(onFocus: () => void | Promise<void>): void {
  useFocusEffect(
    useCallback(() => {
      void onFocus();
    }, [onFocus]),
  );
}

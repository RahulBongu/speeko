import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

// Rendering the real expo-router <Stack> in Jest requires a navigation
// container; the root layout only chooses Stack vs. children, so substitute a
// marker to assert the layout composes without throwing.
jest.mock('expo-router', () => {
  const { Text: Marker } = require('react-native');
  return {
    Stack: () => <Marker testID="root-stack">root-stack</Marker>,
  };
});

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

import RootLayout from '../app/_layout';

test('root layout renders without crashing', async () => {
  await render(<RootLayout />);

  expect(screen.getByTestId('root-stack')).toBeTruthy();
  expect(screen.getByText('root-stack')).toBeTruthy();
});

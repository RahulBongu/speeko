import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

test('renders a React Native component through the Expo Jest preset', async () => {
  await render(<Text>Hello Speeko</Text>);

  expect(screen.getByText('Hello Speeko')).toBeTruthy();
});

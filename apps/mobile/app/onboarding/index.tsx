import { Redirect } from 'expo-router';
import { Screen } from '../../components/Screen';

export default function OnboardingIndex() {
  // Renders nothing itself — the Redirect fires on mount. Screen keeps the
  // cream background up while the navigation happens.
  return (
    <Screen>
      <Redirect href="/onboarding/language" />
    </Screen>
  );
}

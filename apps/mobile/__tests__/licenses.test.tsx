import { render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}));

import Licenses from '../app/licenses';
import { LICENSE_DOCUMENTS } from '../lib/licenses';

describe('mobile licenses screen', () => {
  it('bundles four non-empty license texts', () => {
    expect(LICENSE_DOCUMENTS.map((document) => document.id)).toEqual([
      'license',
      'content',
      'notice',
      'fonts',
    ]);
    for (const document of LICENSE_DOCUMENTS) {
      expect(document.text.length).toBeGreaterThan(500);
      expect(document.filename.length).toBeGreaterThan(0);
    }
  });

  it('renders the Apache, content, notice, and font texts', async () => {
    await render(<Licenses />);

    expect(screen.getByRole('header', { name: 'Licenses and attributions' })).toBeTruthy();
    expect(screen.getByText('Apache License 2.0 — source code')).toBeTruthy();
    expect(screen.getByText('Content and brand license')).toBeTruthy();
    expect(screen.getByText('NOTICE — third-party attributions')).toBeTruthy();
    expect(screen.getByText('Fonts — SIL Open Font License 1.1')).toBeTruthy();

    // Distinctive fragments from each source file, not just the titles.
    expect(screen.getByText(/Apache License\s+Version 2\.0, January 2004/)).toBeTruthy();
    expect(screen.getByText(/Content and Brand License/)).toBeTruthy();
    expect(screen.getByText(/This product includes software developed/)).toBeTruthy();
    expect(screen.getByText(/SIL OPEN FONT LICENSE Version 1\.1/)).toBeTruthy();
  });
});

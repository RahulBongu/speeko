import { render, screen } from '@testing-library/react-native';

const mockParams = { courseId: 'hi-starter', unitIndex: '1' };
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('../lib/api', () => ({
  apiFetch: jest.fn(),
  ORIGIN: 'http://localhost:3000',
}));

import { apiFetch } from '../lib/api';
import Guidebook from '../app/guidebook/[courseId]/[unitIndex]';

const mockedFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const course = {
  id: 'hi-starter',
  locale: 'hi',
  sourceLocale: 'en',
  title: 'Hindi Starter',
  difficulty: 'A1',
  version: '1.0.0',
  reviewStatus: 'draft',
  units: [
    {
      id: 'unit-1',
      title: 'Unit 1 — Greetings',
      description: 'Meet people for the first time.',
      order: 0,
      lessons: [
        {
          id: 'greetings',
          title: 'Namaste',
          order: 0,
          difficulty: 'A1',
          xpReward: 10,
          reviewStatus: 'draft',
          exercises: [
            {
              id: 'e1',
              kind: 'chooseMeaning',
              prompt: 'Choose the meaning of नमस्ते',
              options: ['नमस्ते', 'धन्यवाद'],
              answerIndex: 0,
            },
            {
              id: 'e2',
              kind: 'typeTranslation',
              prompt: 'Type hello',
              expected: ['नमस्ते'],
              acceptTypos: false,
            },
          ],
        },
        {
          id: 'yes-no',
          title: 'Yes and no',
          order: 1,
          difficulty: 'A1',
          xpReward: 10,
          reviewStatus: 'draft',
          exercises: [
            {
              id: 'e4',
              kind: 'matchPairs',
              prompt: 'Match the pairs',
              pairs: [
                ['Yes', 'हाँ'],
                ['No', 'नहीं'],
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'unit-2',
      title: 'Unit 2 — Numbers',
      order: 1,
      lessons: [
        {
          id: 'count-to-ten',
          title: 'Counting',
          order: 0,
          difficulty: 'A1',
          xpReward: 10,
          reviewStatus: 'draft',
          exercises: [
            {
              id: 'e6',
              kind: 'typeTranslation',
              prompt: 'Type one',
              expected: ['एक'],
              acceptTypos: false,
            },
          ],
        },
      ],
    },
  ],
};

function reply(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

describe('mobile unit guidebook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams.unitIndex = '1';
  });

  it('renders the unit, target items, and the lesson plan', async () => {
    mockedFetch.mockResolvedValue(reply(200, course));
    await render(<Guidebook />);

    expect(await screen.findByText('Unit 1 — Greetings')).toBeTruthy();
    expect(screen.getByText(/Meet people for the first time/)).toBeTruthy();
    // The matchPairs board contributes its members, not the fused string, and
    // identical targets from multiple boards are listed exactly once.
    expect(screen.getAllByText('नमस्ते')).toHaveLength(1);
    expect(screen.getByText('हाँ')).toBeTruthy();
    expect(screen.getByText('नहीं')).toBeTruthy();
    // Items never leak in from the next unit.
    expect(screen.queryByText('एक')).toBeNull();

    expect(screen.getByText('1. Namaste')).toBeTruthy();
    expect(screen.getByText('2. Yes and no')).toBeTruthy();
    expect(screen.queryByText('3. Counting')).toBeNull();
  });

  it('renders an honest not-found state for an unknown unit index', async () => {
    mockParams.unitIndex = '99';
    mockedFetch.mockResolvedValue(reply(200, course));
    await render(<Guidebook />);

    expect(await screen.findByText('That unit does not exist')).toBeTruthy();
    expect(screen.getByText('Back to the path')).toBeTruthy();
  });

  it('shows a recoverable error state when the course cannot load', async () => {
    mockedFetch.mockResolvedValue(reply(500, {}));
    await render(<Guidebook />);

    expect(await screen.findByText("Couldn't open this guidebook")).toBeTruthy();
    expect(screen.getByText('Try again')).toBeTruthy();
  });
});

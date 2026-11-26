import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Fox } from '../components/Fox';

/**
 * Decorative mascots must not be exposed as do-nothing buttons. Only a Fox
 * with an `onTap` handler is interactive; the rest are hidden from assistive
 * technology unless the caller supplied a meaningful `title` (image role).
 */
describe('Fox mascot', () => {
  const fox = () => screen.getByTestId('fox-mascot');

  it('shows the listening pose while an audio prompt plays', async () => {
    await render(<Fox style={{ width: 80, height: 80 }} listening />);
    expect(fox().props.accessibilityLabel).toContain('listening');
    expect(fox().props.accessible).toBe(false);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('lets a speaking voice line override listening', async () => {
    await render(<Fox style={{ width: 80, height: 80 }} listening speaking />);
    expect(fox().props.accessibilityLabel).toContain('talking');
  });

  it('maps grading feedback to happy and confused poses', async () => {
    const view = await render(<Fox style={{ width: 80, height: 80 }} mood="correct" />);
    expect(fox().props.accessibilityLabel).toContain('delighted');

    await view.rerender(<Fox style={{ width: 80, height: 80 }} mood="incorrect" />);
    expect(fox().props.accessibilityLabel).toContain('confused');
  });

  it('exposes a titled decorative fox as an image, not a button', async () => {
    await render(<Fox style={{ width: 80, height: 80 }} title="Speeko, the friendly fox mascot" />);
    expect(screen.getByRole('image').props.accessibilityLabel).toBe('Speeko, the friendly fox mascot');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('waves on tap and calls the provided handler', async () => {
    const onTap = jest.fn();
    await render(<Fox style={{ width: 80, height: 80 }} onTap={onTap} />);
    fireEvent.press(screen.getByRole('button'));
    expect(onTap).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.getByRole('button').props.accessibilityLabel).toContain('waving hello');
    });
  });

  it('does not wave during a confused reaction', async () => {
    const onTap = jest.fn();
    await render(<Fox style={{ width: 80, height: 80 }} mood="incorrect" onTap={onTap} />);
    fireEvent.press(screen.getByRole('button'));
    expect(onTap).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button').props.accessibilityLabel).toContain('confused');
  });

  it('accepts lookAt gaze tracking, scarf cosmetic, and escalating combo without errors', async () => {
    await render(
      <Fox
        style={{ width: 80, height: 80 }}
        mood="correct"
        accessory="scarf"
        lookAt={{ x: -0.5, y: -0.6 }}
        combo={5}
        title="Speeko cheering combo"
      />,
    );
    expect(screen.getByRole('image').props.accessibilityLabel).toBe('Speeko cheering combo');
  });

  it('renders all 15 Flow-guided semantic states cleanly without duplicate characters', async () => {
    const states = [
      'idle',
      'greeting',
      'excited',
      'thinking',
      'correct_answer',
      'incorrect_supportive',
      'encouragement',
      'talking',
      'listening',
      'surprise',
      'lesson_complete',
      'victory_dance',
      'sleepy',
      'curious_discovery',
      'welcome_back',
    ] as const;

    const view = await render(<Fox style={{ width: 80, height: 80 }} mood={states[0]} />);
    for (const s of states) {
      await view.rerender(<Fox style={{ width: 80, height: 80 }} mood={s} />);
      expect(screen.getAllByTestId('fox-mascot')).toHaveLength(1);
      expect(fox().props.accessibilityLabel).toBeTruthy();
    }
  });
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Fox } from '../components/Fox';

describe('Fox mascot', () => {
  it('shows the listening pose while an audio prompt plays', async () => {
    await render(<Fox style={{ width: 80, height: 80 }} listening />);
    expect(screen.getByRole('button').props.accessibilityLabel).toContain('listening');
  });

  it('lets a speaking voice line override listening', async () => {
    await render(<Fox style={{ width: 80, height: 80 }} listening speaking />);
    expect(screen.getByRole('button').props.accessibilityLabel).toContain('talking');
  });

  it('maps grading feedback to happy and confused poses', async () => {
    const view = await render(<Fox style={{ width: 80, height: 80 }} mood="correct" />);
    expect(screen.getByRole('button').props.accessibilityLabel).toContain('delighted');

    await view.rerender(<Fox style={{ width: 80, height: 80 }} mood="incorrect" />);
    expect(screen.getByRole('button').props.accessibilityLabel).toContain('confused');
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
});

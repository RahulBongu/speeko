// Jest setup: minimal mock for react-native-reanimated so vector mascot and other
// animated components can be imported in the node test environment.
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');
  const AnimatedView = (props: any) => React.createElement(View, props, props.children);
  const noop = () => 0;
  const identity = (v: any) => v;
  return {
    __esModule: true,
    default: { View: AnimatedView, createAnimatedComponent: (c: any) => c },
    View: AnimatedView,
    createAnimatedComponent: (c: any) => c,
    useSharedValue: (init: any) => ({ value: init }),
    useAnimatedStyle: (fn: any) => (typeof fn === 'function' ? fn() : {}),
    useAnimatedProps: (fn: any) => (typeof fn === 'function' ? fn() : {}),
    withRepeat: (v: any) => v,
    withSequence: (...args: any[]) => args[args.length - 1],
    withTiming: (v: any) => v,
    withSpring: (v: any) => v,
    withDelay: (d: any, v: any) => v,
    cancelAnimation: () => {},
    Easing: {
      in: identity,
      out: identity,
      inOut: identity,
      ease: {},
      quad: identity,
      cubic: identity,
      back: () => identity,
      bezier: () => identity,
      elastic: () => identity,
    },
    runOnJS: (fn: any) => fn,
    runOnUI: (fn: any) => fn,
  };
});

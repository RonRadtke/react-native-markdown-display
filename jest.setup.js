jest.mock(
  'react-native-accessibility-engine/lib/commonjs/helpers/isReactTestInstance',
  () => ({
    __esModule: true,
    default(candidate) {
      return (
        candidate !== null &&
        typeof candidate === 'object' &&
        typeof candidate.findAll === 'function' &&
        typeof candidate.findByProps === 'function' &&
        'props' in candidate &&
        'type' in candidate
      );
    },
  }),
);

require('react-native-accessibility-engine');

jest.mock('react-native-fit-image', () => {
  const React = require('react');

  function FitImage(props) {
    return React.createElement('FitImage', props, props.children);
  }

  return FitImage;
});

if (typeof global.window === 'undefined') {
  global.window = global;
}

if (typeof global.window.dispatchEvent !== 'function') {
  global.window.dispatchEvent = jest.fn();
}

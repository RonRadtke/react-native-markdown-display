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

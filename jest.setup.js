jest.mock('react-native-fit-image', () => {
  const React = require('react');

  function FitImage(props) {
    return React.createElement('FitImage', props, props.children);
  }

  return FitImage;
});

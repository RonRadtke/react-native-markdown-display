const React = require('react');
const renderer = require('react-test-renderer');
const {Linking} = require('react-native');
const Markdown = require('../src').default;

const renderMarkdown = (props, children) => {
  let tree;

  renderer.act(() => {
    tree = renderer.create(React.createElement(Markdown, props, children));
  });

  return tree;
};

describe('Markdown component', () => {
  beforeEach(() => {
    jest.spyOn(Linking, 'openURL').mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('opens links with React Native Linking by default', () => {
    const tree = renderMarkdown(null, '[link](https://example.com)');

    const link = tree.root.findByProps({accessibilityRole: 'link'});

    renderer.act(() => {
      link.props.onPress();
    });

    expect(Linking.openURL).toHaveBeenCalledWith('https://example.com');
  });

  test('passes link presses through the onLinkPress callback', () => {
    const onLinkPress = jest.fn(() => false);
    const tree = renderMarkdown({onLinkPress}, '[link](https://example.com)');

    const link = tree.root.findByProps({accessibilityRole: 'link'});

    renderer.act(() => {
      link.props.onPress();
    });

    expect(onLinkPress).toHaveBeenCalledWith('https://example.com');
  });

  test('renders a fallback item when maxTopLevelChildren is exceeded', () => {
    const tree = renderMarkdown({maxTopLevelChildren: 1}, '# One\n\n# Two');

    const json = tree.toJSON();

    expect(json.children).toHaveLength(2);
    expect(JSON.stringify(json)).toContain('...');
  });
});

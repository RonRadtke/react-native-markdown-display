# React Native Markdown Display [![npm version](https://badge.fury.io/js/@ronradtke%2Freact-native-markdown-display.svg)](https://badge.fury.io/js/@ronradtke%2Freact-native-markdown-display) [![Known Vulnerabilities](https://snyk.io/test/github/iamacup/react-native-markdown-display/badge.svg)](https://snyk.io/test/github/iamacup/react-native-markdown-display)

`@ronradtke/react-native-markdown-display` is a native React Native markdown toolkit.
It includes:

- a markdown viewer built around `<Markdown>`
- optional markdown input components built around `MarkdownTextInput` and `MarkdownComposer`

This package is intended to be a replacement for `react-native-markdown-renderer`, with stricter typing and a native rendering pipeline instead of a WebView.

## Install

### Yarn

```sh
yarn add @ronradtke/react-native-markdown-display
```

### npm

```sh
npm install @ronradtke/react-native-markdown-display
```

## Documentation

- Viewer guide: [VIEWER.md](VIEWER.md)
- Input guide: [INPUT.md](INPUT.md)
- Editor architecture note: [doc/markdown-editor-architecture.md](doc/markdown-editor-architecture.md)
- Example app: [example/README.md](example/README.md)

## Quick Start

### Viewer

```tsx
import React from 'react';
import {SafeAreaView, ScrollView} from 'react-native';
import Markdown from '@ronradtke/react-native-markdown-display';

const value = `
# Hello

This is **markdown** rendered with native React Native components.
`;

export default function App(): React.JSX.Element {
    return (
        <SafeAreaView>
            <ScrollView>
                <Markdown>{value}</Markdown>
            </ScrollView>
        </SafeAreaView>
    );
}
```

### Input

```tsx
import React from 'react';
import {SafeAreaView, View} from 'react-native';
import Markdown, {
    MarkdownComposer,
} from '@ronradtke/react-native-markdown-display';

export default function App(): React.JSX.Element {
    const [value, setValue] = React.useState('## Draft message');

    return (
        <SafeAreaView>
            <View style={{flex: 1, gap: 16, padding: 16}}>
                <MarkdownComposer
                    onChangeText={setValue}
                    previewEnabled
                    value={value}
                />
                <Markdown>{value}</Markdown>
            </View>
        </SafeAreaView>
    );
}
```

The viewer and input components are documented separately:

- Use [VIEWER.md](VIEWER.md) for rendering, styling, rules, `MarkdownIt`, `createMarkdownIt`, and preprocessing.
- Use [INPUT.md](INPUT.md) for `MarkdownTextInput`, `MarkdownComposer`, toolbars, prompts, shortcuts, and custom inputs.

Underline is shipped as an opt-in built-in plugin. See [VIEWER.md](VIEWER.md) and [INPUT.md](INPUT.md) for activation with `createMarkdownIt({underline: true})`.

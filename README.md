# React Native Markdown Display

[![npm version](https://badge.fury.io/js/@ronradtke%2Freact-native-markdown-display.svg)](https://badge.fury.io/js/@ronradtke%2Freact-native-markdown-display)
[![npm downloads](https://img.shields.io/npm/dm/@ronradtke/react-native-markdown-display.svg)](https://www.npmjs.com/package/@ronradtke/react-native-markdown-display)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Known Vulnerabilities](https://snyk.io/test/github/iamacup/react-native-markdown-display/badge.svg)](https://snyk.io/test/github/iamacup/react-native-markdown-display)

Markdown rendering and editing primitives for React Native, running only in JS. No native code needed.

`@ronradtke/react-native-markdown-display` turns markdown into real React Native views, not a WebView. It pairs a typed markdown viewer with optional input and composer components, so the same package can power read-only content, message previews, documentation screens, and markdown authoring flows.

## ✨ Why This Package

- ⚡ **Native rendering pipeline**: markdown is parsed with `markdown-it`, normalized into an AST, and rendered with React Native components.
- 🧱 **No WebView dependency**: content participates in your React Native layout, styling, theming, navigation, and event handling.
- 🧩 **Typed customization surface**: override styles, render rules, link handling, parser behavior, and image handling with TypeScript-friendly APIs.
- ✍️ **Viewer and editor pieces**: use `<Markdown>` for display, `MarkdownStream` for streaming text, or `MarkdownTextInput` / `MarkdownComposer` for authoring.
- 🔌 **Extensible markdown support**: bring your own `markdown-it` instance or opt into bundled plugins such as underline.

This package is intended as a modern replacement for `react-native-markdown-renderer`, with stricter typing and a maintained native rendering architecture.

## 📦 Install

### Yarn

```sh
yarn add @ronradtke/react-native-markdown-display
```

### npm

```sh
npm install @ronradtke/react-native-markdown-display
```

## 🚀 Quick Start

### 👁️ Viewer

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

### ✍️ Composer

```tsx
import React from 'react';
import {SafeAreaView, View} from 'react-native';
import Markdown, {MarkdownComposer} from '@ronradtke/react-native-markdown-display';

export default function App(): React.JSX.Element {
    const [value, setValue] = React.useState('## Draft message');

    return (
        <SafeAreaView>
            <View style={{flex: 1, gap: 16, padding: 16}}>
                <MarkdownComposer onChangeText={setValue} previewEnabled value={value} />
                <Markdown>{value}</Markdown>
            </View>
        </SafeAreaView>
    );
}
```

## 🛠️ What You Can Build

| Use case | Component |
| --- | --- |
| 📖 Render markdown content | `<Markdown>` |
| ⏱️ Render actively streaming markdown text | `MarkdownStream` |
| ⌨️ Add a markdown-aware text input | `MarkdownTextInput` |
| 🧰 Ship an opinionated markdown composer with toolbar and preview | `MarkdownComposer` |
| 🔎 Preview an editor value with the same renderer | `MarkdownPreview` |

## 📝 Supported Markdown

The default parser supports common markdown content including:

- headings, paragraphs, horizontal rules, and blockquotes
- bold, italic, strikethrough, inline code, and links
- ordered and unordered lists
- fenced and indented code blocks
- tables
- images with configurable URL handlers
- typographer replacements from `markdown-it`

You can extend or restrict the syntax by passing a custom `markdown-it` instance through the `markdownit` prop. Underline support is included as an opt-in plugin via `createMarkdownIt({underline: true})` or `underlinePlugin`.

## 🎛️ Customization

The viewer is designed to be customized at the right layer:

- 🎨 use `style` for visual changes
- 🧬 use `rules` when a markdown node should render differently
- 🔗 use `onLinkPress` to control navigation
- ⚙️ use `markdownit` to change parsing behavior
- 🖼️ use `allowedImageHandlers` and `defaultImageHandler` to control image sources
- 🧭 use `debugPrintTree` to inspect the AST while integrating custom syntax

## 📚 Documentation

- [Viewer guide](VIEWER.md): rendering, styles, custom rules, `MarkdownIt`, preprocessing, and streaming
- [Input guide](INPUT.md): `MarkdownTextInput`, `MarkdownComposer`, toolbars, prompts, shortcuts, and previews
- [Editor architecture note](doc/markdown-editor-architecture.md): internal editor model and design notes
- [Example app](example/README.md): local example project

## 📄 License

MIT

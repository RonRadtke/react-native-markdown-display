# Viewer Guide

This guide covers the rendering side of the library: `<Markdown>`, custom rules, custom styles, `MarkdownIt`, `createMarkdownIt`, and AST preprocessing.

## Overview

`<Markdown>` takes a markdown string or a preprocessed AST and renders it with native React Native components.
It does not use a WebView.

Key renderer files in this repo:

- default entrypoint: [`src/index.tsx`](src/index.tsx)
- default render rules: [`src/lib/view/renderRules.tsx`](src/lib/view/renderRules.tsx)
- default styles: [`src/lib/view/styles.ts`](src/lib/view/styles.ts)
- shared renderer types: [`src/lib/view/types.ts`](src/lib/view/types.ts)

## Basic Usage

```tsx
import React from 'react';
import {SafeAreaView, ScrollView} from 'react-native';
import Markdown from '@ronradtke/react-native-markdown-display';

const value = `
# h1 Heading

**This is bold text**

This is normal text.
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

## `<Markdown>` Props

Common props:

| Prop | Default | Description |
| --- | --- | --- |
| `children` | required | Markdown string to render, or a preprocessed AST tree |
| `style` | default style map | Style overrides for rules |
| `mergeStyle` | `true` | Merge your style map with the defaults instead of replacing them |
| `rules` | default rule map | Custom render rules |
| `onLinkPress` | opens the URL with `Linking.openURL` | Override link handling |
| `debugPrintTree` | `false` | Logs the AST tree used by the renderer |

Less common props:

| Prop | Default | Description |
| --- | --- | --- |
| `colorScheme` | `undefined` (light) | `'light'` or `'dark'` — selects the built-in dark style set for block elements |
| `onCopyCode` | `undefined` | Callback fired when the user presses the copy button on a fenced code block. Signature: `(code: string, language: string) => void`. The copy button is only shown when this prop is provided. |
| `renderer` | internal `AstRenderer` | Supply your own renderer instance |
| `markdownit` | `createMarkdownIt()` | Custom `markdown-it` instance |
| `textcomponent` | `Text` | Replace the base text component |
| `maxTopLevelChildren` | `null` | Cap the number of top-level rendered nodes |
| `topLevelMaxExceededItem` | `<Text key="dotdotdot">...</Text>` | Rendered when `maxTopLevelChildren` is exceeded |
| `allowedImageHandlers` | `['data:image/png;base64', 'data:image/gif;base64', 'data:image/jpeg;base64', 'https://', 'http://']` | Allowed image URL prefixes |
| `defaultImageHandler` | `'https://'` | Prefix applied to image URLs that do not match the allowed list |

## Supported Markdown

Out of the box, the renderer supports the markdown produced by the default `createMarkdownIt()` configuration used in this package, including:

- headings
- horizontal rules
- emphasis, strong text, and strikethrough
- blockquotes
- unordered and ordered lists
- inline code, indented code blocks, and fenced code blocks
- tables
- links and autolinks
- images
- typographer replacements from `markdown-it`

The exact surface can also be extended with `markdown-it` plugins.

Underline is shipped as an opt-in built-in plugin, not enabled by default.

## Styling

The simplest way to customize the viewer is with the `style` prop.

```tsx
import React from 'react';
import {StyleSheet} from 'react-native';
import Markdown from '@ronradtke/react-native-markdown-display';

const styles = StyleSheet.create({
    body: {
        color: '#22303C',
        fontSize: 16,
    },
    heading1: {
        color: '#102030',
        fontSize: 32,
    },
    code_block: {
        backgroundColor: '#F5F7FA',
        borderColor: '#D8E0E8',
        borderWidth: 1,
        color: '#102030',
    },
});

export default function Example(): React.JSX.Element {
    return (
        <Markdown style={styles}>
            {'# Title\n\n```ts\nconst value = 1;\n```'}
        </Markdown>
    );
}
```

Important styling note:

- `body` text cascades through most content and is usually the best place to set global text color and size
- `text` is not applied to every visible glyph, especially list markers
- table and list blocks can be styled independently through entries like `table`, `thead`, `tbody`, `tr`, `bullet_list`, and `ordered_list`

## Custom Rules

Use `rules` when you need to change how a node is rendered, not just how it is styled.

```tsx
import React from 'react';
import {Text} from 'react-native';
import Markdown from '@ronradtke/react-native-markdown-display';

export default function Example(): React.JSX.Element {
    return (
        <Markdown
            rules={{
                link: (node, children, _parent, styles) => (
                    <Text key={node.key} style={[styles.link, {textDecorationLine: 'none'}]}>
                        {children}
                    </Text>
                ),
            }}
        >
            {'[Docs](https://example.com)'}
        </Markdown>
    );
}
```

If you are integrating custom `markdown-it` plugins, `debugPrintTree` is useful to inspect the emitted AST node types before writing a render rule.

## Handling Links

```tsx
import React from 'react';
import Markdown from '@ronradtke/react-native-markdown-display';

export default function Example(): React.JSX.Element {
    return (
        <Markdown
            onLinkPress={(url) => {
                console.log('Open URL:', url);
                return true;
            }}
        >
            {'[Docs](https://example.com)'}
        </Markdown>
    );
}
```

Return `true` when you handled the link yourself. If you do nothing, the default implementation opens the URL with React Native `Linking`.

## Custom `MarkdownIt`

You can supply your own `MarkdownIt` instance to:

- enable or disable parser features
- add plugins
- change typographer or linkify behavior

```tsx
import React from 'react';
import Markdown, {createMarkdownIt} from '@ronradtke/react-native-markdown-display';

const markdownit = createMarkdownIt().disable(['link', 'image']);

export default function Example(): React.JSX.Element {
    return (
        <Markdown markdownit={markdownit}>
            {'# Heading\n\n[This will render as plain text](https://example.com)'}
        </Markdown>
    );
}
```

## Adding `markdown-it` Plugins

Viewer plugin support is already available through the `markdownit` prop.

## Built-In Underline Plugin

Underline support is bundled with this package as a plugin export.

You can activate it either by:

- using `createMarkdownIt({underline: true})`
- or calling `.use(underlinePlugin)` on your own parser instance

Example:

```tsx
import React from 'react';
import Markdown, {createMarkdownIt} from '@ronradtke/react-native-markdown-display';

const markdownit = createMarkdownIt({underline: true});

export default function Example(): React.JSX.Element {
    return <Markdown markdownit={markdownit}>{'++underlined++'}</Markdown>;
}
```

Example with an emoji plugin:

### 1. Install the plugin

```sh
npm install markdown-it-emoji
```

or

```sh
yarn add markdown-it-emoji
```

### 2. Activate the plugin

```tsx
import React from 'react';
import markdownItEmoji from 'markdown-it-emoji';
import Markdown, {createMarkdownIt} from '@ronradtke/react-native-markdown-display';

const markdownit = createMarkdownIt().use(markdownItEmoji);

export default function Example(): React.JSX.Element {
    return (
        <Markdown markdownit={markdownit}>
            {'Hello :wave:'}
        </Markdown>
    );
}
```

### 3. Native linking

No React Native linking step is needed for normal `markdown-it` plugins.
They are JavaScript parser extensions and are activated entirely through `createMarkdownIt().use(plugin)` or `MarkdownIt(...).use(plugin)`.

### 4. If the plugin adds new node types

Some plugins only transform text and work immediately.
Plugins that add new render nodes may also require:

- `rules`
- `style`
- `debugPrintTree` while integrating

## Preprocessing

If you need to tokenize markdown outside the component, you can pass an AST directly.

```tsx
import React from 'react';
import Markdown, {
    createMarkdownIt,
    stringToTokens,
    tokensToAST,
} from '@ronradtke/react-native-markdown-display';

const markdownit = createMarkdownIt();
const source = '# Hello\n\nThis is **bold**.';
const ast = tokensToAST(stringToTokens(source, markdownit));

export default function Example(): React.JSX.Element {
    return <Markdown>{ast}</Markdown>;
}
```

## Plugin Integration

Any `markdown-it` compatible plugin can be used as long as you also provide matching render rules for any new node types it emits.

A practical workflow is:

1. Create a custom parser instance with your plugin.
2. Render once with `debugPrintTree`.
3. Check the node types in the logged AST.
4. Add matching `rules` and optional `style` entries for those node types.

## Dark Mode

Pass `colorScheme="dark"` to activate the built-in dark style set for block and container elements (code blocks, fences, blockquotes, table borders, horizontal rules).

```tsx
import React from 'react';
import {useColorScheme} from 'react-native';
import Markdown from '@ronradtke/react-native-markdown-display';

export default function Example(): React.JSX.Element {
    const scheme = useColorScheme(); // 'light' | 'dark' | null

    return (
        <Markdown colorScheme={scheme === 'dark' ? 'dark' : 'light'}>
            {'# Hello\n\n```js\nconst x = 1;\n```'}
        </Markdown>
    );
}
```

### What `darkStyles` covers

The built-in `darkStyles` (GitHub Dark palette) sets background and border colors for:

- `code_inline`, `code_block` — inline and indented code
- `fence`, `fence_header`, `fence_code` — fenced code blocks
- `blockquote` — blockquote containers
- `table`, `tr`, `hr`, `blocklink` — table and rule borders

**Text, headings, and links are intentionally left unstyled** — the library does not know what foreground colors your app uses. Set them through the `style` prop or your own theme.

### Overriding individual dark-mode colors

With `mergeStyle={true}` (the default), anything in your `style` prop is merged on top of the base styles. You can override a single key without touching the rest:

```tsx
import React from 'react';
import Markdown from '@ronradtke/react-native-markdown-display';

export default function Example(): React.JSX.Element {
    return (
        <Markdown
            colorScheme="dark"
            style={{
                body: {color: '#e6edf3'},
                heading1: {color: '#ffffff'},
                link: {color: '#58a6ff'},
                // override just the fence background
                fence: {borderColor: '#444c56'},
            }}
        >
            {'# Hello\n\nSome **markdown**.'}
        </Markdown>
    );
}
```

### Using `darkStyles` directly

If you prefer to build your own merged style map outside the component, the base dark style object is exported:

```tsx
import Markdown, {darkStyles} from '@ronradtke/react-native-markdown-display';

const myDarkStyle = {
    ...darkStyles,
    body: {color: '#e6edf3'},
    heading1: {color: '#ffffff'},
};

<Markdown style={myDarkStyle} mergeStyle={false}>...</Markdown>
```

### Integration with theming libraries

If you use React Native Paper, styled-components, or another library that manages your color scheme separately from `useColorScheme()`, source `colorScheme` from your own theme context so it stays in sync with manual theme toggles:

```tsx
// React Native Paper example
import {useTheme} from 'react-native-paper';
import Markdown from '@ronradtke/react-native-markdown-display';

function MessageBubble({content}: {content: string}) {
    const theme = useTheme();
    const colorScheme = theme.dark ? 'dark' : 'light';

    return <Markdown colorScheme={colorScheme}>{content}</Markdown>;
}
```

Do not call `useColorScheme()` inside a library-agnostic component that also uses `useTheme()` — they can return different values if the user has toggled the theme manually.

## Code Blocks

### Syntax highlighting

Fenced code blocks are automatically syntax-highlighted using `prism-react-renderer`. The language is read from the opening fence info string (e.g. ` ```typescript `). Unknown languages fall back to plain text.

Long lines are horizontally scrollable — they never wrap inside a code block.

The highlight theme follows `colorScheme`: `oneLight` for light, `oneDark` for dark.

Style keys you can override for code blocks:

| Key | Applies to |
| --- | --- |
| `fence` | Outer container `View` (border, borderRadius) |
| `fence_header` | Header bar `View` (language label row) |
| `fence_language_label` | Language label `Text` |
| `fence_copy_button` | Copy button `Pressable` |
| `fence_copy_text` | "Copied!" feedback `Text` |
| `fence_code` | Code area `View` (background, padding) |
| `fence_token` | Each syntax token `Text` (fontFamily, fontSize) |

### Copy button

The copy button is only rendered when you pass an `onCopyCode` callback. Your callback receives the raw code string and the language name; you handle the actual clipboard write:

```tsx
import React from 'react';
import Clipboard from '@react-native-clipboard/clipboard';
import Markdown from '@ronradtke/react-native-markdown-display';

export default function Example(): React.JSX.Element {
    return (
        <Markdown
            onCopyCode={(code, language) => {
                Clipboard.setString(code);
                console.log('Copied', language, 'snippet');
            }}
        >
            {'```js\nconsole.log("hello");\n```'}
        </Markdown>
    );
}
```

The button displays a clipboard icon while idle and switches to a "Copied!" label for 2 seconds after being pressed.

## Streaming

`MarkdownStream` is a streaming-safe wrapper around the same rendering pipeline. It accepts the same props as `Markdown` plus a few extras:

| Prop | Default | Description |
| --- | --- | --- |
| `children` | required | Markdown string (AST not accepted) |
| `streaming` | `false` | When `true`, seals open fences before parsing and shows a blinking cursor |
| `cursorColor` | `'#000000'` | Color of the blinking cursor |
| `cursorStyle` | `undefined` | Override the cursor `View` style |

```tsx
import React, {useEffect, useState} from 'react';
import {MarkdownStream} from '@ronradtke/react-native-markdown-display';

export default function StreamingMessage(): React.JSX.Element {
    const [text, setText] = useState('');
    const [streaming, setStreaming] = useState(true);

    useEffect(() => {
        // simulate token arrivals
        const tokens = '# Hello\n\nThis is a **streamed** response.'.split(' ');
        let i = 0;
        const id = setInterval(() => {
            setText(prev => prev + (i > 0 ? ' ' : '') + tokens[i]);
            if (++i >= tokens.length) {
                clearInterval(id);
                setStreaming(false);
            }
        }, 80);
        return () => clearInterval(id);
    }, []);

    return (
        <MarkdownStream streaming={streaming} cursorColor="#333333">
            {text}
        </MarkdownStream>
    );
}
```

## Useful Exports

Viewer-related exports from the package root:

- `Markdown` (default export)
- `MarkdownStream`
- `MarkdownIt`
- `createMarkdownIt`
- `underlinePlugin`
- `darkStyles`
- `parser`
- `renderRules`
- `styles`
- `stringToTokens`
- `tokensToAST`
- `AstRenderer`
- `openUrl`
- `removeTextStyleProps`

Types:

- `MarkdownProps`
- `MarkdownStreamProps`
- `MarkdownStyleMap`
- `MarkdownStyleObject`
- `OnCopyCode`
- `OnLinkPress`
- `RenderRules`
- `ASTNode`

## Notes

- The default rule and style keys are defined in [`src/lib/view/renderRules.tsx`](src/lib/view/renderRules.tsx) and [`src/lib/view/styles.ts`](src/lib/view/styles.ts).
- If you are migrating from `react-native-markdown-renderer`, focus first on style differences. The renderer is compatible in intent, but the style merging model is stricter and more explicit.

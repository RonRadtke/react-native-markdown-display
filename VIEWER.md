# Viewer Guide

This guide covers the rendering side of the library: `<Markdown>`, custom rules, custom styles, `MarkdownIt`, and AST preprocessing.

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
| `renderer` | internal `AstRenderer` | Supply your own renderer instance |
| `markdownit` | `MarkdownIt({ typographer: true })` | Custom `markdown-it` instance |
| `textcomponent` | `Text` | Replace the base text component |
| `maxTopLevelChildren` | `null` | Cap the number of top-level rendered nodes |
| `topLevelMaxExceededItem` | `<Text key="dotdotdot">...</Text>` | Rendered when `maxTopLevelChildren` is exceeded |
| `allowedImageHandlers` | `['data:image/png;base64', 'data:image/gif;base64', 'data:image/jpeg;base64', 'https://', 'http://']` | Allowed image URL prefixes |
| `defaultImageHandler` | `'https://'` | Prefix applied to image URLs that do not match the allowed list |

## Supported Markdown

Out of the box, the renderer supports the markdown produced by the current `markdown-it` configuration used in this package, including:

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
import Markdown, {MarkdownIt} from '@ronradtke/react-native-markdown-display';

const markdownit = MarkdownIt({typographer: true}).disable(['link', 'image']);

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
import Markdown, {MarkdownIt} from '@ronradtke/react-native-markdown-display';

const markdownit = MarkdownIt({typographer: true}).use(markdownItEmoji);

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
They are JavaScript parser extensions and are activated entirely through `MarkdownIt(...).use(plugin)`.

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
    MarkdownIt,
    stringToTokens,
    tokensToAST,
} from '@ronradtke/react-native-markdown-display';

const markdownit = MarkdownIt({typographer: true});
const source = '# Hello\n\nThis is **bold**.';
const ast = tokensToAST(stringToTokens(source, markdownit));

export default function Example(): React.JSX.Element {
    return <Markdown>{ast}</Markdown>;
}
```

## Plugin Integration

Any `markdown-it` compatible plugin can be used as long as you also provide matching render rules for any new node types it emits.

A practical workflow is:

1. Create a custom `MarkdownIt` instance with your plugin.
2. Render once with `debugPrintTree`.
3. Check the node types in the logged AST.
4. Add matching `rules` and optional `style` entries for those node types.

## Useful Exports

Viewer-related exports from the package root:

- `Markdown` (default export)
- `MarkdownIt`
- `parser`
- `renderRules`
- `styles`
- `stringToTokens`
- `tokensToAST`
- `AstRenderer`
- `openUrl`
- `removeTextStyleProps`

## Notes

- The default rule and style keys are defined in [`src/lib/view/renderRules.tsx`](src/lib/view/renderRules.tsx) and [`src/lib/view/styles.ts`](src/lib/view/styles.ts).
- If you are migrating from `react-native-markdown-renderer`, focus first on style differences. The renderer is compatible in intent, but the style merging model is stricter and more explicit.

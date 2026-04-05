# Input Guide

This guide covers the editing side of the library:

- `MarkdownTextInput`
- `MarkdownComposer`
- `MarkdownPreview`
- markdown command utilities such as `applyInlineFormat`

There was no dedicated user-facing input guide before this file. The only editor note in the repo was the internal architecture document in [doc/markdown-editor-architecture.md](doc/markdown-editor-architecture.md).

## Overview

The editor surface in this package is intentionally plain-text based:

- markdown is the source of truth
- the input uses native React Native `TextInput`
- formatting commands transform markdown text plus selection
- preview uses the same renderer as `<Markdown>`

This means the editor supports standard markdown patterns already understood by the library. It does not use a rich-text or attributed-text editing model.

## Available Components

### `MarkdownTextInput`

Low-level editing primitive:

- wraps native `TextInput`
- supports toolbar commands
- keeps selection in sync
- exposes formatting events
- supports a custom input component

### `MarkdownComposer`

Higher-level editor wrapper:

- compact and expanded modes
- minimized and expanded toolbar presets
- built-in link and table prompts
- optional preview toggle in expanded mode

### `MarkdownPreview`

Standalone preview component for a markdown string using the same renderer pipeline as `<Markdown>`.

## Supported Commands

Inline commands:

- `bold`
- `italic`
- `underline`
- `strikethrough`
- `inline-code`

Block commands:

- `heading-one`
- `heading-two`
- `heading-three`
- `blockquote`
- `bullet-list`
- `ordered-list`
- `code-block`

Other commands:

- `link`
- `table`

## Basic `MarkdownTextInput`

```tsx
import React from 'react';
import {SafeAreaView} from 'react-native';
import {MarkdownTextInput} from '@ronradtke/react-native-markdown-display';

export default function Example(): React.JSX.Element {
    const [value, setValue] = React.useState('Write **markdown** here');

    return (
        <SafeAreaView>
            <MarkdownTextInput
                onChangeText={setValue}
                placeholder="Write markdown"
                value={value}
            />
        </SafeAreaView>
    );
}
```

The default `MarkdownTextInput` toolbar contains:

- bold
- italic
- inline code

Underline is available as a shipped opt-in plugin and command, but it is not shown in the default toolbar.

## Basic `MarkdownComposer`

```tsx
import React from 'react';
import {SafeAreaView} from 'react-native';
import {MarkdownComposer} from '@ronradtke/react-native-markdown-display';

export default function Example(): React.JSX.Element {
    const [value, setValue] = React.useState('## Draft');

    return (
        <SafeAreaView>
            <MarkdownComposer
                onChangeText={setValue}
                previewEnabled
                value={value}
            />
        </SafeAreaView>
    );
}
```

Important composer behavior:

- compact mode is the default
- expanded mode uses a taller input
- if `previewEnabled` is `true`, the preview toggle is shown in expanded mode
- preview is hidden by default until the user taps `Show preview`
- underline uses `++text++` syntax when you activate the shipped underline plugin

## Toolbar Items

Toolbar items accept either:

- a command button
- a custom action button
- a single-level menu containing command and custom action buttons

The shared type is `MarkdownToolbarItem`.

Command item shape:

```tsx
{
    accessibilityLabel: 'Bold',
    command: 'bold',
    label: 'B',
}
```

Menu item shape:

```tsx
{
    accessibilityLabel: 'Insert heading',
    label: 'H',
    items: [
        {command: 'heading-one', label: 'H1'},
        {command: 'heading-two', label: 'H2'},
        {command: 'heading-three', label: 'H3'},
    ],
}
```

Custom action item shape:

```tsx
{
    accessibilityLabel: 'Insert warning block',
    action: {
        type: 'wrap',
        prefix: '::: warning\n',
        suffix: '\n:::',
        placeholder: 'Warning text',
    },
    label: 'Warn',
}
```

Custom actions are declarative and support two forms:

- `type: 'wrap'` to wrap the current selection or insert a placeholder between `prefix` and `suffix`
- `type: 'insert'` to insert a markdown snippet directly, with optional caret offsets

Example warning button:

```tsx
import React from 'react';
import {
    MarkdownComposer,
    type MarkdownToolbarItem,
} from '@ronradtke/react-native-markdown-display';

const expandedToolbarItems: readonly MarkdownToolbarItem[] = [
    {command: 'bold', label: 'B'},
    {
        accessibilityLabel: 'Insert warning block',
        action: {
            type: 'wrap',
            prefix: '::: warning\n',
            suffix: '\n:::',
            placeholder: 'Warning text',
        },
        label: 'Warn',
    },
];
```

### Icon Labels

Toolbar labels can be plain text or any `ReactNode`, so icon components are supported directly.

```tsx
import React from 'react';
import {Text} from 'react-native';
import {
    MarkdownComposer,
    type MarkdownToolbarItem,
} from '@ronradtke/react-native-markdown-display';

const minimizedToolbarItems: readonly MarkdownToolbarItem[] = [
    {
        accessibilityLabel: 'Bold',
        command: 'bold',
        label: <Text style={{fontWeight: '700'}}>B</Text>,
    },
    {
        accessibilityLabel: 'Insert heading',
        label: <Text>H</Text>,
        items: [
            {accessibilityLabel: 'Heading one', command: 'heading-one', label: <Text>H1</Text>},
            {accessibilityLabel: 'Heading two', command: 'heading-two', label: <Text>H2</Text>},
            {accessibilityLabel: 'Heading three', command: 'heading-three', label: <Text>H3</Text>},
        ],
    },
];

export default function Example(): React.JSX.Element {
    const [value, setValue] = React.useState('');

    return (
        <MarkdownComposer
            minimizedToolbarItems={minimizedToolbarItems}
            onChangeText={setValue}
            value={value}
        />
    );
}
```

For icon-only buttons, always set `accessibilityLabel`.

## Minimized vs Expanded Toolbars

`MarkdownComposer` supports two toolbar configurations:

- `minimizedToolbarItems` for compact mode
- `expandedToolbarItems` for expanded mode

If the active toolbar item list is empty, the toolbar row is hidden.

```tsx
<MarkdownComposer
    minimizedToolbarItems={[]}
    onChangeText={setValue}
    value={value}
/>
```

`compactToolbarItems` still exists as a compatibility alias, but new code should prefer `minimizedToolbarItems`.

## Plugins In Composer Preview

Viewer plugin support already works through `<Markdown markdownit={...} />`.
For input, composer preview can now use the same parser and renderer configuration through `previewProps`.

## Built-In Underline Plugin

Underline support is shipped with the package, but it is opt-in.

To activate it:

1. Create a parser with `createMarkdownIt({underline: true})`
2. Pass that parser into `previewProps.markdownit`
3. Add an underline toolbar item yourself if you want an editor button

Example:

```tsx
import React from 'react';
import {
    createMarkdownIt,
    MarkdownComposer,
    type MarkdownToolbarItem,
} from '@ronradtke/react-native-markdown-display';

const markdownit = createMarkdownIt({underline: true});

const expandedToolbarItems: readonly MarkdownToolbarItem[] = [
    {command: 'bold', label: 'B'},
    {command: 'underline', label: 'U'},
];

export default function Example(): React.JSX.Element {
    const [value, setValue] = React.useState('++underlined++');

    return (
        <MarkdownComposer
            expandedToolbarItems={expandedToolbarItems}
            onChangeText={setValue}
            previewEnabled
            previewProps={{markdownit}}
            value={value}
        />
    );
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

### 2. Create a configured `MarkdownIt` instance

```tsx
import markdownItEmoji from 'markdown-it-emoji';
import {createMarkdownIt} from '@ronradtke/react-native-markdown-display';

const markdownit = createMarkdownIt().use(markdownItEmoji);
```

### 3. Pass it into composer preview

```tsx
import React from 'react';
import markdownItEmoji from 'markdown-it-emoji';
import {
    createMarkdownIt,
    MarkdownComposer,
} from '@ronradtke/react-native-markdown-display';

const markdownit = createMarkdownIt().use(markdownItEmoji);

export default function Example(): React.JSX.Element {
    const [value, setValue] = React.useState('Hello :wave:');

    return (
        <MarkdownComposer
            onChangeText={setValue}
            previewEnabled
            previewProps={{markdownit}}
            value={value}
        />
    );
}
```

### 4. Native linking

No React Native linking step is required for normal `markdown-it` plugins.
They are JavaScript parser extensions, so activation happens through `.use(plugin)`.

### 5. If the plugin adds custom render nodes

Pass the same viewer-side configuration through `previewProps`, for example:

- `previewProps.markdownit`
- `previewProps.rules`
- `previewProps.style`
- `previewProps.onLinkPress`

That keeps the composer preview aligned with your main `<Markdown>` renderer.

## Built-in Link and Table Prompts

`MarkdownComposer` adds built-in prompts for `link` and `table` commands when you do not fully override them yourself.

- `link` prompts for title and URL
- `table` prompts for column and row counts

If you provide `resolveCommandPayload`, the behavior is:

- return a payload object to fully control the command
- return `null` to cancel the command

If you want the built-in composer prompt behavior for links and tables, omit `resolveCommandPayload`.

Example:

```tsx
<MarkdownComposer
    onChangeText={setValue}
    resolveCommandPayload={(command) =>
        command === 'link'
            ? {
                  command: 'link',
                  link: {
                      title: 'Docs',
                      url: 'https://example.com',
                  },
              }
            : null
    }
    value={value}
/>
```

## Custom Input Components

Use `inputComponent` when you want to swap the native `TextInput` for a wrapper around another input implementation, such as a Material-style field.

Your component must:

- forward a `TextInput` ref
- accept the managed props from `MarkdownManagedTextInputProps`
- pass through `value`, `selection`, `onChangeText`, and `onSelectionChange`

```tsx
import React from 'react';
import {TextInput, View} from 'react-native';
import {
    MarkdownTextInput,
    type MarkdownManagedTextInputProps,
} from '@ronradtke/react-native-markdown-display';

const MaterialLikeInput = React.forwardRef<TextInput, MarkdownManagedTextInputProps>(
    function MaterialLikeInput(props, ref) {
        return (
            <View style={{borderWidth: 1, borderRadius: 8, paddingHorizontal: 12}}>
                <TextInput {...props} ref={ref} style={[{paddingVertical: 12}, props.style]}/>
            </View>
        );
    },
);

export default function Example(): React.JSX.Element {
    const [value, setValue] = React.useState('');

    return (
        <MarkdownTextInput
            inputComponent={MaterialLikeInput}
            onChangeText={setValue}
            value={value}
        />
    );
}
```

## Shortcuts

When `enableShortcuts` is `true`:

- pressing Enter after a blockquote line continues with `> `
- pressing Enter after a bullet list item continues with the same bullet marker
- pressing Enter after an ordered list item increments the number and places the caret after the new marker
- pressing Enter on an empty blockquote/list marker exits that marker

These are plain markdown text transforms, not rich-text behaviors.

## Utility Exports

The package root also exports pure formatting helpers:

- `applyInlineFormat`
- `applyBlockFormat`
- `applyLinkFormat`
- `applyTableFormat`
- `createMarkdownTable`
- `applyMarkdownShortcut`
- `normalizeSelection`
- `getSelectedText`

These are useful if you want to build your own toolbar or command UI.

## `MarkdownTextInput` Props

`MarkdownTextInput` accepts normal React Native `TextInput` props except the controlled value/selection props managed by the component itself.

Editor-specific props:

| Prop | Default | Description |
| --- | --- | --- |
| `value` | required | Markdown string |
| `onChangeText` | required | Called with the updated markdown |
| `toolbarItems` | built-in bold/italic/inline-code items | Toolbar items for this input |
| `selection` | internal selection state | Controlled selection |
| `enableShortcuts` | `true` | Enables Enter-based markdown shortcuts |
| `resolveCommandPayload` | `undefined` | Async or sync payload resolver used before applying a command |
| `onCommand` | `undefined` | Receives the payload plus the resulting markdown/selection |
| `inputComponent` | native `TextInput` | Custom ref-forwarding input wrapper |
| `compactMaxHeight` | `undefined` | Caps height when the input is used in auto-grow compact mode |

## `MarkdownComposer` Props

`MarkdownComposer` extends `MarkdownTextInput` and owns the compact/expanded editor behavior.

Composer-specific props:

| Prop | Default | Description |
| --- | --- | --- |
| `initialMode` | `'compact'` | Initial composer mode |
| `minimizedToolbarItems` | built-in compact toolbar | Toolbar items for compact mode |
| `compactToolbarItems` | compatibility alias | Legacy compact toolbar prop |
| `expandedToolbarItems` | built-in expanded toolbar | Toolbar items for expanded mode |
| `composerStyle` | `undefined` | Style applied to the outer composer container |
| `textInputStyle` | `undefined` | Style applied to the managed text input |
| `onModeChange` | `undefined` | Called when the composer toggles between compact and expanded |
| `previewEnabled` | `false` | Enables the preview toggle in expanded mode |
| `previewProps` | `undefined` | Additional preview configuration such as `markdownit`, `rules`, `style`, and other viewer render options |
| `previewLabel` | `'Preview'` | Label rendered above preview content |
| `previewEmptyState` | `'Nothing to preview yet.'` | Empty preview copy |
| `previewToggleLabels` | `{ show: 'Show preview', hide: 'Hide preview' }` | Toggle labels |
| `renderExpandButtonLabel` | built-in `Expand` / `Collapse` labels | Custom expand/collapse control content |

## `MarkdownPreview` Props

| Prop | Default | Description |
| --- | --- | --- |
| `value` | required | Markdown string to preview |
| `label` | `'Preview'` | Preview heading |
| `emptyState` | `'Nothing to preview yet.'` | Empty preview copy |
| `style` | `null` | Viewer style overrides for the preview content |
| `previewContainerStyle` | `undefined` | Style for the preview card container |
| `markdownit` | `createMarkdownIt()` | Custom parser instance used for preview rendering; opt-in features like underline must be enabled on that instance |
| `rules` | default viewer rules | Custom render rules for preview |
| `renderer` | internal renderer | Custom renderer instance for preview |
| `mergeStyle` | `true` | Merge preview styles with defaults instead of replacing them |
| `onLinkPress` | default link opener | Override link handling in preview |

## Current Editing Model

The editor stays within standard markdown text and selection transforms. That keeps it portable and deterministic, but it also means:

- the stored value is always markdown text
- formatting is applied by inserting/removing markdown markers
- preview is the place where formatted output is rendered

If you need architecture-level background, see [doc/markdown-editor-architecture.md](doc/markdown-editor-architecture.md).

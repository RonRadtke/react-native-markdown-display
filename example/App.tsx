import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Alert, FlatList, KeyboardAvoidingView, type ListRenderItemInfo, Platform, Pressable, StatusBar, StyleSheet, Text, useColorScheme, View,} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import markdownItContainer from 'markdown-it-container';

import Markdown, {createMarkdownIt, MarkdownComposer, MarkdownStream, type MarkdownStyleMap, type MarkdownToolbarItem, type OnCopyCode, type RenderRules} from '../src';

interface ChatMessage {
    author: 'demo' | 'you';
    id: string;
    markdown: string;
    streaming?: boolean;
}

// ---------------------------------------------------------------------------
// Streaming demo
// ---------------------------------------------------------------------------

const STREAM_DEMO_ID = 'stream-demo';
const STREAM_TICK_MS = 80;
const STREAM_CHUNK_SIZE = 6;
const STREAM_START_DELAY_MS = 900;

const STREAM_DEMO_CONTENT =
    '## Streaming demo\n\n' +
    'This response arrives **token by token**, just like a real AI reply. ' +
    'The renderer stays stable at every stage — even mid-sentence and mid-fence.\n\n' +
    '### Inline formats\n\n' +
    'Combine *italic*, **bold**, ~~strikethrough~~, and `inline code` freely in the same paragraph.\n\n' +
    '### Code block\n\n' +
    '```javascript\n' +
    'function greet(name) {\n' +
    '    return `Hello, ${name}!`;\n' +
    '}\n\n' +
    'const result = greet("Hawk Intelligent Technologies");\n' +
    'console.log(result);\n' +
    '```\n\n' +
    'The closing fence is sealed automatically while streaming, so the block never collapses mid-stream.\n\n' +
    '### Lists\n\n' +
    '1. Source string arrives incrementally\n' +
    '2. Open fences are sealed before parsing\n' +
    '3. Parser produces a stable AST on each tick\n' +
    '4. Renderer outputs native components\n\n' +
    '- No WebView\n' +
    '- No HTML bridge\n' +
    '- Pure native `Text` and `View`\n\n' +
    '### Table\n\n' +
    '| Element | Streaming-safe |\n' +
    '| --- | --- |\n' +
    '| Heading | ✓ |\n' +
    '| Code fence | ✓ |\n' +
    '| Blockquote | ✓ |\n' +
    '| Table | ✓ |\n\n' +
    '> All powered by `sealIncompleteMarkdown` — a pure function that closes open fences before every parse pass.';

const STRUCTURED_MARKDOWN_LINE_PATTERN =
    /^(?:[-*+]\s+.+|\d+\.\s+.+|\|.*\|)$/;

const INITIAL_MESSAGES: ChatMessage[] = [
    {
        author: 'demo',
        id: 'message-1',
        markdown:
            '## Markdown chat demo\n\nThis example uses the new composer at the bottom and renders sent messages with `Markdown` above it.',
    },
    {
        author: 'demo',
        id: 'message-2',
        markdown:
            'Try `**bold**`, `_italic_`, `++underline++`, lists, tables, links, warning blocks, or expand the input for preview.\n\n- Native input\n- Expandable composer\n- Markdown render on send',
    },
    {
        author: 'demo',
        id: 'message-3',
        markdown:
            '::: warning\nThis warning block is rendered through `markdown-it-container` in both the chat bubbles and the composer preview.\n:::',
    },
];
const isTestEnvironment = typeof jest !== 'undefined';
const warningMarkdownIt = createMarkdownIt({underline: true}).use(
    markdownItContainer,
    'warning',
);
const warningRules: RenderRules = {
    container_warning: (node, children, _parent, styles) => (
        <View key={node.key} style={styles.container_warning}>
            <Text style={styles.container_warning_title}>Warning</Text>
            <View style={styles.container_warning_content}>{children}</View>
        </View>
    ),
};

type ToolbarIconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

const createToolbarIcon = (name: ToolbarIconName): React.ReactElement => (
    <MaterialDesignIcons
        accessible={false}
        color="#2B3137"
        name={name}
        size={18}
    />
);

const createMessageId = (value: number): string => `message-${value}`;

export const usesStructuredBubbleLayout = (markdown: string): boolean => {
    const lines = markdown
        .trim()
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    return (
        lines.length > 0 &&
        lines.every(line => STRUCTURED_MARKDOWN_LINE_PATTERN.test(line))
    );
};

const LIGHT_CHROME = {
    background: '#EAF0F5',
    headerBg: '#F5F8FB',
    headerBorder: '#D7E0E8',
    composerBg: '#F5F8FB',
    composerBorder: '#D7E0E8',
    demoBubbleBg: '#FFFFFF',
    demoBubbleBorder: '#D9E2EB',
    eyebrow: '#0A66C2',
    title: '#13202B',
    subtitle: '#526171',
    replayBg: '#EBF3FF',
    replayBorder: '#BFDBFE',
    replayIcon: '#0A66C2',
    replayText: '#0A66C2',
    sendEnabled: '#111E2B',
    sendDisabled: '#B9C3CC',
};

const DARK_CHROME = {
    background: '#0d1117',
    headerBg: '#161b22',
    headerBorder: '#30363d',
    composerBg: '#161b22',
    composerBorder: '#30363d',
    demoBubbleBg: '#1c2128',
    demoBubbleBorder: '#30363d',
    eyebrow: '#58a6ff',
    title: '#e6edf3',
    subtitle: '#8b949e',
    replayBg: '#0d2146',
    replayBorder: '#1f6feb',
    replayIcon: '#58a6ff',
    replayText: '#58a6ff',
    sendEnabled: '#e6edf3',
    sendDisabled: '#30363d',
};

const getMarkdownStyles = (isOwnMessage: boolean, dark = false): MarkdownStyleMap => ({
    body: {
        width: '100%',
    },
    bullet_list: {
        width: '100%',
    },
    bullet_list_content: {
        flex: 1,
    },
    code_block: {
        backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.16)' : (dark ? '#161b22' : '#EFF4F8'),
        borderColor: isOwnMessage ? 'rgba(255,255,255,0.22)' : (dark ? '#30363d' : '#CCD6E0'),
        color: isOwnMessage ? '#F8FBFF' : (dark ? '#e6edf3' : '#16202A'),
    },
    code_inline: {
        backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.16)' : (dark ? '#161b22' : '#EFF4F8'),
        borderColor: isOwnMessage ? 'rgba(255,255,255,0.22)' : (dark ? '#30363d' : '#CCD6E0'),
        color: isOwnMessage ? '#F8FBFF' : (dark ? '#e6edf3' : '#16202A'),
    },
    container_warning: {
        backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.12)' : (dark ? 'rgba(245,180,65,0.10)' : '#FFF4E5'),
        borderColor: isOwnMessage ? 'rgba(255,255,255,0.34)' : '#F5B041',
        borderLeftWidth: 4,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        width: '100%',
    },
    container_warning_content: {width: '100%'},
    container_warning_title: {
        color: isOwnMessage ? '#FFFFFF' : (dark ? '#F5B041' : '#8A3B12'),
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.6,
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    ...(isOwnMessage ? {
        fence: {borderColor: 'rgba(255,255,255,0.22)'},
    } : {}),
    heading1: {color: isOwnMessage ? '#F8FBFF' : (dark ? '#e6edf3' : '#14212B'), fontSize: 28},
    heading2: {color: isOwnMessage ? '#F8FBFF' : (dark ? '#e6edf3' : '#14212B'), fontSize: 22},
    heading3: {color: isOwnMessage ? '#F8FBFF' : (dark ? '#e6edf3' : '#14212B'), fontSize: 18},
    link: {
        color: isOwnMessage ? '#FFFFFF' : (dark ? '#58a6ff' : '#0A66C2'),
        textDecorationLine: 'underline',
    },
    list_item: {width: '100%'},
    ordered_list: {width: '100%'},
    ordered_list_content: {flex: 1},
    paragraph: {marginBottom: 8, marginTop: 0},
    strong: {
        color: isOwnMessage ? '#FFFFFF' : (dark ? '#ffffff' : '#10212E'),
        fontWeight: '700',
    },
    table: {
        width: '100%',
        borderColor: isOwnMessage ? 'rgba(255,255,255,0.28)' : (dark ? '#30363d' : '#CCD6E0'),
    },
    tbody: {width: '100%'},
    text: {
        color: isOwnMessage ? '#F8FBFF' : (dark ? '#e6edf3' : '#10212E'),
        fontSize: 15,
        lineHeight: 22,
    },
    thead: {width: '100%'},
    tr: {width: '100%'},
});

function App(): React.JSX.Element {
    const systemColorScheme = useColorScheme();
    const isDark = systemColorScheme === 'dark';
    const colorScheme = isDark ? 'dark' : 'light';
    const chrome = isDark ? DARK_CHROME : LIGHT_CHROME;

    const listRef = useRef<FlatList<ChatMessage>>(null);
    const messageCountRef = useRef(INITIAL_MESSAGES.length + 1);
    const streamPositionRef = useRef(0);
    const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [draft, setDraft] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
    const composerPreviewStyle = useMemo(() => getMarkdownStyles(false, isDark), [isDark]);

    const startStreamingDemo = useCallback((): void => {
        if (streamIntervalRef.current) {
            clearInterval(streamIntervalRef.current);
            streamIntervalRef.current = null;
        }
        streamPositionRef.current = 0;

        setMessages((prev) => {
            const exists = prev.some((m) => m.id === STREAM_DEMO_ID);
            const demoMessage: ChatMessage = {
                author: 'demo',
                id: STREAM_DEMO_ID,
                markdown: '',
                streaming: true,
            };
            return exists
                ? prev.map((m) => (m.id === STREAM_DEMO_ID ? demoMessage : m))
                : [...prev, demoMessage];
        });

        streamIntervalRef.current = setInterval(() => {
            streamPositionRef.current = Math.min(
                streamPositionRef.current + STREAM_CHUNK_SIZE,
                STREAM_DEMO_CONTENT.length,
            );
            const pos = streamPositionRef.current;
            const done = pos >= STREAM_DEMO_CONTENT.length;

            setMessages((prev) =>
                prev.map((m) =>
                    m.id === STREAM_DEMO_ID
                        ? {
                            ...m,
                            markdown: STREAM_DEMO_CONTENT.slice(0, pos),
                            streaming: !done,
                        }
                        : m,
                ),
            );

            if (done) {
                clearInterval(streamIntervalRef.current!);
                streamIntervalRef.current = null;
            }
        }, STREAM_TICK_MS);
    }, []);

    useEffect(() => {
        if (isTestEnvironment) {
            return;
        }

        const timeoutId = setTimeout(() => {
            listRef.current?.scrollToEnd({animated: true});
        }, 0);

        return () => clearTimeout(timeoutId);
    }, [messages]);

    useEffect(() => {
        if (isTestEnvironment) {
            return;
        }

        const timeoutId = setTimeout(startStreamingDemo, STREAM_START_DELAY_MS);

        return () => {
            clearTimeout(timeoutId);
            if (streamIntervalRef.current) {
                clearInterval(streamIntervalRef.current);
            }
        };
    }, [startStreamingDemo]);

    const canSend = draft.trim().length > 0;

    const handleCopyCode: OnCopyCode = useCallback((_code, language) => {
        Alert.alert('Copied!', language ? `${language} code copied to clipboard.` : 'Code copied to clipboard.');
    }, []);

    const composerToolbarItems = useMemo<readonly MarkdownToolbarItem[]>(
        () => [
            {command: 'bold' as const, label: createToolbarIcon('format-bold')},
            {command: 'italic' as const, label: createToolbarIcon('format-italic')},
            {
                command: 'underline' as const,
                label: createToolbarIcon('format-underline'),
            },
            {
                command: 'strikethrough' as const,
                label: createToolbarIcon('format-strikethrough-variant'),
            },
            {
                accessibilityLabel: 'Insert heading',
                items: [
                    {
                        command: 'heading-one' as const,
                        label: createToolbarIcon('format-header-1'),
                    },
                    {
                        command: 'heading-two' as const,
                        label: createToolbarIcon('format-header-2'),
                    },
                    {
                        command: 'heading-three' as const,
                        label: createToolbarIcon('format-header-3'),
                    },
                ],
                label: createToolbarIcon('format-header-pound'),
            },
            {command: 'link' as const, label: createToolbarIcon('link-variant')},
            {
                command: 'blockquote' as const,
                label: createToolbarIcon('format-quote-close'),
            },
            {
                accessibilityLabel: 'Insert warning block',
                action: {
                    placeholder: 'Warning text',
                    prefix: '::: warning\n',
                    suffix: '\n:::',
                    type: 'wrap',
                },
                label: createToolbarIcon('alert-outline'),
            },
            {
                command: 'inline-code' as const,
                label: createToolbarIcon('code-tags'),
            },
            {
                command: 'bullet-list' as const,
                label: createToolbarIcon('format-list-bulleted'),
            },
            {
                command: 'ordered-list' as const,
                label: createToolbarIcon('format-list-numbered'),
            },
            {command: 'table' as const, label: createToolbarIcon('table-large')},
        ],
        [],
    );

    const handleSend = (): void => {
        const markdown = draft.trim();

        if (markdown.length === 0) {
            return;
        }

        const nextMessage: ChatMessage = {
            author: 'you',
            id: createMessageId(messageCountRef.current),
            markdown,
        };

        messageCountRef.current += 1;
        setMessages((currentMessages) => [...currentMessages, nextMessage]);
        setDraft('');
    };

    const renderMessage = ({item}: ListRenderItemInfo<ChatMessage>) => {
        const isOwnMessage = item.author === 'you';
        const usesWideBubble =
            item.streaming !== undefined || usesStructuredBubbleLayout(item.markdown);
        const markdownStyles = getMarkdownStyles(isOwnMessage, isDark);
        const messageColorScheme = isOwnMessage ? 'light' : colorScheme;
        const cursorColor = isOwnMessage ? '#FFFFFF' : (isDark ? '#e6edf3' : '#10212E');

        return (
            <View
                style={[
                    styles.messageRow,
                    isOwnMessage ? styles.ownMessageRow : styles.demoMessageRow,
                ]}
            >
                <View
                    style={[
                        styles.messageBubble,
                        usesWideBubble ? styles.structuredMessageBubble : null,
                        isOwnMessage
                        ? styles.ownMessageBubble
                        : [styles.demoMessageBubble, {backgroundColor: chrome.demoBubbleBg, borderColor: chrome.demoBubbleBorder}],
                    ]}
                >
                    <Text style={styles.messageAuthor}>
                        {isOwnMessage ? 'You' : 'Demo'}
                    </Text>
                    {item.streaming !== undefined ? (
                        <MarkdownStream
                            colorScheme={messageColorScheme}
                            cursorColor={cursorColor}
                            markdownit={warningMarkdownIt}
                            onCopyCode={handleCopyCode}
                            rules={warningRules}
                            streaming={item.streaming}
                            style={markdownStyles}
                        >
                            {item.markdown}
                        </MarkdownStream>
                    ) : (
                        <Markdown
                            colorScheme={messageColorScheme}
                            markdownit={warningMarkdownIt}
                            onCopyCode={handleCopyCode}
                            rules={warningRules}
                            style={markdownStyles}
                        >
                            {item.markdown}
                        </Markdown>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.safeArea, {backgroundColor: chrome.background}]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'}/>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
                style={styles.flex}
            >
                <View style={[styles.screen, {backgroundColor: chrome.background}]}>
                    <View style={[styles.header, {backgroundColor: chrome.headerBg, borderBottomColor: chrome.headerBorder}]}>
                        <Text style={[styles.eyebrow, {color: chrome.eyebrow}]}>Example App 2</Text>
                        <Text style={[styles.title, {color: chrome.title}]}>Markdown Chat</Text>
                        <Text style={[styles.subtitle, {color: chrome.subtitle}]}>
                            Send messages with the composer below and render them as markdown
                            bubbles in the conversation.
                        </Text>
                        <Pressable
                            accessibilityLabel="Replay streaming demo"
                            accessibilityRole="button"
                            onPress={startStreamingDemo}
                            style={[styles.replayButton, {backgroundColor: chrome.replayBg, borderColor: chrome.replayBorder}]}
                        >
                            <MaterialDesignIcons
                                color={chrome.replayIcon}
                                name="refresh"
                                size={14}
                            />
                            <Text style={[styles.replayButtonText, {color: chrome.replayText}]}>Replay streaming demo</Text>
                        </Pressable>
                    </View>

                    <FlatList
                        contentContainerStyle={styles.messageListContent}
                        data={messages}
                        extraData={colorScheme}
                        keyExtractor={(item) => item.id}
                        ref={listRef}
                        renderItem={renderMessage}
                        style={styles.messageList}
                    />

                    <View style={[styles.composerShell, {backgroundColor: chrome.composerBg, borderTopColor: chrome.composerBorder}]}>
                        <View style={styles.composerCard}>
                            <MarkdownComposer
                                expandedToolbarItems={composerToolbarItems}
                                minimizedToolbarItems={[]}
                                onChangeText={setDraft}
                                placeholder="Write a markdown message..."
                                previewEnabled
                                previewLabel="Message preview"
                                previewProps={{
                                    markdownit: warningMarkdownIt,
                                    rules: warningRules,
                                    style: composerPreviewStyle,
                                }}
                                previewToggleLabels={{
                                    hide: 'Hide message preview',
                                    show: 'Show message preview',
                                }}
                                value={draft}
                            />
                        </View>

                        <Pressable
                            accessibilityRole="button"
                            disabled={!canSend}
                            onPress={handleSend}
                            style={[
                                styles.sendButton,
                                {backgroundColor: canSend ? chrome.sendEnabled : chrome.sendDisabled},
                            ]}
                        >
                            <Text style={[styles.sendButtonText, {color: isDark ? '#0d1117' : '#FFFFFF'}]}>Send</Text>
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    composerCard: {
        flex: 1,
    },
    composerShell: {
        alignItems: 'flex-end',
        borderTopWidth: 1,
        flexDirection: 'row',
        gap: 12,
        paddingBottom: 14,
        paddingHorizontal: 16,
        paddingTop: 14,
    },
    demoMessageBubble: {},
    demoMessageRow: {
        justifyContent: 'flex-start',
    },
    eyebrow: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    replayButton: {
        alignItems: 'center',
        alignSelf: 'flex-start',
        borderRadius: 20,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    replayButtonText: {
        fontSize: 13,
        fontWeight: '600',
    },
    flex: {
        flex: 1,
    },
    header: {
        borderBottomWidth: 1,
        gap: 6,
        paddingHorizontal: 20,
        paddingVertical: 18,
    },
    messageAuthor: {
        color: 'orange',
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    messageBubble: {
        borderRadius: 18,
        borderWidth: 1,
        maxWidth: '86%',
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    messageList: {
        flex: 1,
    },
    messageListContent: {
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    messageRow: {
        flexDirection: 'row',
        width: '100%',
    },
    ownMessageBubble: {
        backgroundColor: '#0A66C2',
        borderColor: '#0A66C2',
    },
    ownMessageRow: {
        justifyContent: 'flex-end',
    },
    safeArea: {
        flex: 1,
    },
    screen: {
        flex: 1,
    },
    structuredMessageBubble: {
        width: '86%',
    },
    sendButton: {
        alignItems: 'center',
        borderRadius: 14,
        justifyContent: 'center',
        minHeight: 52,
        minWidth: 84,
        paddingHorizontal: 18,
    },
    sendButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 20,
        maxWidth: 520,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
    },
});

export default App;

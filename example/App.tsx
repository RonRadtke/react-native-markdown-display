import React, {useEffect, useMemo, useRef, useState} from 'react';
import {FlatList, KeyboardAvoidingView, type ListRenderItemInfo, Platform, Pressable, StatusBar, StyleSheet, Text, View,} from 'react-native';

import Markdown, {MarkdownComposer, type MarkdownStyleMap} from '../src';

interface ChatMessage {
    author: 'demo' | 'you';
    id: string;
    markdown: string;
}

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
            'Try `**bold**`, `_italic_`, lists, tables, links, or expand the input for preview.\n\n- Native input\n- Expandable composer\n- Markdown render on send',
    },
];
const isTestEnvironment = typeof jest !== 'undefined';

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

const getMarkdownStyles = (isOwnMessage: boolean): MarkdownStyleMap => ({
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
        backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.16)' : '#EFF4F8',
        borderColor: isOwnMessage ? 'rgba(255,255,255,0.22)' : '#CCD6E0',
        color: isOwnMessage ? '#F8FBFF' : '#16202A',
    },
    code_inline: {
        backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.16)' : '#EFF4F8',
        borderColor: isOwnMessage ? 'rgba(255,255,255,0.22)' : '#CCD6E0',
        color: isOwnMessage ? '#F8FBFF' : '#16202A',
    },
    fence: {
        backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.16)' : '#EFF4F8',
        borderColor: isOwnMessage ? 'rgba(255,255,255,0.22)' : '#CCD6E0',
        color: isOwnMessage ? '#F8FBFF' : '#16202A',
    },
    heading1: {
        color: isOwnMessage ? '#F8FBFF' : '#14212B',
        fontSize: 28,
    },
    heading2: {
        color: isOwnMessage ? '#F8FBFF' : '#14212B',
        fontSize: 22,
    },
    heading3: {
        color: isOwnMessage ? '#F8FBFF' : '#14212B',
        fontSize: 18,
    },
    link: {
        color: isOwnMessage ? '#FFFFFF' : '#0A66C2',
        textDecorationLine: 'underline',
    },
    list_item: {
        width: '100%',
    },
    ordered_list: {
        width: '100%',
    },
    ordered_list_content: {
        flex: 1,
    },
    paragraph: {
        marginBottom: 8,
        marginTop: 0,
    },
    strong: {
        color: isOwnMessage ? '#FFFFFF' : '#10212E',
        fontWeight: '700',
    },
    table: {
        width: '100%',
        borderColor: isOwnMessage ? 'rgba(255,255,255,0.28)' : '#CCD6E0',
    },
    tbody: {
        width: '100%',
    },
    text: {
        color: isOwnMessage ? '#F8FBFF' : '#10212E',
        fontSize: 15,
        lineHeight: 22,
    },
    thead: {
        width: '100%',
    },
    tr: {
        width: '100%',
    },
});

function App(): React.JSX.Element {
    const listRef = useRef<FlatList<ChatMessage>>(null);
    const messageCountRef = useRef(INITIAL_MESSAGES.length + 1);
    const [draft, setDraft] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);

    useEffect(() => {
        if (isTestEnvironment) {
            return;
        }

        const timeoutId = setTimeout(() => {
            listRef.current?.scrollToEnd({animated: true});
        }, 0);

        return () => clearTimeout(timeoutId);
    }, [messages]);

    const canSend = draft.trim().length > 0;

    const composerToolbarItems = useMemo(
        () => [
            {command: 'bold' as const, label: 'B'},
            {command: 'italic' as const, label: 'I'},
            {command: 'strikethrough' as const, label: 'S'},
            {command: 'heading-one' as const, label: 'H1'},
            {command: 'heading-two' as const, label: 'H2'},
            {command: 'heading-three' as const, label: 'H3'},
            {command: 'link' as const, label: 'Link'},
            {command: 'blockquote' as const, label: 'Quote'},
            {command: 'inline-code' as const, label: '</>'},
            {command: 'bullet-list' as const, label: 'List'},
            {command: 'ordered-list' as const, label: '1.'},
            {command: 'table' as const, label: 'Table'},
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
        const usesWideBubble = usesStructuredBubbleLayout(item.markdown);

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
                        isOwnMessage ? styles.ownMessageBubble : styles.demoMessageBubble,
                    ]}
                >
                    <Text style={styles.messageAuthor}>
                        {isOwnMessage ? 'You' : 'Demo'}
                    </Text>
                    <Markdown style={getMarkdownStyles(isOwnMessage)}>
                        {item.markdown}
                    </Markdown>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.safeArea}>
            <StatusBar barStyle="dark-content"/>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
                style={styles.flex}
            >
                <View style={styles.screen}>
                    <View style={styles.header}>
                        <Text style={styles.eyebrow}>Example App</Text>
                        <Text style={styles.title}>Markdown Chat</Text>
                        <Text style={styles.subtitle}>
                            Send messages with the composer below and render them as markdown
                            bubbles in the conversation.
                        </Text>
                    </View>

                    <FlatList
                        contentContainerStyle={styles.messageListContent}
                        data={messages}
                        keyExtractor={(item) => item.id}
                        ref={listRef}
                        renderItem={renderMessage}
                        style={styles.messageList}
                    />

                    <View style={styles.composerShell}>
                        <View style={styles.composerCard}>
                            <MarkdownComposer
                                expandedToolbarItems={composerToolbarItems}
                                onChangeText={setDraft}
                                placeholder="Write a markdown message..."
                                previewEnabled
                                previewLabel="Message preview"
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
                                canSend ? styles.sendButtonEnabled : styles.sendButtonDisabled,
                            ]}
                        >
                            <Text style={styles.sendButtonText}>Send</Text>
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
        backgroundColor: '#F5F8FB',
        borderTopColor: '#D7E0E8',
        borderTopWidth: 1,
        flexDirection: 'row',
        gap: 12,
        paddingBottom: 14,
        paddingHorizontal: 16,
        paddingTop: 14,
    },
    demoMessageBubble: {
        backgroundColor: '#FFFFFF',
        borderColor: '#D9E2EB',
    },
    demoMessageRow: {
        justifyContent: 'flex-start',
    },
    eyebrow: {
        color: '#0A66C2',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    flex: {
        flex: 1,
    },
    header: {
        backgroundColor: '#F5F8FB',
        borderBottomColor: '#D7E0E8',
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
        backgroundColor: '#EAF0F5',
        flex: 1,
    },
    screen: {
        backgroundColor: '#EAF0F5',
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
    sendButtonDisabled: {
        backgroundColor: '#B9C3CC',
    },
    sendButtonEnabled: {
        backgroundColor: '#111E2B',
    },
    sendButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    subtitle: {
        color: '#526171',
        fontSize: 14,
        lineHeight: 20,
        maxWidth: 520,
    },
    title: {
        color: '#13202B',
        fontSize: 28,
        fontWeight: '800',
    },
});

export default App;

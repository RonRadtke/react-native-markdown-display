import {
    applyBlockFormat,
    applyInlineFormat,
    applyLinkFormat,
    applyTableFormat,
} from './formatMarkdown';

import type {
    MarkdownCommandResult,
    MarkdownSelection,
    MarkdownTextInputCommandPayload,
} from '../types';

/**
 * Dispatch a markdown command to the matching pure transform. Shared by the
 * plain-text input and the WYSIWYG editor so command behaviour stays identical
 * across editing modes.
 */
export const executeCommand = (
    value: string,
    selection: MarkdownSelection | undefined,
    payload: MarkdownTextInputCommandPayload,
): MarkdownCommandResult => {
    switch (payload.command) {
        case 'bold':
        case 'italic':
        case 'underline':
        case 'strikethrough':
        case 'inline-code':
            return applyInlineFormat(value, selection, payload.command);
        case 'heading-one':
        case 'heading-two':
        case 'heading-three':
        case 'blockquote':
        case 'bullet-list':
        case 'ordered-list':
        case 'code-block':
            return applyBlockFormat(value, selection, payload.command);
        case 'link':
            return applyLinkFormat(value, selection, payload.link);
        case 'table':
            return applyTableFormat(value, selection, payload.table);
        default: {
            const exhaustiveCheck: never = payload.command;
            throw new Error(
                `Unsupported markdown command: ${String(exhaustiveCheck)}`,
            );
        }
    }
};

const INLINE_COMMANDS: ReadonlySet<MarkdownTextInputCommandPayload['command']> =
    new Set(['bold', 'italic', 'underline', 'strikethrough', 'inline-code']);

/** Whether a command maps to an inline (character-level) markdown format. */
export const isInlineCommand = (
    command: MarkdownTextInputCommandPayload['command'],
): command is import('../types').MarkdownInlineFormat =>
    INLINE_COMMANDS.has(command);

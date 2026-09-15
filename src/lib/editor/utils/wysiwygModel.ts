import {normalizeSelection} from './selection';

import type {
    MarkdownCommandResult,
    MarkdownInlineFormat,
    MarkdownSelection,
} from '../types';

/**
 * Inline formats that the WYSIWYG surface renders with hidden markdown markers.
 */
export type WysiwygInlineFormat = MarkdownInlineFormat;

/**
 * Block style applied to a run of display characters. Heading levels and the
 * synthetic list marker each have their own key; everything else is `null`.
 */
export type WysiwygBlock =
    | 'heading-one'
    | 'heading-two'
    | 'heading-three'
    | 'list-marker'
    | null;

interface MarkerDefinition {
    format: WysiwygInlineFormat;
    marker: string;
}

/**
 * Marker definitions are scanned longest-first so that `**` is matched before a
 * stray single character could be mistaken for another marker.
 */
const MARKER_DEFINITIONS: readonly MarkerDefinition[] = [
    {format: 'bold', marker: '**'},
    {format: 'bold', marker: '__'},
    {format: 'underline', marker: '++'},
    {format: 'strikethrough', marker: '~~'},
    {format: 'inline-code', marker: '`'},
    {format: 'italic', marker: '_'},
    {format: 'italic', marker: '*'},
];

interface InlineOpening extends MarkerDefinition {
    displayStart: number;
    sourceStart: number;
}

interface InlineSpan extends InlineOpening {
    closingStart: number;
    displayEnd: number;
}

interface BlockMarker {
    sourceStart: number;
    sourceEnd: number;
    displayStart: number;
    displayEnd: number;
}

const HEADING_BLOCK_KEYS: readonly WysiwygBlock[] = [
    'heading-one',
    'heading-two',
    'heading-three',
];

const BULLET_GLYPH = '• ';

export interface WysiwygSegment {
    block: WysiwygBlock;
    formats: readonly WysiwygInlineFormat[];
    /** True when the run is a synthetic marker (bullet/number) with no source. */
    synthetic: boolean;
    text: string;
}

export interface WysiwygModel {
    /**
     * Source range covered by each display character, including any escape or
     * character reference. Synthetic glyphs cover their raw block marker.
     */
    charMarkerEnd: readonly number[];
    charMarkerStart: readonly number[];
    /** Anchor source index used for inserting at each display character. */
    charSource: readonly number[];
    /** Whether each display character is a synthetic marker glyph. */
    charSynthetic: readonly boolean[];
    /** Display text with all recognised markers removed or replaced. */
    display: string;
    /** Display text grouped into runs that share the same style. */
    segments: readonly WysiwygSegment[];
    /** Original markdown source the model was built from. */
    source: string;
}

interface BlockInfo {
    blockKey: WysiwygBlock;
    markerLen: number;
    ordinal?: number;
    type: 'heading' | 'bullet' | 'ordered';
}

const detectBlock = (lineText: string): BlockInfo | null => {
    const heading = /^(#{1,6}) /.exec(lineText);

    if (heading) {
        const level = heading[1]!.length;

        return {
            blockKey: HEADING_BLOCK_KEYS[Math.min(level, 3) - 1]!,
            markerLen: level + 1,
            type: 'heading',
        };
    }

    if (/^[-*+] /.test(lineText)) {
        return {blockKey: null, markerLen: 2, type: 'bullet'};
    }

    const ordered = /^(\d+)\. /.exec(lineText);

    if (ordered) {
        return {
            blockKey: null,
            markerLen: ordered[0]!.length,
            ordinal: Number(ordered[1]),
            type: 'ordered',
        };
    }

    return null;
};

const matchMarkerAt = (
    source: string,
    index: number,
): MarkerDefinition | null => {
    for (const definition of MARKER_DEFINITIONS) {
        if (source.startsWith(definition.marker, index)) {
            return definition;
        }
    }

    return null;
};

const formatsKey = (formats: readonly WysiwygInlineFormat[]): string =>
    [...formats].sort().join('|');

/**
 * Parse markdown into a WYSIWYG model. Inline markers are hidden, heading
 * prefixes are hidden and their line styled, and list markers are replaced with
 * a synthetic bullet/number glyph. Unbalanced inline markers are kept as literal
 * text so nothing disappears unexpectedly while typing.
 */
const parseWysiwygModel = (
    source: string,
    inlineSpans: InlineSpan[],
    blockMarkers: BlockMarker[] = [],
): WysiwygModel => {
    const displayChars: string[] = [];
    const charSource: number[] = [];
    const charSynthetic: boolean[] = [];
    const charMarkerStart: number[] = [];
    const charMarkerEnd: number[] = [];
    const charBlock: WysiwygBlock[] = [];
    const charFormats: WysiwygInlineFormat[][] = [];

    const pushReal = (
        index: number,
        block: WysiwygBlock,
        formats: readonly WysiwygInlineFormat[],
    ): void => {
        displayChars.push(source[index]!);
        charSource.push(index);
        charSynthetic.push(false);
        charMarkerStart.push(index);
        charMarkerEnd.push(index + 1);
        charBlock.push(block);
        charFormats.push([...formats]);
    };

    const pushSynthetic = (
        glyph: string,
        markerStart: number,
        markerEnd: number,
    ): void => {
        for (const character of glyph) {
            displayChars.push(character);
            charSource.push(markerEnd);
            charSynthetic.push(true);
            charMarkerStart.push(markerStart);
            charMarkerEnd.push(markerEnd);
            charBlock.push('list-marker');
            charFormats.push([]);
        }
    };

    let index = 0;
    let fence: string | null = null;

    while (index < source.length) {
        const lineStart = index;
        const newlineIndex = source.indexOf('\n', lineStart);
        const lineEnd = newlineIndex === -1 ? source.length : newlineIndex;
        const lineText = source.slice(lineStart, lineEnd);
        const possibleFence = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(lineText);
        const fenceMatch = possibleFence?.[1]?.[0] === '`' && possibleFence[2]!.includes('`')
            ? null
            : possibleFence;
        const literalLine = fence !== null || fenceMatch !== null;

        // Fenced blocks remain literal; their contents must not become editable
        // inline delimiter pairs, including runs such as **** inside code.
        if (fenceMatch) {
            const marker = fenceMatch[1]!;

            if (fence === null) {
                fence = marker;
            } else if (
                marker[0] === fence[0] &&
                marker.length >= fence.length &&
                fenceMatch[2]!.trim().length === 0
            ) {
                fence = null;
            }
        }

        const block = literalLine ? null : detectBlock(lineText);

        let contentStart = lineStart;
        let contentBlock: WysiwygBlock = null;

        if (block) {
            const displayStart = displayChars.length;
            contentStart = lineStart + block.markerLen;

            if (block.type === 'heading') {
                contentBlock = block.blockKey;
            } else {
                const glyph =
                    block.type === 'bullet'
                        ? BULLET_GLYPH
                        : `${block.ordinal}. `;

                pushSynthetic(glyph, lineStart, contentStart);
            }

            blockMarkers.push({sourceStart: lineStart, sourceEnd: contentStart, displayStart, displayEnd: displayChars.length});
        }

        const active: InlineOpening[] = [];
        let scanIndex = contentStart;

        while (scanIndex < lineEnd) {
            const formats = active.map((opening) => opening.format);
            const entity = !literalLine && /^&#(?:([0-9]{1,7})|x([0-9a-f]{1,6}));/i.exec(source.slice(scanIndex, lineEnd));
            if (entity) {
                const codePoint = entity[1] ? Number(entity[1]) : parseInt(entity[2]!, 16);
                if (codePoint > 0 && codePoint <= 0x10ffff && (codePoint < 0xd800 || codePoint > 0xdfff)) {
                    const decoded = String.fromCodePoint(codePoint);
                    for (let offset = 0; offset < decoded.length; offset += 1) {
                        pushReal(scanIndex, contentBlock, formats);
                        displayChars[displayChars.length - 1] = decoded[offset]!;
                        charMarkerEnd[charMarkerEnd.length - 1] = scanIndex + entity[0].length;
                    }
                    scanIndex += entity[0].length;
                    continue;
                }
            }
            if (!literalLine && source[scanIndex] === '\\' && /[\\`*_{}[\]()#+.!<>~=-]/.test(source[scanIndex + 1] ?? '')) {
                pushReal(scanIndex + 1, contentBlock, formats);
                charSource[charSource.length - 1] = scanIndex;
                charMarkerStart[charMarkerStart.length - 1] = scanIndex;
                scanIndex += 2;
                continue;
            }
            const definition = literalLine ? null : matchMarkerAt(source, scanIndex);

            if (!definition) {
                pushReal(scanIndex, contentBlock, formats);
                scanIndex += 1;
                continue;
            }

            if (definition.format === 'inline-code') {
                const marker = /^`+/.exec(source.slice(scanIndex, lineEnd))![0];
                let closingIndex = source.indexOf(marker, scanIndex + marker.length);

                while (
                    closingIndex !== -1 && closingIndex < lineEnd &&
                    (source[closingIndex - 1] === '`' || source[closingIndex + marker.length] === '`')
                ) {
                    closingIndex = source.indexOf(marker, closingIndex + marker.length);
                }

                if (closingIndex === -1 || closingIndex >= lineEnd) {
                    for (let offset = 0; offset < marker.length; offset += 1) {
                        pushReal(scanIndex + offset, contentBlock, formats);
                    }
                    scanIndex += marker.length;
                    continue;
                }

                const displayStart = displayChars.length;
                const contentStartIndex = scanIndex + marker.length;
                const content = source.slice(contentStartIndex, closingIndex);
                const padding = content.startsWith(' ') && content.endsWith(' ') &&
                    content.trim().length > 0 ? 1 : 0;

                for (let codeIndex = contentStartIndex + padding; codeIndex < closingIndex - padding; codeIndex += 1) {
                    pushReal(codeIndex, contentBlock, [...formats, 'inline-code']);
                }

                inlineSpans.push({
                    closingStart: closingIndex,
                    displayEnd: displayChars.length,
                    displayStart,
                    format: 'inline-code',
                    marker,
                    sourceStart: scanIndex,
                });
                scanIndex = closingIndex + marker.length;
                continue;
            }

            const activeIndex = active.findIndex((opening) => opening.marker === definition.marker);

            if (activeIndex !== -1) {
                const opening = active.splice(activeIndex, 1)[0]!;

                inlineSpans.push({
                    ...opening,
                    closingStart: scanIndex,
                    displayEnd: displayChars.length,
                });
                scanIndex += definition.marker.length;
                continue;
            }

            const closingIndex = source.indexOf(
                definition.marker,
                scanIndex + definition.marker.length,
            );

            if (closingIndex !== -1 && closingIndex < lineEnd) {
                active.push({
                    ...definition,
                    displayStart: displayChars.length,
                    sourceStart: scanIndex,
                });
                scanIndex += definition.marker.length;
                continue;
            }

            for (let offset = 0; offset < definition.marker.length; offset += 1) {
                pushReal(scanIndex + offset, contentBlock, formats);
            }
            scanIndex += definition.marker.length;
        }

        if (newlineIndex !== -1) {
            pushReal(newlineIndex, null, []);
            index = newlineIndex + 1;
        } else {
            index = source.length;
        }
    }

    const display = displayChars.join('');
    const segments: WysiwygSegment[] = [];
    let currentKey: string | null = null;

    for (let charIndex = 0; charIndex < displayChars.length; charIndex += 1) {
        const formats = charFormats[charIndex]!;
        const block = charBlock[charIndex]!;
        const synthetic = charSynthetic[charIndex]!;
        const key = `${formatsKey(formats)}\u0000${block ?? ''}\u0000${synthetic ? '1' : '0'}`;

        if (key !== currentKey) {
            segments.push({block, formats, synthetic, text: displayChars[charIndex]!});
            currentKey = key;
            continue;
        }

        segments[segments.length - 1]!.text += displayChars[charIndex]!;
    }

    return {
        charMarkerEnd,
        charMarkerStart,
        charSource,
        charSynthetic,
        display,
        segments,
        source,
    };
};

export const buildWysiwygModel = (source: string): WysiwygModel =>
    parseWysiwygModel(source, []);

/**
 * Source index to use when inserting text at the given display offset. Inserting
 * inside a synthetic marker goes into the following content so the list marker
 * is preserved; inserting at the very end inherits the preceding character's
 * formatting rather than escaping any trailing markers.
 */
const displayOffsetToSourceInsert = (
    model: WysiwygModel,
    displayOffset: number,
): number => {
    const length = model.charSource.length;

    if (displayOffset < length) {
        return model.charSynthetic[displayOffset]
            ? model.charMarkerEnd[displayOffset]!
            : model.charSource[displayOffset]!;
    }

    if (length === 0) {
        return model.source.length;
    }

    return model.charMarkerEnd[length - 1]!;
};

/** Source index immediately after the display character at the given index. */
const charSourceEnd = (model: WysiwygModel, charIndex: number): number =>
    model.charMarkerEnd[charIndex]!;

/** Source index at the start of the display character at the given index. */
const charSourceStart = (model: WysiwygModel, charIndex: number): number =>
    model.charMarkerStart[charIndex]!;

/**
 * Map a display selection onto a markdown source range. Visible characters in
 * the selection are covered without swallowing the hidden markers that wrap
 * them; a selection edge on a synthetic marker covers the whole raw marker.
 */
export const displaySelectionToSource = (
    model: WysiwygModel,
    selection: MarkdownSelection,
): MarkdownSelection => {
    selection = normalizeSelection(model.display, selection);
    const start =
        selection.start < model.charSource.length
            ? charSourceStart(model, selection.start)
            : displayOffsetToSourceInsert(model, selection.start);
    const end =
        selection.end > selection.start
            ? charSourceEnd(model, selection.end - 1)
            : start;

    return {end, start};
};

/**
 * Map a markdown source offset onto a display offset by counting display
 * characters that end at or before it.
 */
export const sourceOffsetToDisplay = (
    model: WysiwygModel,
    sourceOffset: number,
): number => {
    let count = 0;

    for (let charIndex = 0; charIndex < model.charSource.length; charIndex += 1) {
        const isBefore = model.charMarkerEnd[charIndex]! <= sourceOffset;

        if (!isBefore) {
            break;
        }

        count += 1;
    }

    return count;
};

/**
 * Remove parsed inline pairs with no display content, preserving literal code
 * and unmatched delimiters. Normal edits instead remove only newly emptied
 * pairs using the previous model, so untouched source stays intact.
 */
export const cleanEmptyMarkers = (source: string): string => {
    const spans: InlineSpan[] = [];
    parseWysiwygModel(source, spans);
    const removed = new Uint8Array(source.length);

    for (const span of spans) {
        if (span.displayStart === span.displayEnd) {
            removed.fill(1, span.sourceStart, span.sourceStart + span.marker.length);
            removed.fill(1, span.closingStart, span.closingStart + span.marker.length);
        }
    }

    return source.split('').filter((_character, index) => !removed[index]).join('');
};

/**
 * Active inline formats at a display offset, used to highlight toolbar buttons.
 * The format of the character before the caret is preferred so that the toolbar
 * reflects the span the caret sits at the end of.
 */
export const getFormatsAtDisplayOffset = (
    model: WysiwygModel,
    displayOffset: number,
): readonly WysiwygInlineFormat[] => {
    if (model.segments.length === 0) {
        return [];
    }

    const target = Math.max(displayOffset - 1, 0);
    let consumed = 0;

    for (const segment of model.segments) {
        consumed += segment.text.length;

        if (target < consumed) {
            return segment.formats;
        }
    }

    return model.segments[model.segments.length - 1]!.formats;
};

export interface WysiwygEditResult extends MarkdownCommandResult {
    /** Display text the surface should show after the edit. */
    display: string;
}

interface DisplayEdit extends MarkdownSelection {
    inserted: string;
}

const findDisplayEdit = (
    previous: string,
    next: string,
    selection: MarkdownSelection | undefined,
): DisplayEdit => {
    const lengthChange = next.length - previous.length;

    const matchRange = (start: number, end: number): DisplayEdit | null => {
        const insertedLength = lengthChange + end - start;

        if (
            start < 0 || end > previous.length || insertedLength < 0 ||
            previous.slice(0, start) !== next.slice(0, start) ||
            previous.slice(end) !== next.slice(start + insertedLength)
        ) {
            return null;
        }

        return {start, end, inserted: next.slice(start, start + insertedLength)};
    };

    if (selection) {
        const {start, end} = normalizeSelection(previous, selection);
        const replacement = matchRange(start, end);

        if (replacement) {
            return replacement;
        }

        if (start === end && lengthChange < 0) {
            // Prefer backspace; try forward delete when the preceding text
            // does not match. Both may otherwise look identical in repeated text.
            const deletion = matchRange(start + lengthChange, start) ??
                matchRange(start, start - lengthChange);

            if (deletion) {
                return deletion;
            }
        }
    }

    // Autocorrection and other native replacements may occur away from the
    // previous caret. Fall back only when the selection cannot explain the edit.
    const maxPrefix = Math.min(previous.length, next.length);
    let start = 0;

    while (start < maxPrefix && previous[start] === next[start]) {
        start += 1;
    }

    let suffix = 0;

    while (
        suffix < Math.min(previous.length - start, next.length - start) &&
        previous[previous.length - 1 - suffix] === next[next.length - 1 - suffix]
    ) {
        suffix += 1;
    }

    return {
        start,
        end: previous.length - suffix,
        inserted: next.slice(start, next.length - suffix),
    };
};

/** Merge only delimiter boundaries brought together by this deletion. */
const joinAdjacentSpans = (
    spans: readonly InlineSpan[],
    removed: Uint8Array,
    insertionIndex: number,
    inserted: string,
): InlineSpan[] => {
    const owners = new Map(spans.map((span) => [span, span]));
    const surviving = new Set(spans);
    const boundaries = spans.flatMap((span) => [
        {opening: true, span, start: span.sourceStart},
        {opening: false, span, start: span.closingStart},
    ]).sort((left, right) => left.start - right.start);

    for (let index = 1; index < boundaries.length; index += 1) {
        const left = boundaries[index - 1]!;
        const right = boundaries[index]!;
        const gapStart = left.start + left.span.marker.length;

        if (
            left.opening || !right.opening || left.span.marker !== right.span.marker ||
            gapStart >= right.start ||
            (inserted.length > 0 && insertionIndex >= gapStart && insertionIndex <= right.start)
        ) {
            continue;
        }

        let gapRemoved = true;

        for (let offset = gapStart; offset < right.start; offset += 1) {
            if (!removed[offset]) {
                gapRemoved = false;
                break;
            }
        }

        if (gapRemoved) {
            const merged = owners.get(left.span)!;
            merged.closingStart = right.span.closingStart;
            merged.displayEnd = right.span.displayEnd;
            owners.set(right.span, merged);
            surviving.delete(right.span);
            removed.fill(1, left.start, gapStart);
            removed.fill(1, right.start, right.start + right.span.marker.length);
        }
    }

    return [...surviving];
};

const serializeCode = (content: string, previousMarker: string): {prefix: string; value: string} => {
    let marker = previousMarker;

    // A deletion can join two literal backtick runs. Pick a delimiter that
    // cannot be mistaken for content, and separate edge backticks with padding.
    for (const run of content.match(/`+/g) ?? []) {
        if (run.length >= marker.length) {
            marker = '`'.repeat(run.length + 1);
        }
    }

    const needsPadding = content.startsWith('`') || content.endsWith('`') ||
        (content.startsWith(' ') && content.endsWith(' ') && content.trim().length > 0);
    const padding = needsPadding ? ' ' : '';

    return {prefix: marker + padding, value: marker + padding + content + padding + marker};
};

interface InlineCharacter {
    text: string;
    formats: readonly WysiwygInlineFormat[];
    literal: boolean;
}

const getDisplayCharacters = (model: WysiwygModel): InlineCharacter[] => {
    const characters: InlineCharacter[] = [];

    for (const segment of model.segments) {
        for (let index = 0; index < segment.text.length; index += 1) {
            const offset = characters.length;
            characters.push({
                text: segment.text[index]!,
                formats: segment.formats,
                literal: segment.formats.includes('inline-code') ||
                    (!segment.synthetic && model.charMarkerEnd[offset]! - model.charMarkerStart[offset]! > 1),
            });
        }
    }

    return characters;
};

const INLINE_ORDER: readonly WysiwygInlineFormat[] = ['bold', 'italic', 'underline', 'strikethrough'];

type SerializedInlinePart =
    | {kind: 'text' | 'code'; text: string}
    | {kind: 'delimiter'; text: string; opening: boolean};

const validDelimiterBoundary = (marker: string, opening: boolean, before: string, after: string): boolean => {
    const beforeWhitespace = before === '' || /\s/.test(before);
    const afterWhitespace = after === '' || /\s/.test(after);
    const beforePunctuation = /[\p{P}\p{S}]/u.test(before);
    const afterPunctuation = /[\p{P}\p{S}]/u.test(after);
    const leftFlanking = !afterWhitespace && (!afterPunctuation || beforeWhitespace || beforePunctuation);
    const rightFlanking = !beforeWhitespace && (!beforePunctuation || afterWhitespace || afterPunctuation);
    const underscore = marker[0] === '_';
    return opening
        ? leftFlanking && (!underscore || !rightFlanking || beforePunctuation)
        : rightFlanking && (!underscore || !leftFlanking || afterPunctuation);
};

const serializeInlineParts = (parts: SerializedInlinePart[]): string => {
    let changed = true;
    while (changed) {
        changed = false;
        for (let index = 0; index < parts.length; index += 1) {
            const part = parts[index]!;
            if (part.kind !== 'delimiter') {
                continue;
            }
            const previous = parts[index - 1];
            const next = parts[index + 1];
            const before = Array.from(previous?.text ?? '').pop() ?? '';
            const after = Array.from(next?.text ?? '')[0] ?? '';
            if (!validDelimiterBoundary(part.text, part.opening, before, after)) {
                // CommonMark disallows boundaries such as **`code`**word.
                // Encode the adjacent letter as a character reference so the
                // source delimiter is valid without inserting visible text.
                const boundary = part.opening ? previous : next;
                if (boundary?.kind === 'text' && /^[\p{L}\p{N}]$/u.test(boundary.text)) {
                    boundary.text = `&#${boundary.text.codePointAt(0)!};`;
                    changed = true;
                }
            }
        }
    }
    return parts.map((part) => part.text).join('');
};

/** Serialize actual inline formatting, keeping code atomic and newlines outside markers. */
const serializeInlineCharacters = (characters: readonly InlineCharacter[]): string => {
    const parts: SerializedInlinePart[] = [];
    let active: WysiwygInlineFormat[] = [];
    const intrawordTransition = characters.some((character, index) => {
        const previous = characters[index - 1];
        return previous && /[\p{L}\p{N}]/u.test(previous.text) && /[\p{L}\p{N}]/u.test(character.text) &&
            formatsKey(previous.formats) !== formatsKey(character.formats);
    });
    const alternateEmphasis = intrawordTransition && characters.some((character) => character.formats.includes('italic'));
    const marker = (format: WysiwygInlineFormat): string => {
        if (alternateEmphasis && format === 'italic') {
            return '*';
        }
        if (alternateEmphasis && format === 'bold') {
            return '__';
        }
        return MARKER_DEFINITIONS.find((definition) => definition.format === format)!.marker;
    };

    const transition = (formats: WysiwygInlineFormat[]): void => {
        let common = 0;
        while (common < active.length && active[common] === formats[common]) {
            common += 1;
        }
        for (let index = active.length - 1; index >= common; index -= 1) {
            parts.push({kind: 'delimiter', text: marker(active[index]!), opening: false});
        }
        for (let index = common; index < formats.length; index += 1) {
            parts.push({kind: 'delimiter', text: marker(formats[index]!), opening: true});
        }
        active = formats;
    };

    for (let index = 0; index < characters.length; index += 1) {
        const character = characters[index]!;
        if (character.text === '\n') {
            transition([]);
            parts.push({kind: 'text', text: '\n'});
            continue;
        }

        const formats = INLINE_ORDER.filter((format) => character.formats.includes(format));
        if (/\s/.test(character.text) && !character.formats.includes('inline-code')) {
            // Emphasis cannot open or close against whitespace. Keep only the
            // stack shared by both sides of a space; reopen formats at text.
            let nextIndex = index + 1;
            while (nextIndex < characters.length && /[^\S\n]/.test(characters[nextIndex]!.text)) {
                nextIndex += 1;
            }
            const next = characters[nextIndex];
            const nextFormats = next && next.text !== '\n'
                ? INLINE_ORDER.filter((format) => next.formats.includes(format))
                : [];
            let common = 0;
            while (common < active.length && active[common] === formats[common] && active[common] === nextFormats[common]) {
                common += 1;
            }
            transition(active.slice(0, common));
        } else {
            transition(formats);
        }
        if (character.formats.includes('inline-code')) {
            let content = character.text;
            while (index + 1 < characters.length) {
                const next = characters[index + 1]!;
                if (next.text === '\n' || formatsKey(next.formats) !== formatsKey(character.formats)) {
                    break;
                }
                content += next.text;
                index += 1;
            }
            parts.push({kind: 'code', text: serializeCode(content, '`').value});
        } else {
            let text = character.text;
            const next = characters[index + 1];
            if (/^[\uD800-\uDBFF]$/.test(text) && next && /^[\uDC00-\uDFFF]$/.test(next.text) &&
                formatsKey(character.formats) === formatsKey(next.formats)) {
                text += next.text;
                index += 1;
            }
            const escape = /[\\`*_+~]/.test(character.text) ||
                (character.literal && /[{}[\]()#!<>.=-]/.test(character.text));
            parts.push({kind: 'text', text: (escape ? '\\' : '') + text});
        }
    }
    transition([]);
    return serializeInlineParts(parts);
};

/** Keep typed spaces and punctuation from turning existing formatting into literals. */
const normalizeInlineBoundaries = (source: string): WysiwygModel => {
    const spans: InlineSpan[] = [];
    const blocks: BlockMarker[] = [];
    const model = parseWysiwygModel(source, spans, blocks);
    const invalidLines = new Set<number>();
    for (const span of spans) {
        if (span.format === 'inline-code') {
            continue;
        }
        for (const offset of [span.sourceStart, span.closingStart]) {
            const before = Array.from(source.slice(Math.max(0, offset - 2), offset)).pop() ?? '';
            const after = Array.from(source.slice(offset + span.marker.length, offset + span.marker.length + 2))[0] ?? '';
            if (!validDelimiterBoundary(span.marker, offset === span.sourceStart, before, after)) {
                invalidLines.add(offset === 0 ? 0 : source.lastIndexOf('\n', offset - 1) + 1);
            }
        }
    }
    if (invalidLines.size === 0) {
        return model;
    }
    const characters = getDisplayCharacters(model);
    let offset = 0;
    const value = source.split('\n').map((line) => {
        const start = offset;
        offset += line.length + 1;
        if (!invalidLines.has(start)) {
            return line;
        }
        const block = blocks.find((candidate) => candidate.sourceStart === start);
        const displayStart = block?.displayEnd ?? sourceOffsetToDisplay(model, start);
        const displayEnd = sourceOffsetToDisplay(model, start + line.length);
        const prefix = block ? source.slice(block.sourceStart, block.sourceEnd) : '';
        return prefix + serializeInlineCharacters(characters.slice(displayStart, displayEnd));
    }).join('\n');
    return buildWysiwygModel(value);
};

const applyMultilineDisplayEdit = (
    model: WysiwygModel,
    spans: readonly InlineSpan[],
    blocks: readonly BlockMarker[],
    edit: DisplayEdit,
    sourceStart: number,
    sourceEnd: number,
): WysiwygEditResult | null => {
    if (!edit.inserted.includes('\n')) {
        return null;
    }

    const lineStart = sourceStart === 0 ? 0 : model.source.lastIndexOf('\n', sourceStart - 1) + 1;
    const nextNewline = model.source.indexOf('\n', sourceStart);
    const lineEnd = nextNewline === -1 ? model.source.length : nextNewline;
    if (!spans.some((span) => span.sourceStart < Math.max(lineEnd, sourceEnd) && span.closingStart >= lineStart)) {
        return null;
    }
    if (sourceEnd > lineEnd) {
        // First join the selected blocks, then split the resulting line.
        const deleted = applyDisplayEdit(model.source, model.display.slice(0, edit.start) + model.display.slice(edit.end), edit);
        const caret = deleted.selection.start;
        return applyDisplayEdit(deleted.value, deleted.display.slice(0, caret) + edit.inserted + deleted.display.slice(caret), deleted.selection);
    }

    const block = blocks.find((candidate) => candidate.sourceStart === lineStart);
    const displayStart = block?.displayEnd ?? sourceOffsetToDisplay(model, lineStart);
    const displayEnd = sourceOffsetToDisplay(model, lineEnd);
    const characters = getDisplayCharacters(model).slice(displayStart, displayEnd);
    const start = Math.max(edit.start - displayStart, 0);
    const end = Math.max(edit.end - displayStart, 0);
    const formats = spans.filter((span) => sourceStart >= span.sourceStart + span.marker.length && sourceStart <= span.closingStart)
        .map((span) => span.format);
    const inserted = edit.inserted.split('').map((text): InlineCharacter => ({text, formats, literal: formats.includes('inline-code')}));
    const prefix = block ? model.source.slice(block.sourceStart, block.sourceEnd) : '';
    const value = model.source.slice(0, lineStart) + prefix +
        serializeInlineCharacters([...characters.slice(0, start), ...inserted, ...characters.slice(end)]) + model.source.slice(lineEnd);
    const nextModel = buildWysiwygModel(value);
    const caret = Math.min(displayStart + start + edit.inserted.length, nextModel.display.length);

    return {value, display: nextModel.display, selection: {start: caret, end: caret}};
};

/**
 * Translate a change made to the visible display text back onto the markdown
 * source. The previous display selection disambiguates repeated characters;
 * callers without one retain the common prefix/suffix fallback. Keep paired
 * inline delimiters around surviving content, removing only newly emptied spans.
 * Deleting a synthetic marker removes the whole raw marker it stands in for.
 */
export const applyDisplayEdit = (
    previousSource: string,
    nextDisplay: string,
    previousSelection?: MarkdownSelection,
): WysiwygEditResult => {
    const spans: InlineSpan[] = [];
    const blocks: BlockMarker[] = [];
    const model = parseWysiwygModel(previousSource, spans, blocks);

    if (nextDisplay === model.display) {
        return {
            display: model.display,
            selection: normalizeSelection(model.display, previousSelection),
            value: previousSource,
        };
    }

    const edit = findDisplayEdit(model.display, nextDisplay, previousSelection);
    const sourceStart = edit.end > edit.start
        ? charSourceStart(model, edit.start)
        : displayOffsetToSourceInsert(model, edit.start);
    const sourceEnd = edit.end > edit.start
        ? charSourceEnd(model, edit.end - 1)
        : sourceStart;
    const multiline = applyMultilineDisplayEdit(model, spans, blocks, edit, sourceStart, sourceEnd);
    if (multiline) {
        return multiline;
    }
    const removed = new Uint8Array(previousSource.length);
    removed.fill(1, sourceStart, sourceEnd);
    for (const block of blocks) {
        if (block.sourceStart > 0 && removed[block.sourceStart - 1]) {
            removed.fill(1, block.sourceStart, block.sourceEnd);
        }
    }
    const keptSpans: InlineSpan[] = [];

    for (const span of spans) {
        const keepsContent = span.displayStart < edit.start || span.displayEnd > edit.end;
        const inheritsInsertion = edit.inserted.length > 0 &&
            sourceStart >= span.sourceStart + span.marker.length &&
            sourceStart <= span.closingStart;
        const newlyEmpty = span.displayStart < span.displayEnd &&
            !keepsContent && !inheritsInsertion;
        const deletesEmptyPair = sourceStart <= span.sourceStart &&
            sourceEnd >= span.closingStart + span.marker.length;
        const removePair = newlyEmpty || (deletesEmptyPair && !inheritsInsertion);

        if (removePair) {
            // Code spans may also contain hidden padding around their content.
            removed.fill(1, span.sourceStart, span.closingStart + span.marker.length);
        } else {
            removed.fill(0, span.sourceStart, span.sourceStart + span.marker.length);
            removed.fill(0, span.closingStart, span.closingStart + span.marker.length);
            keptSpans.push(span);
        }
    }

    const joinedSpans = joinAdjacentSpans(keptSpans, removed, sourceStart, edit.inserted);
    const codeReplacements = new Map<number, {value: string; caret: number | null}>();
    let insertionInCode = false;

    for (const span of joinedSpans) {
        if (span.format !== 'inline-code') {
            continue;
        }

        const inheritsInsertion = sourceStart >= span.sourceStart + span.marker.length &&
            sourceStart <= span.closingStart;
        const deletesContent = edit.start < span.displayEnd && edit.end > span.displayStart;

        if (!deletesContent && !(inheritsInsertion && edit.inserted.length > 0)) {
            continue;
        }

        const content = model.display.slice(span.displayStart, span.displayEnd);
        const start = Math.min(Math.max(edit.start - span.displayStart, 0), content.length);
        const end = Math.min(Math.max(edit.end - span.displayStart, 0), content.length);
        const inserted = inheritsInsertion ? edit.inserted : '';
        const serialized = serializeCode(content.slice(0, start) + inserted + content.slice(end), span.marker);

        codeReplacements.set(span.sourceStart, {
            value: serialized.value,
            caret: inheritsInsertion ? serialized.prefix.length + start + inserted.length : null,
        });
        removed.fill(1, span.sourceStart, span.closingStart + span.marker.length);
        insertionInCode ||= inheritsInsertion;
    }

    let nextSource = '';
    let caretSource = 0;

    for (let index = 0; index <= previousSource.length; index += 1) {
        if (index === sourceStart && !insertionInCode) {
            nextSource += edit.inserted;
            caretSource = nextSource.length;
        }

        const code = codeReplacements.get(index);

        if (code) {
            if (code.caret !== null) {
                caretSource = nextSource.length + code.caret;
            }

            nextSource += code.value;
        }

        if (index < previousSource.length && !removed[index]) {
            nextSource += previousSource[index]!;
        }
    }

    const caret = sourceOffsetToDisplay(buildWysiwygModel(nextSource), caretSource);
    const nextModel = normalizeInlineBoundaries(nextSource);

    return {
        display: nextModel.display,
        selection: {end: caret, start: caret},
        value: nextModel.source,
    };
};

/**
 * Apply an inline format toggle from a toolbar while editing in WYSIWYG mode.
 * Toggle the selected display characters' formats, serializing only affected
 * lines. Block prefixes are kept separate from editable inline content.
 */
export const applyInlineFormatWysiwyg = (
    source: string,
    displaySelection: MarkdownSelection,
    format: WysiwygInlineFormat,
): WysiwygEditResult => {
    const blocks: BlockMarker[] = [];
    const model = parseWysiwygModel(source, [], blocks);
    const selection = normalizeSelection(model.display, displaySelection);

    if (selection.start === selection.end) {
        const inserted = applyDisplayEdit(source, model.display.slice(0, selection.start) + 'text' + model.display.slice(selection.end), selection);
        return applyInlineFormatWysiwyg(inserted.value, {start: inserted.selection.start - 4, end: inserted.selection.end}, format);
    }

    const characters = getDisplayCharacters(model);
    const selected = characters.filter((character, index) => index >= selection.start && index < selection.end &&
        !model.charSynthetic[index] && (format === 'inline-code' ? character.text !== '\n' : !/\s/.test(character.text)));
    if (selected.length === 0) {
        return {value: source, display: model.display, selection};
    }
    const remove = selected.every((character) => character.formats.includes(format));
    let sourceOffset = 0;
    let displayOffset = 0;
    const lines = source.split('\n').map((line) => {
        const newline = model.display.indexOf('\n', displayOffset);
        const displayEnd = newline === -1 ? model.display.length : newline;
        const block = blocks.find((candidate) => candidate.sourceStart === sourceOffset);
        const contentStart = block?.displayEnd ?? displayOffset;
        let result = line;
        if (Math.max(selection.start, contentStart) < Math.min(selection.end, displayEnd)) {
            const content = characters.slice(contentStart, displayEnd).map((character, index) => {
                const offset = contentStart + index;
                if (offset < selection.start || offset >= selection.end) {
                    return character;
                }
                const formats = character.formats.filter((active) => active !== format);
                return {...character, formats: remove ? formats : [...formats, format]};
            });
            result = (block ? source.slice(block.sourceStart, block.sourceEnd) : '') + serializeInlineCharacters(content);
        }
        sourceOffset += line.length + 1;
        displayOffset = displayEnd + 1;
        return result;
    });
    const value = lines.join('\n');
    return {value, display: buildWysiwygModel(value).display, selection};
};

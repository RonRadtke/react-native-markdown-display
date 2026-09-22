import MarkdownIt from 'markdown-it';

import {normalizeSelection} from './selection';

import type {MarkdownInlineFormat, MarkdownSelection} from '../types';

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

export interface WysiwygSegment {
    block: WysiwygBlock;
    formats: readonly WysiwygInlineFormat[];
    /** True when the run is a synthetic marker (bullet/number) with no source. */
    synthetic: boolean;
    text: string;
}

/** A recognised inline span with the source ranges of both delimiters. */
export interface WysiwygSpan {
    /** Source range of the closing delimiter (code spans include stripped padding). */
    closeEnd: number;
    closeStart: number;
    /** Display range of the span content. */
    displayEnd: number;
    displayStart: number;
    format: WysiwygInlineFormat;
    /** Source range of the opening delimiter (code spans include stripped padding). */
    openEnd: number;
    openStart: number;
}

export type WysiwygBlockType = 'heading' | 'bullet' | 'ordered';

/** A recognised block prefix at the start of a line. */
export interface WysiwygBlockMarker {
    /** Display range of the synthetic glyph; empty for headings. */
    displayEnd: number;
    displayStart: number;
    /** Leading whitespace before a list marker. */
    indent: string;
    /** Heading level, or 0 for lists. */
    level: number;
    /** The marker text without indentation or trailing space, e.g. `-`, `1.`, `##`. */
    marker: string;
    ordinal: number | null;
    /** Source range of the prefix, from the line start to the first content character. */
    sourceEnd: number;
    sourceStart: number;
    type: WysiwygBlockType;
}

export interface WysiwygModel {
    /** Recognised block prefixes in source order. */
    blocks: readonly WysiwygBlockMarker[];
    /** Inline formats active for each display character. */
    charFormats: readonly (readonly WysiwygInlineFormat[])[];
    /** Whether each display character is literal source: an escape, character reference or fenced code. */
    charLiteral: readonly boolean[];
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
    /** Recognised inline spans in source order. */
    spans: readonly WysiwygSpan[];
}

/**
 * The scanner mirrors markdown-it's inline rules (emphasis, strikethrough, the
 * `ins` plugin, backticks, escapes and entities) so that the editor hides
 * exactly the markers the renderer would consume. Delimiter flanking uses the
 * same character classes markdown-it uses.
 */
const utils = new MarkdownIt().utils;

const ESCAPABLE = '\\!"#$%&\'()*+,./:;<=>?@[]^_`{|}~-';
const DIGITAL_ENTITY_RE = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i;
const NAMED_ENTITY_RE = /^&([a-z][a-z0-9]{1,31});/i;
const FENCE_RE = /^[ \t]*(`{3,}|~{3,})(.*)$/;
const HEADING_RE = /^(#{1,6}) /;
const LIST_RE = /^([ \t]*)([-*+]|\d{1,9}[.)]) /;

const HEADING_BLOCK_KEYS: readonly WysiwygBlock[] = [
    'heading-one',
    'heading-two',
    'heading-three',
];

export const BULLET_GLYPH = '• ';

const NO_FORMATS: readonly WysiwygInlineFormat[] = [];

const CODE_MARKER = 0x60;
const STAR = 0x2a;
const UNDERSCORE = 0x5f;
const TILDE = 0x7e;
const PLUS = 0x2b;

const DELIMITER_FORMATS: Record<number, WysiwygInlineFormat> = {
    [PLUS]: 'underline',
    [STAR]: 'italic',
    [TILDE]: 'strikethrough',
    [UNDERSCORE]: 'italic',
};

interface Delimiter {
    close: boolean;
    end: number;
    length: number;
    marker: number;
    open: boolean;
    token: number;
}

type TokenRole = 'literal' | 'open' | 'close' | 'hidden';

interface TextToken {
    end: number;
    kind: 'text';
    lone: boolean;
    start: number;
    text: string;
}

interface CodeToken {
    contentEnd: number;
    contentStart: number;
    end: number;
    kind: 'code';
    start: number;
}

interface DelimiterToken {
    end: number;
    format: WysiwygInlineFormat;
    kind: 'delim';
    role: TokenRole;
    start: number;
    text: string;
}

type LineToken = TextToken | CodeToken | DelimiterToken;

interface LineChar {
    block: WysiwygBlock;
    end: number;
    formats: readonly WysiwygInlineFormat[];
    literal: boolean;
    start: number;
    synthetic: boolean;
    text: string;
}

interface LineBlock {
    displayLength: number;
    indent: string;
    key: WysiwygBlock;
    level: number;
    marker: string;
    markerLength: number;
    ordinal: number | null;
    type: WysiwygBlockType;
}

interface ParsedLine {
    block: LineBlock | null;
    chars: readonly LineChar[];
    spans: readonly WysiwygSpan[];
}

const scanDelims = (
    line: string,
    start: number,
    canSplitWord: boolean,
): {canClose: boolean; canOpen: boolean; length: number} => {
    const max = line.length;
    const marker = line.charCodeAt(start);
    const lastChar = start > 0 ? line.charCodeAt(start - 1) : 0x20;
    let pos = start;

    while (pos < max && line.charCodeAt(pos) === marker) {
        pos += 1;
    }

    const nextChar = pos < max ? line.charCodeAt(pos) : 0x20;
    const isLastPunct = utils.isMdAsciiPunct(lastChar) || utils.isPunctChar(String.fromCharCode(lastChar));
    const isNextPunct = utils.isMdAsciiPunct(nextChar) || utils.isPunctChar(String.fromCharCode(nextChar));
    const isLastWhiteSpace = utils.isWhiteSpace(lastChar);
    const isNextWhiteSpace = utils.isWhiteSpace(nextChar);
    const leftFlanking = !isNextWhiteSpace && (!isNextPunct || isLastWhiteSpace || isLastPunct);
    const rightFlanking = !isLastWhiteSpace && (!isLastPunct || isNextWhiteSpace || isNextPunct);

    return {
        canClose: rightFlanking && (canSplitWord || !leftFlanking || isNextPunct),
        canOpen: leftFlanking && (canSplitWord || !rightFlanking || isLastPunct),
        length: pos - start,
    };
};

/** Port of markdown-it's `balance_pairs` rule. */
const processDelimiters = (delimiters: Delimiter[]): void => {
    const max = delimiters.length;

    if (max === 0) {
        return;
    }

    const openersBottom = new Map<number, number[]>();
    const jumps: number[] = [];
    let headerIdx = 0;
    let lastTokenIdx = -2;

    for (let closerIdx = 0; closerIdx < max; closerIdx += 1) {
        const closer = delimiters[closerIdx]!;

        jumps.push(0);

        if (delimiters[headerIdx]!.marker !== closer.marker || lastTokenIdx !== closer.token - 1) {
            headerIdx = closerIdx;
        }

        lastTokenIdx = closer.token;

        if (!closer.close) {
            continue;
        }

        let bottoms = openersBottom.get(closer.marker);

        if (!bottoms) {
            bottoms = [-1, -1, -1, -1, -1, -1];
            openersBottom.set(closer.marker, bottoms);
        }

        const minOpenerIdx = bottoms[(closer.open ? 3 : 0) + (closer.length % 3)]!;
        let openerIdx = headerIdx - jumps[headerIdx]! - 1;
        let newMinOpenerIdx = openerIdx;

        for (; openerIdx > minOpenerIdx; openerIdx -= jumps[openerIdx]! + 1) {
            const opener = delimiters[openerIdx]!;

            if (opener.marker !== closer.marker) {
                continue;
            }

            if (opener.open && opener.end < 0) {
                const isOddMatch =
                    (opener.close || closer.open) &&
                    (opener.length + closer.length) % 3 === 0 &&
                    (opener.length % 3 !== 0 || closer.length % 3 !== 0);

                if (!isOddMatch) {
                    const lastJump = openerIdx > 0 && !delimiters[openerIdx - 1]!.open
                        ? jumps[openerIdx - 1]! + 1
                        : 0;

                    jumps[closerIdx] = closerIdx - openerIdx + lastJump;
                    jumps[openerIdx] = lastJump;
                    closer.open = false;
                    opener.end = closerIdx;
                    opener.close = false;
                    newMinOpenerIdx = -1;
                    lastTokenIdx = -2;
                    break;
                }
            }
        }

        if (newMinOpenerIdx !== -1) {
            bottoms[(closer.open ? 3 : 0) + (closer.length % 3)] = newMinOpenerIdx;
        }
    }
};

const findCodeCloser = (line: string, start: number, length: number): number => {
    let searchFrom = start + length;

    while (searchFrom < line.length) {
        const candidate = line.indexOf('`', searchFrom);

        if (candidate === -1) {
            return -1;
        }

        let closerEnd = candidate;

        while (closerEnd < line.length && line.charCodeAt(closerEnd) === CODE_MARKER) {
            closerEnd += 1;
        }

        if (closerEnd - candidate === length) {
            return candidate;
        }

        searchFrom = closerEnd;
    }

    return -1;
};

const decodeEntity = (line: string, start: number): {end: number; text: string} | null => {
    if (line.charCodeAt(start + 1) === 0x23) {
        const match = DIGITAL_ENTITY_RE.exec(line.slice(start));

        if (!match) {
            return null;
        }

        const digits = match[1]!;
        const code = digits[0]!.toLowerCase() === 'x' ? parseInt(digits.slice(1), 16) : parseInt(digits, 10);

        return {
            end: start + match[0].length,
            text: utils.isValidEntityCode(code) ? utils.fromCodePoint(code) : utils.fromCodePoint(0xfffd),
        };
    }

    const match = NAMED_ENTITY_RE.exec(line.slice(start));

    if (!match) {
        return null;
    }

    const decoded = utils.unescapeAll(match[0]);

    return decoded === match[0] ? null : {end: start + match[0].length, text: decoded};
};

const tokenizeInline = (line: string, contentStart: number): {delimiters: Delimiter[]; tokens: LineToken[]} => {
    const tokens: LineToken[] = [];
    const delimiters: Delimiter[] = [];
    const pushText = (start: number, end: number, text: string, lone = false): void => {
        tokens.push({end, kind: 'text', lone, start, text});
    };
    let pos = contentStart;

    while (pos < line.length) {
        const code = line.charCodeAt(pos);

        if (code === 0x5c) {
            const next = line[pos + 1];

            if (next !== undefined && ESCAPABLE.includes(next)) {
                pushText(pos, pos + 2, next);
                pos += 2;
                continue;
            }

            pushText(pos, pos + 1, '\\');
            pos += 1;
            continue;
        }

        if (code === 0x26) {
            const entity = decodeEntity(line, pos);

            if (entity) {
                pushText(pos, entity.end, entity.text);
                pos = entity.end;
                continue;
            }
        }

        if (code === CODE_MARKER) {
            let runEnd = pos;

            while (runEnd < line.length && line.charCodeAt(runEnd) === CODE_MARKER) {
                runEnd += 1;
            }

            const length = runEnd - pos;
            const closer = findCodeCloser(line, pos, length);

            if (closer === -1) {
                for (let offset = pos; offset < runEnd; offset += 1) {
                    pushText(offset, offset + 1, '`');
                }

                pos = runEnd;
                continue;
            }

            const content = line.slice(runEnd, closer);
            const padding = /^ (.+) $/.test(content) ? 1 : 0;

            tokens.push({
                contentEnd: closer - padding,
                contentStart: runEnd + padding,
                end: closer + length,
                kind: 'code',
                start: pos,
            });
            pos = closer + length;
            continue;
        }

        if (code === STAR || code === UNDERSCORE) {
            const scanned = scanDelims(line, pos, code === STAR);

            for (let offset = 0; offset < scanned.length; offset += 1) {
                tokens.push({
                    end: pos + offset + 1,
                    format: DELIMITER_FORMATS[code]!,
                    kind: 'delim',
                    role: 'literal',
                    start: pos + offset,
                    text: String.fromCharCode(code),
                });
                delimiters.push({
                    close: scanned.canClose,
                    end: -1,
                    length: scanned.length,
                    marker: code,
                    open: scanned.canOpen,
                    token: tokens.length - 1,
                });
            }

            pos += scanned.length;
            continue;
        }

        if (code === TILDE || code === PLUS) {
            const scanned = scanDelims(line, pos, true);
            const character = String.fromCharCode(code);

            if (scanned.length < 2) {
                pushText(pos, pos + 1, character);
                pos += 1;
                continue;
            }

            let offset = 0;

            if (scanned.length % 2 === 1) {
                pushText(pos, pos + 1, character, true);
                offset = 1;
            }

            for (; offset < scanned.length; offset += 2) {
                tokens.push({
                    end: pos + offset + 2,
                    format: DELIMITER_FORMATS[code]!,
                    kind: 'delim',
                    role: 'literal',
                    start: pos + offset,
                    text: character + character,
                });

                // markdown-it-ins skips delimiters that can neither open nor close.
                if (code === PLUS && !scanned.canOpen && !scanned.canClose) {
                    continue;
                }

                delimiters.push({
                    close: scanned.canClose,
                    end: -1,
                    length: 0,
                    marker: code,
                    open: scanned.canOpen,
                    token: tokens.length - 1,
                });
            }

            pos += scanned.length;
            continue;
        }

        pushText(pos, pos + 1, line[pos]!);
        pos += 1;
    }

    return {delimiters, tokens};
};

const delimiterToken = (tokens: LineToken[], index: number): DelimiterToken => {
    const token = tokens[index];

    if (!token || token.kind !== 'delim') {
        throw new Error('Delimiter bookkeeping is out of sync with the token stream');
    }

    return token;
};

/** Assign opener/closer roles following markdown-it's post-processing rules. */
const pairDelimiters = (tokens: LineToken[], delimiters: Delimiter[]): void => {
    processDelimiters(delimiters);

    for (let index = delimiters.length - 1; index >= 0; index -= 1) {
        const start = delimiters[index]!;

        if (start.end === -1) {
            continue;
        }

        const end = delimiters[start.end]!;
        const opener = delimiterToken(tokens, start.token);
        const closer = delimiterToken(tokens, end.token);

        if (start.marker !== STAR && start.marker !== UNDERSCORE) {
            opener.role = 'open';
            closer.role = 'close';
            continue;
        }

        const previous = index > 0 ? delimiters[index - 1]! : null;
        const following = delimiters[start.end + 1];
        const isStrong = previous !== null && following !== undefined &&
            previous.end === start.end + 1 &&
            previous.marker === start.marker &&
            previous.token === start.token - 1 &&
            following.token === end.token + 1;

        if (isStrong) {
            const strongOpener = delimiterToken(tokens, previous.token);
            const strongCloser = delimiterToken(tokens, following.token);

            strongOpener.role = 'open';
            strongOpener.format = 'bold';
            strongOpener.end = opener.end;
            strongOpener.text += opener.text;
            opener.role = 'hidden';
            closer.role = 'close';
            closer.format = 'bold';
            closer.end = strongCloser.end;
            closer.text += strongCloser.text;
            strongCloser.role = 'hidden';
            index -= 1;
            continue;
        }

        opener.role = 'open';
        closer.role = 'close';
    }
};

const detectBlock = (line: string): LineBlock | null => {
    const heading = HEADING_RE.exec(line);

    if (heading) {
        const level = heading[1]!.length;

        return {
            displayLength: 0,
            indent: '',
            key: HEADING_BLOCK_KEYS[Math.min(level, 3) - 1]!,
            level,
            marker: heading[1]!,
            markerLength: level + 1,
            ordinal: null,
            type: 'heading',
        };
    }

    const list = LIST_RE.exec(line);

    if (!list) {
        return null;
    }

    const indent = list[1]!;
    const marker = list[2]!;
    const ordered = /^\d/.test(marker);

    return {
        displayLength: indent.length + (ordered ? marker.length + 1 : BULLET_GLYPH.length),
        indent,
        key: null,
        level: 0,
        marker,
        markerLength: list[0].length,
        ordinal: ordered ? Number(marker.slice(0, -1)) : null,
        type: ordered ? 'ordered' : 'bullet',
    };
};

const parseLine = (line: string, literal: boolean): ParsedLine => {
    const chars: LineChar[] = [];
    const spans: WysiwygSpan[] = [];
    const block = literal ? null : detectBlock(line);
    const blockKey: WysiwygBlock = block?.key ?? null;
    let contentStart = 0;

    if (block) {
        contentStart = block.markerLength;

        if (block.type !== 'heading') {
            const glyph = block.indent + (block.type === 'ordered' ? `${block.marker} ` : BULLET_GLYPH);

            for (const character of glyph) {
                chars.push({
                    block: 'list-marker',
                    end: contentStart,
                    formats: NO_FORMATS,
                    literal: false,
                    start: 0,
                    synthetic: true,
                    text: character,
                });
            }
        }
    }

    if (literal) {
        for (let index = 0; index < line.length; index += 1) {
            chars.push({block: null, end: index + 1, formats: NO_FORMATS, literal: true, start: index, synthetic: false, text: line[index]!});
        }

        return {block, chars, spans};
    }

    const {delimiters, tokens} = tokenizeInline(line, contentStart);

    pairDelimiters(tokens, delimiters);

    const stack: {displayStart: number; format: WysiwygInlineFormat; openEnd: number; openStart: number}[] = [];
    let formats: readonly WysiwygInlineFormat[] = NO_FORMATS;
    const pushChar = (text: string, start: number, end: number, charFormats: readonly WysiwygInlineFormat[]): void => {
        const plain = end - start === text.length && line.slice(start, end) === text;

        // Escapes and character references share one source range; plain runs
        // (such as an unmatched ~~) map every character to its own byte.
        for (let offset = 0; offset < text.length; offset += 1) {
            chars.push({
                block: blockKey,
                end: plain ? start + offset + 1 : end,
                formats: charFormats,
                literal: !plain,
                start: plain ? start + offset : start,
                synthetic: false,
                text: text[offset]!,
            });
        }
    };
    const closeSpan = (token: DelimiterToken): void => {
        const open = stack.pop();

        if (!open) {
            throw new Error('Closing delimiter without an opener');
        }

        spans.push({
            closeEnd: token.end,
            closeStart: token.start,
            displayEnd: chars.length,
            displayStart: open.displayStart,
            format: open.format,
            openEnd: open.openEnd,
            openStart: open.openStart,
        });
        formats = stack.map((entry) => entry.format);
    };

    for (let index = 0; index < tokens.length; index += 1) {
        const token = tokens[index]!;

        if (token.kind === 'code') {
            const codeFormats = [...formats, 'inline-code' as const];

            for (let offset = token.contentStart; offset < token.contentEnd; offset += 1) {
                pushChar(line[offset]!, offset, offset + 1, codeFormats);
            }

            spans.push({
                closeEnd: token.end,
                closeStart: token.contentEnd,
                displayEnd: chars.length,
                displayStart: chars.length - (token.contentEnd - token.contentStart),
                format: 'inline-code',
                openEnd: token.contentStart,
                openStart: token.start,
            });
            continue;
        }

        if (token.kind === 'text') {
            if (token.lone) {
                // markdown-it moves a lone marker behind the closers that follow it.
                let next = index + 1;

                while (next < tokens.length) {
                    const candidate = tokens[next]!;

                    if (candidate.kind !== 'delim' || candidate.role !== 'close' || candidate.text[0] !== token.text) {
                        break;
                    }

                    closeSpan(candidate);
                    next += 1;
                }

                index = next - 1;
            }

            pushChar(token.text, token.start, token.end, formats);
            continue;
        }

        switch (token.role) {
            case 'open':
                stack.push({displayStart: chars.length, format: token.format, openEnd: token.end, openStart: token.start});
                formats = stack.map((entry) => entry.format);
                break;
            case 'close':
                closeSpan(token);
                break;
            case 'hidden':
                break;
            default:
                pushChar(token.text, token.start, token.end, formats);
        }
    }

    spans.sort((left, right) => left.openStart - right.openStart);

    return {block, chars, spans};
};

const LINE_CACHE_LIMIT = 4000;
const MODEL_CACHE_LIMIT = 16;
const lineCache = new Map<string, ParsedLine>();
const modelCache = new Map<string, WysiwygModel>();

const remember = <T,>(cache: Map<string, T>, key: string, value: T, limit: number): T => {
    cache.set(key, value);

    if (cache.size > limit) {
        const oldest = cache.keys().next();

        if (!oldest.done) {
            cache.delete(oldest.value);
        }
    }

    return value;
};

const parseLineCached = (line: string, literal: boolean): ParsedLine => {
    const key = (literal ? 'L' : 'N') + line;
    const cached = lineCache.get(key);

    if (cached) {
        return cached;
    }

    return remember(lineCache, key, parseLine(line, literal), LINE_CACHE_LIMIT);
};

const formatsKey = (formats: readonly WysiwygInlineFormat[]): string =>
    [...formats].sort().join('|');

/**
 * Parse markdown into a WYSIWYG model. Inline markers are hidden, heading
 * prefixes are hidden and their line styled, and list markers are replaced with
 * a synthetic bullet/number glyph. Fenced code stays literal. Lines are parsed
 * independently and cached, so an edit only re-parses the lines it touches.
 */
export const buildWysiwygModel = (source: string): WysiwygModel => {
    const cached = modelCache.get(source);

    if (cached) {
        return cached;
    }

    const displayChars: string[] = [];
    const charSource: number[] = [];
    const charSynthetic: boolean[] = [];
    const charLiteral: boolean[] = [];
    const charMarkerStart: number[] = [];
    const charMarkerEnd: number[] = [];
    const charFormats: (readonly WysiwygInlineFormat[])[] = [];
    const charBlock: WysiwygBlock[] = [];
    const spans: WysiwygSpan[] = [];
    const blocks: WysiwygBlockMarker[] = [];
    const pushChar = (text: string, start: number, end: number, synthetic: boolean, literal: boolean, formats: readonly WysiwygInlineFormat[], block: WysiwygBlock): void => {
        displayChars.push(text);
        charSource.push(synthetic ? end : start);
        charSynthetic.push(synthetic);
        charLiteral.push(literal);
        charMarkerStart.push(start);
        charMarkerEnd.push(end);
        charFormats.push(formats);
        charBlock.push(block);
    };

    let lineStart = 0;
    let fence: string | null = null;

    while (lineStart <= source.length) {
        const newlineIndex = source.indexOf('\n', lineStart);
        const lineEnd = newlineIndex === -1 ? source.length : newlineIndex;
        const hasCarriageReturn = lineEnd > lineStart && source[lineEnd - 1] === '\r';
        const textEnd = hasCarriageReturn ? lineEnd - 1 : lineEnd;
        const lineText = source.slice(lineStart, textEnd);
        const possibleFence = FENCE_RE.exec(lineText);
        const fenceMatch = possibleFence?.[1]?.[0] === '`' && possibleFence[2]!.includes('`')
            ? null
            : possibleFence;
        const literal = fence !== null || fenceMatch !== null;

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

        const parsed = parseLineCached(lineText, literal);
        const displayOffset = displayChars.length;

        if (parsed.block) {
            blocks.push({
                displayEnd: displayOffset + parsed.block.displayLength,
                displayStart: displayOffset,
                indent: parsed.block.indent,
                level: parsed.block.level,
                marker: parsed.block.marker,
                ordinal: parsed.block.ordinal,
                sourceEnd: lineStart + parsed.block.markerLength,
                sourceStart: lineStart,
                type: parsed.block.type,
            });
        }

        for (const char of parsed.chars) {
            pushChar(char.text, lineStart + char.start, lineStart + char.end, char.synthetic, char.literal, char.formats, char.block);
        }

        for (const span of parsed.spans) {
            spans.push({
                closeEnd: lineStart + span.closeEnd,
                closeStart: lineStart + span.closeStart,
                displayEnd: displayOffset + span.displayEnd,
                displayStart: displayOffset + span.displayStart,
                format: span.format,
                openEnd: lineStart + span.openEnd,
                openStart: lineStart + span.openStart,
            });
        }

        if (hasCarriageReturn) {
            pushChar('\r', textEnd, lineEnd, false, false, NO_FORMATS, null);
        }

        if (newlineIndex === -1) {
            break;
        }

        pushChar('\n', newlineIndex, newlineIndex + 1, false, false, NO_FORMATS, null);
        lineStart = newlineIndex + 1;
    }

    const segments: WysiwygSegment[] = [];
    let currentKey: string | null = null;

    for (let charIndex = 0; charIndex < displayChars.length; charIndex += 1) {
        const formats = charFormats[charIndex]!;
        const block = charBlock[charIndex]!;
        const synthetic = charSynthetic[charIndex]!;
        const key = `${formatsKey(formats)}\u0000${block ?? ''}\u0000${synthetic ? '1' : '0'}`;

        if (key !== currentKey) {
            segments.push({block, formats: [...formats], synthetic, text: displayChars[charIndex]!});
            currentKey = key;
            continue;
        }

        segments[segments.length - 1]!.text += displayChars[charIndex]!;
    }

    return remember(modelCache, source, {
        blocks,
        charFormats,
        charLiteral,
        charMarkerEnd,
        charMarkerStart,
        charSource,
        charSynthetic,
        display: displayChars.join(''),
        segments,
        source,
        spans,
    }, MODEL_CACHE_LIMIT);
};

/**
 * Map a display selection onto a markdown source range. Visible characters in
 * the selection are covered without swallowing the hidden markers that wrap
 * them; a selection edge on a synthetic marker covers the whole raw marker.
 */
export const displaySelectionToSource = (
    model: WysiwygModel,
    selection: MarkdownSelection,
): MarkdownSelection => {
    const normalized = normalizeSelection(model.display, selection);
    const length = model.charSource.length;
    const start = normalized.start < length
        ? model.charMarkerStart[normalized.start]!
        : length === 0 ? model.source.length : model.charMarkerEnd[length - 1]!;
    const end = normalized.end > normalized.start
        ? model.charMarkerEnd[normalized.end - 1]!
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
    let low = 0;
    let high = model.charMarkerEnd.length;

    while (low < high) {
        const middle = Math.floor((low + high) / 2);

        if (model.charMarkerEnd[middle]! <= sourceOffset) {
            low = middle + 1;
        } else {
            high = middle;
        }
    }

    return low;
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
    if (model.charFormats.length === 0) {
        return NO_FORMATS;
    }

    const target = Math.min(Math.max(displayOffset - 1, 0), model.charFormats.length - 1);

    return model.charFormats[target]!;
};

const DOUBLED_MARKER_RE = /^[*_+~]$/;

/**
 * Remove inline pairs with no display content, such as `**` `**` left behind
 * after deleting a span's text in the plain-text editor. Literal code, fenced
 * blocks and unmatched delimiters are preserved.
 */
export const cleanEmptyMarkers = (source: string): string => {
    let current = source;

    for (let pass = 0; pass < 8; pass += 1) {
        const model = buildWysiwygModel(current);
        const removed = new Uint8Array(current.length);
        let changed = false;

        for (const span of model.spans) {
            if (span.displayStart === span.displayEnd) {
                removed.fill(1, span.openStart, span.openEnd);
                removed.fill(1, span.closeStart, span.closeEnd);
                changed = true;
            }
        }

        // Runs such as **** are literal text in CommonMark, yet they are what a
        // deletion leaves behind. Drop them in groups of two markers.
        let runStart = 0;

        while (runStart < model.display.length) {
            const character = model.display[runStart]!;
            let runEnd = runStart;

            while (
                runEnd < model.display.length &&
                model.display[runEnd] === character &&
                DOUBLED_MARKER_RE.test(character) &&
                !model.charLiteral[runEnd] &&
                !model.charFormats[runEnd]!.includes('inline-code') &&
                (runEnd === runStart || model.charMarkerStart[runEnd] === model.charMarkerEnd[runEnd - 1])
            ) {
                runEnd += 1;
            }

            if (runEnd === runStart) {
                runStart += 1;
                continue;
            }

            const length = runEnd - runStart;
            const dropped = length - (length % 4);

            if (dropped > 0) {
                removed.fill(1, model.charMarkerStart[runStart]!, model.charMarkerStart[runStart]! + dropped);
                changed = true;
            }

            runStart = runEnd;
        }

        if (!changed) {
            return current;
        }

        let next = '';

        for (let index = 0; index < current.length; index += 1) {
            if (!removed[index]) {
                next += current[index]!;
            }
        }

        current = next;
    }

    return current;
};

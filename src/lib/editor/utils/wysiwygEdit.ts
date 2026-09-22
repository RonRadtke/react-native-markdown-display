import {normalizeSelection} from './selection';
import {
    BULLET_GLYPH,
    buildWysiwygModel,
    sourceOffsetToDisplay,
    type WysiwygInlineFormat,
    type WysiwygModel,
    type WysiwygSpan,
} from './wysiwygModel';

import type {MarkdownCommandResult, MarkdownSelection} from '../types';

export interface WysiwygEditResult extends MarkdownCommandResult {
    /**
     * True when typed markdown closed a span at the caret. Pass it back as
     * `caretOutside` on the next edit so typing continues after the span.
     */
    caretOutside: boolean;
    /** Display text the surface should show after the edit. */
    display: string;
}

export interface WysiwygEditOptions {
    /** Insert at the caret outside any span that ends there instead of extending it. */
    caretOutside?: boolean;
}

interface DisplayEdit extends MarkdownSelection {
    inserted: string;
}

const INLINE_ORDER: readonly WysiwygInlineFormat[] = ['bold', 'italic', 'underline', 'strikethrough'];
const MARKER_CLASS_RE = /[\\`*_~+]/;
const WHITESPACE_RE = /\s/;
const WORD_RE = /[\p{L}\p{N}_]/u;

/**
 * The edit pipeline works on a list of units: the surviving bytes of the old
 * source classified as display characters, hidden delimiters, block prefixes
 * and newlines, plus the pieces inserted by the edit. Concatenating the units
 * yields the next source; the classification lets the pipeline verify that
 * every surviving span is still recognised and repair the edited lines when
 * it is not, leaving untouched lines byte-identical.
 */
interface CharUnit {
    /** Display index in the old model, or -1 for inserted characters. */
    displayIndex: number;
    formats: readonly WysiwygInlineFormat[];
    inserted: boolean;
    kind: 'char';
    literal: boolean;
    /** Markdown emitted for the character (escape or entity for literals). */
    source: string;
    text: string;
}

interface RawUnit {
    caret: boolean;
    /** Display text the unit produces (a glyph for list prefixes). */
    display: string;
    kind: 'raw';
    newline: boolean;
    text: string;
    touched: boolean;
}

interface DelimiterUnit {
    format: WysiwygInlineFormat;
    kind: 'open' | 'close';
    span: number;
    text: string;
}

type Unit = CharUnit | RawUnit | DelimiterUnit;

const raw = (text: string, options: Partial<Omit<RawUnit, 'kind' | 'text'>> = {}): RawUnit => ({
    caret: false,
    display: '',
    kind: 'raw',
    newline: false,
    text,
    touched: false,
    ...options,
});

const newlineUnit = (): RawUnit => raw('\n', {display: '\n', newline: true, touched: true});

const stripMarkers = (text: string): string => text.replace(/[\\`*_~+]/g, '');

const chars = (text: string, formats: readonly WysiwygInlineFormat[]): CharUnit[] =>
    Array.from({length: text.length}, (_unit, index) => ({
        displayIndex: -1,
        formats,
        inserted: true,
        kind: 'char' as const,
        literal: false,
        source: text[index]!,
        text: text[index]!,
    }));

const unitDisplayLength = (unit: Unit): number =>
    unit.kind === 'char' ? unit.text.length : unit.kind === 'raw' ? unit.display.length : 0;

const formatsKey = (formats: readonly WysiwygInlineFormat[]): string =>
    [...formats].sort().join('|');

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

interface Plan {
    /** Units inserted before the old source index used as key. */
    inserts: Map<number, Unit[]>;
    /** Span index that owns each old span after joins (`-1` when removed). */
    owner: number[];
    removed: Uint8Array;
}

const createPlan = (model: WysiwygModel): Plan => ({
    inserts: new Map(),
    owner: model.spans.map((_span, index) => index),
    removed: new Uint8Array(model.source.length),
});

const insertAt = (plan: Plan, index: number, units: Unit[]): void => {
    const slot = plan.inserts.get(index);

    if (slot) {
        slot.push(...units);
    } else {
        plan.inserts.set(index, units);
    }
};

/** Turn the old source plus a plan into the ordered unit list. */
const unitsFromPlan = (model: WysiwygModel, plan: Plan): Unit[] => {
    const {source} = model;
    const starts = new Map<number, Unit>();
    const ends = new Map<number, number>();
    const place = (start: number, end: number, unit: Unit): void => {
        if (!plan.removed[start]) {
            starts.set(start, unit);
            ends.set(start, end);
        }
    };

    for (let index = 0; index < model.charMarkerStart.length; index += 1) {
        if (model.charSynthetic[index]) {
            continue;
        }

        const start = model.charMarkerStart[index]!;
        const end = model.charMarkerEnd[index]!;
        const text = model.display[index]!;

        if (text === '\n') {
            place(start, end, raw(text, {display: '\n', newline: true}));
            continue;
        }

        // Decoded entities share one source range; a plain surrogate pair is
        // kept as one unit so a selection cannot format half a code point.
        const existing = starts.get(start);

        if (existing && existing.kind === 'char' && !plan.removed[start]) {
            existing.text += text;
            continue;
        }

        const previousStart = index > 0 ? model.charMarkerStart[index - 1]! : -1;
        const previous = starts.get(previousStart);

        if (
            previous && previous.kind === 'char' && !plan.removed[start] &&
            ends.get(previousStart) === start && /[\uD800-\uDBFF]$/.test(previous.text) && /^[\uDC00-\uDFFF]/.test(text)
        ) {
            previous.text += text;
            previous.source += source.slice(start, end);
            ends.set(previousStart, end);
            continue;
        }

        place(start, end, {
            displayIndex: index,
            formats: model.charFormats[index]!,
            inserted: false,
            kind: 'char',
            literal: model.charLiteral[index]!,
            source: source.slice(start, end),
            text,
        });
    }

    model.spans.forEach((span, index) => {
        const owner = plan.owner[index]!;

        if (owner === -1) {
            return;
        }

        place(span.openStart, span.openEnd, {format: span.format, kind: 'open', span: owner, text: source.slice(span.openStart, span.openEnd)});
        place(span.closeStart, span.closeEnd, {format: span.format, kind: 'close', span: owner, text: source.slice(span.closeStart, span.closeEnd)});
    });

    for (const block of model.blocks) {
        place(block.sourceStart, block.sourceEnd, raw(source.slice(block.sourceStart, block.sourceEnd), {
            display: model.display.slice(block.displayStart, block.displayEnd),
        }));
    }

    const units: Unit[] = [];

    for (let index = 0; index <= source.length; index += 1) {
        const inserted = plan.inserts.get(index);

        if (inserted) {
            units.push(...inserted);
        }

        const unit = starts.get(index);

        if (unit) {
            units.push(unit);
            index = ends.get(index)! - 1;
        }
    }

    return units;
};

const unitText = (unit: Unit): string => unit.kind === 'char' ? unit.source : unit.text;

const assemble = (units: readonly Unit[]): {caret: number; starts: number[]; value: string} => {
    const starts: number[] = [];
    let value = '';
    let caret = -1;

    for (const unit of units) {
        starts.push(value.length);

        if (unit.kind === 'raw' && unit.caret) {
            caret = value.length;
        }

        value += unitText(unit);
    }

    return {caret: caret === -1 ? value.length : caret, starts, value};
};

/** Spans the unit list promises, as `open:close:format` keys. */
const expectedSpanKeys = (units: readonly Unit[], starts: readonly number[]): Map<string, number[]> => {
    const pending = new Map<number, number[]>();
    const expected = new Map<string, number[]>();

    units.forEach((unit, index) => {
        if (unit.kind === 'open') {
            const stack = pending.get(unit.span) ?? [];
            stack.push(index);
            pending.set(unit.span, stack);
        } else if (unit.kind === 'close') {
            const opener = pending.get(unit.span)?.pop();

            if (opener !== undefined) {
                expected.set(`${starts[opener]}:${starts[index]}:${unit.format}`, [opener, index]);
            }
        }
    });

    return expected;
};

const actualSpanKeys = (model: WysiwygModel): Set<string> =>
    new Set(model.spans.map((span) => `${span.openStart}:${span.closeStart}:${span.format}`));

/** Unit indexes of delimiters whose span the parser no longer recognises. */
const missingDelimiters = (units: readonly Unit[]): number[] => {
    const {starts, value} = assemble(units);
    const actual = actualSpanKeys(buildWysiwygModel(value));
    const missing: number[] = [];

    for (const [key, indexes] of expectedSpanKeys(units, starts)) {
        if (!actual.has(key)) {
            missing.push(...indexes);
        }
    }

    return missing;
};

const richKeyOfModel = (model: WysiwygModel): string => {
    let key = '';

    for (let index = 0; index < model.display.length; index += 1) {
        if (!model.charSynthetic[index]) {
            key += `${model.display[index]}\u0001${formatsKey(model.charFormats[index]!)}\u0002`;
        }
    }

    return key;
};

const richKeyOfUnits = (units: readonly Unit[]): string => {
    let key = '';

    for (const unit of units) {
        if (unit.kind === 'char') {
            for (let index = 0; index < unit.text.length; index += 1) {
                key += `${unit.text[index]}\u0001${formatsKey(unit.formats)}\u0002`;
            }
        } else if (unit.kind === 'raw' && unit.newline) {
            key += '\n\u0001\u0002';
        }
    }

    return key;
};

interface SerializeOptions {
    bold: '**' | '__';
    /** Encode letters at invalid delimiter boundaries as character references. */
    encodeBoundaries: boolean;
    escapeAll: boolean;
    italic: '*' | '_';
}

const MARKER_CHOICES: readonly {bold: '**' | '__'; italic: '*' | '_'}[] = [
    {bold: '**', italic: '_'},
    {bold: '**', italic: '*'},
    {bold: '__', italic: '_'},
    {bold: '__', italic: '*'},
];

/** Cheapest rewrites first: plain markers, then escaping, then boundary encoding. */
const SERIALIZE_OPTIONS: readonly SerializeOptions[] = [
    ...MARKER_CHOICES.map((choice) => ({...choice, encodeBoundaries: false, escapeAll: false})),
    ...MARKER_CHOICES.map((choice) => ({...choice, encodeBoundaries: false, escapeAll: true})),
    ...MARKER_CHOICES.map((choice) => ({...choice, encodeBoundaries: true, escapeAll: true})),
];

type SerializedPart =
    | {kind: 'text' | 'code'; text: string}
    | {kind: 'delimiter'; opening: boolean; text: string};

/** Approximation of markdown-it's flanking rules for a delimiter between two characters. */
const validDelimiterBoundary = (marker: string, opening: boolean, before: string, after: string): boolean => {
    const beforeWhitespace = before === '' || WHITESPACE_RE.test(before);
    const afterWhitespace = after === '' || WHITESPACE_RE.test(after);
    const beforePunctuation = /[\p{P}\p{S}]/u.test(before);
    const afterPunctuation = /[\p{P}\p{S}]/u.test(after);
    const leftFlanking = !afterWhitespace && (!afterPunctuation || beforeWhitespace || beforePunctuation);
    const rightFlanking = !beforeWhitespace && (!beforePunctuation || afterWhitespace || afterPunctuation);
    const underscore = marker[0] === '_';

    return opening
        ? leftFlanking && (!underscore || !rightFlanking || beforePunctuation)
        : rightFlanking && (!underscore || !leftFlanking || afterPunctuation);
};

/**
 * CommonMark forbids boundaries such as **`code`**word. As a last resort the
 * adjacent letter is written as a character reference, which renders the same
 * text without adding a visible character.
 */
const encodeInvalidBoundaries = (parts: SerializedPart[]): void => {
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

            if (validDelimiterBoundary(part.text, part.opening, before, after)) {
                continue;
            }

            const boundary = part.opening ? previous : next;

            if (boundary?.kind === 'text' && /^[\p{L}\p{N}]$/u.test(boundary.text)) {
                boundary.text = `&#${boundary.text.codePointAt(0)!};`;
                changed = true;
            }
        }
    }
};

const markerFor = (format: WysiwygInlineFormat, options: SerializeOptions): string => {
    switch (format) {
        case 'bold':
            return options.bold;
        case 'italic':
            return options.italic;
        case 'underline':
            return '++';
        case 'strikethrough':
            return '~~';
        default:
            return '`';
    }
};

const serializeCode = (content: string): string => {
    let marker = '`';

    for (const run of content.match(/`+/g) ?? []) {
        if (run.length >= marker.length) {
            marker = '`'.repeat(run.length + 1);
        }
    }

    const needsPadding = content.startsWith('`') || content.endsWith('`') ||
        (content.startsWith(' ') && content.endsWith(' ') && content.trim().length > 0);
    const padding = needsPadding ? ' ' : '';

    return marker + padding + content + padding + marker;
};

const orderedFormats = (formats: readonly WysiwygInlineFormat[]): WysiwygInlineFormat[] =>
    INLINE_ORDER.filter((format) => formats.includes(format));

/** Serialize one line of display characters with the given marker choice. */
const serializeChars = (line: readonly CharUnit[], options: SerializeOptions): string => {
    const parts: SerializedPart[] = [];
    let active: WysiwygInlineFormat[] = [];
    const transition = (formats: WysiwygInlineFormat[]): void => {
        let common = 0;

        while (common < active.length && active[common] === formats[common]) {
            common += 1;
        }

        for (let index = active.length - 1; index >= common; index -= 1) {
            parts.push({kind: 'delimiter', opening: false, text: markerFor(active[index]!, options)});
        }

        for (let index = common; index < formats.length; index += 1) {
            parts.push({kind: 'delimiter', opening: true, text: markerFor(formats[index]!, options)});
        }

        active = formats;
    };

    for (let index = 0; index < line.length; index += 1) {
        const unit = line[index]!;
        const isCode = unit.formats.includes('inline-code');
        const formats = orderedFormats(unit.formats);

        if (!isCode && WHITESPACE_RE.test(unit.text)) {
            // Emphasis cannot open or close against whitespace. Keep only the
            // stack shared by both sides of the gap; reopen formats at text.
            let next = index + 1;

            while (next < line.length && WHITESPACE_RE.test(line[next]!.text) && !line[next]!.formats.includes('inline-code')) {
                next += 1;
            }

            const nextFormats = next < line.length ? orderedFormats(line[next]!.formats) : [];
            let common = 0;

            while (common < active.length && active[common] === formats[common] && active[common] === nextFormats[common]) {
                common += 1;
            }

            transition(active.slice(0, common));
            parts.push({kind: 'text', text: unit.literal ? unit.source : unit.text});
            continue;
        }

        transition(formats);

        if (isCode) {
            let content = '';
            let end = index;

            while (end < line.length && line[end]!.formats.includes('inline-code') && formatsKey(line[end]!.formats) === formatsKey(unit.formats)) {
                content += line[end]!.text;
                end += 1;
            }

            parts.push({kind: 'code', text: serializeCode(content)});
            index = end - 1;
            continue;
        }

        if (unit.literal) {
            parts.push({kind: 'text', text: unit.source});
        } else if (options.escapeAll && MARKER_CLASS_RE.test(unit.text)) {
            parts.push({kind: 'text', text: `\\${unit.text}`});
        } else {
            parts.push({kind: 'text', text: unit.text});
        }
    }

    transition([]);

    if (options.encodeBoundaries) {
        encodeInvalidBoundaries(parts);
    }

    return parts.map((part) => part.text).join('');
};

const splitLines = (units: readonly Unit[]): Unit[][] => {
    const lines: Unit[][] = [[]];

    for (const unit of units) {
        lines[lines.length - 1]!.push(unit);

        if (unit.kind === 'raw' && unit.newline) {
            lines.push([]);
        }
    }

    return lines;
};

const isTouched = (line: readonly Unit[]): boolean =>
    line.some((unit) => (unit.kind === 'char' && unit.inserted) || (unit.kind === 'raw' && unit.touched));

/**
 * Re-serialize the touched lines from their display characters, trying marker
 * choices and escaping until the parser reproduces the intended formatting.
 * Untouched lines are emitted byte for byte.
 */
const reserializeTouchedLines = (units: readonly Unit[]): Unit[] => {
    const lines = splitLines(units);
    const expected = richKeyOfUnits(units);
    let fallback: Unit[] | null = null;

    for (const options of SERIALIZE_OPTIONS) {
        const result: Unit[] = [];

        for (const line of lines) {
            if (!isTouched(line)) {
                result.push(...line);
                continue;
            }

            // Keep the prefix first and the caret marker among the characters
            // (which lose their bytes) so display offsets can still be counted.
            const prefixes: Unit[] = [];
            const collapsed: Unit[] = [];
            const lineChars: CharUnit[] = [];
            let end: Unit | null = null;

            for (const unit of line) {
                if (unit.kind === 'char') {
                    lineChars.push(unit);
                    collapsed.push({...unit, source: ''});
                } else if (unit.kind === 'raw' && unit.newline) {
                    end = unit;
                } else if (unit.kind === 'raw' && unit.text.length === 0) {
                    collapsed.push(unit);
                } else if (unit.kind === 'raw') {
                    prefixes.push(unit);
                }
            }

            result.push(...prefixes, ...collapsed, raw(serializeChars(lineChars, options)));

            if (end) {
                result.push(end);
            }
        }

        fallback ??= result;

        if (richKeyOfModel(buildWysiwygModel(assemble(result).value)) === expected) {
            return result;
        }
    }

    return fallback ?? [...units];
};

const swapFamily = (text: string): string =>
    text[0] === '_' ? text.replace(/_/g, '*') : text.replace(/\*/g, '_');

/**
 * Produce the next source from a unit list: accept it when every promised span
 * is recognised or when hand-typed markdown re-shaped the spans without
 * altering visible text; otherwise escape typed markers, switch delimiter
 * families and finally re-serialize the edited lines.
 */
const realize = (units: Unit[], expectedDisplay: string | null): WysiwygEditResult => {
    const typedMarkers = units.some((unit) => unit.kind === 'char' && unit.inserted && MARKER_CLASS_RE.test(unit.text));
    let missing = missingDelimiters(units);

    if (missing.length > 0 && typedMarkers && expectedDisplay !== null) {
        const display = buildWysiwygModel(assemble(units).value).display;

        if (stripMarkers(display) === stripMarkers(expectedDisplay)) {
            missing = [];
        }
    }

    if (missing.length > 0 && typedMarkers) {
        const escaped = units.map((unit): Unit =>
            unit.kind === 'char' && unit.inserted && MARKER_CLASS_RE.test(unit.text)
                ? {...unit, literal: true, source: `\\${unit.text}`}
                : unit,
        );
        const escapedMissing = missingDelimiters(escaped);

        if (escapedMissing.length < missing.length) {
            units = escaped;
            missing = escapedMissing;
        }
    }

    for (let attempt = 0; attempt < 2 && missing.length > 0; attempt += 1) {
        const swapped = units.map((unit, index): Unit =>
            missing.includes(index) && (unit.kind === 'open' || unit.kind === 'close') && (unit.format === 'bold' || unit.format === 'italic')
                ? {...unit, text: swapFamily(unit.text)}
                : unit,
        );
        const swappedMissing = missingDelimiters(swapped);

        if (swappedMissing.length < missing.length) {
            units = swapped;
            missing = swappedMissing;
        } else {
            break;
        }
    }

    const reserialized = missing.length > 0;

    if (reserialized) {
        units = reserializeTouchedLines(units);
    }

    const {caret, value} = assemble(units);
    const nextModel = buildWysiwygModel(value);
    let displayCaret: number;

    if (reserialized) {
        // Re-serialized lines carry their bytes in one unit; count display text instead.
        displayCaret = 0;

        for (const unit of units) {
            if (unit.kind === 'raw' && unit.caret) {
                break;
            }

            displayCaret += unitDisplayLength(unit);
        }

        displayCaret = Math.min(displayCaret, nextModel.display.length);
    } else {
        displayCaret = sourceOffsetToDisplay(nextModel, caret);
    }

    return {
        caretOutside: typedMarkers && expectedDisplay !== null && nextModel.display !== expectedDisplay,
        display: nextModel.display,
        selection: {end: displayCaret, start: displayCaret},
        value,
    };
};

const spanFormats = (spans: readonly WysiwygSpan[]): WysiwygInlineFormat[] => spans.map((span) => span.format);

const lineStartOf = (source: string, index: number): number =>
    index === 0 ? 0 : source.lastIndexOf('\n', index - 1) + 1;

const lineEndOf = (source: string, index: number): number => {
    const newline = source.indexOf('\n', index);

    return newline === -1 ? source.length : newline;
};

const QUOTE_RE = /^([ \t]*>[ \t]?)(.*)$/;

interface Continuation {
    /** Display text of the new prefix (a glyph for lists, the marker for quotes). */
    display: string;
    exitEnd: number;
    exitStart: number;
    prefix: string;
}

/** List and quote continuation for a single Enter, mirroring the plain-text shortcuts. */
const findContinuation = (model: WysiwygModel, lineStart: number): Continuation | null => {
    const lineEnd = lineEndOf(model.source, lineStart);
    const block = model.blocks.find((candidate) => candidate.sourceStart === lineStart);

    if (block && block.type !== 'heading') {
        const empty = model.source.slice(block.sourceEnd, lineEnd).trim().length === 0;
        const ordinal = block.ordinal === null ? null : block.ordinal + 1;
        const marker = ordinal === null ? `${block.marker} ` : `${ordinal}${block.marker.slice(-1)} `;

        return {
            display: block.indent + (ordinal === null ? BULLET_GLYPH : marker),
            exitEnd: empty ? block.sourceEnd : -1,
            exitStart: block.sourceStart,
            prefix: block.indent + marker,
        };
    }

    const quote = QUOTE_RE.exec(model.source.slice(lineStart, lineEnd).replace(/\r$/, ''));

    if (!quote) {
        return null;
    }

    const marker = quote[1]!;
    const empty = quote[2]!.trim().length === 0;
    const prefix = marker.endsWith(' ') ? marker : `${marker} `;

    return {
        display: prefix,
        exitEnd: empty ? lineStart + marker.length : -1,
        exitStart: lineStart,
        prefix,
    };
};

const trailingWhitespaceStart = (text: string): number => {
    let index = text.length;

    while (index > 0 && WHITESPACE_RE.test(text[index - 1]!)) {
        index -= 1;
    }

    return index;
};

const leadingWhitespaceEnd = (text: string): number => {
    let index = 0;

    while (index < text.length && WHITESPACE_RE.test(text[index]!)) {
        index += 1;
    }

    return index;
};

/**
 * Translate a display edit into a plan on the old source. Text typed after a
 * character continues its formatting; trailing whitespace moves outside the
 * closing delimiters so they stay valid; code spans are not extended by typing
 * at their end; newlines close open spans and reopen them on the next line.
 */
const planDisplayEdit = (model: WysiwygModel, edit: DisplayEdit, caretOutside: boolean): Plan => {
    const plan = createPlan(model);
    const {source, spans} = model;
    const replacing = edit.end > edit.start;
    const containing = (displayIndex: number): WysiwygSpan[] =>
        spans.filter((span) => span.displayStart <= displayIndex && displayIndex < span.displayEnd);

    // 1. Deleted characters, joined block prefixes and emptied spans.
    let sourceStart: number;
    let sourceEnd: number;
    let context: WysiwygSpan[];

    if (replacing) {
        sourceStart = model.charMarkerStart[edit.start]!;
        sourceEnd = model.charMarkerEnd[edit.end - 1]!;
        plan.removed.fill(1, sourceStart, sourceEnd);

        for (const block of model.blocks) {
            if (block.sourceStart > 0 && plan.removed[block.sourceStart - 1]) {
                plan.removed.fill(1, block.sourceStart, block.sourceEnd);
            }
        }

        spans.forEach((span, index) => {
            if (span.displayStart >= edit.start && span.displayEnd <= edit.end) {
                plan.removed.fill(1, span.openStart, span.openEnd);
                plan.removed.fill(1, span.closeStart, span.closeEnd);
                plan.owner[index] = -1;
            } else {
                plan.removed.fill(0, span.openStart, span.openEnd);
                plan.removed.fill(0, span.closeStart, span.closeEnd);
            }
        });

        context = containing(edit.start).filter((span) => plan.owner[spans.indexOf(span)] !== -1);
    } else {
        const previous = edit.start - 1;
        const previousText = previous >= 0 ? model.display[previous]! : '\n';

        if (previousText === '\n' || (previous >= 0 && model.charSynthetic[previous])) {
            // Start of a line: type plain text after the block prefix.
            if (previous >= 0 && model.charSynthetic[previous]) {
                sourceStart = model.charMarkerEnd[previous]!;
            } else {
                const lineStart = edit.start < model.display.length
                    ? lineStartOf(source, model.charMarkerStart[edit.start]!)
                    : lineStartOf(source, source.length);
                const block = model.blocks.find((candidate) => candidate.sourceStart === lineStart);

                sourceStart = block ? block.sourceEnd : lineStart;
            }

            context = [];
        } else {
            sourceStart = model.charMarkerEnd[previous]!;
            context = containing(previous);

            // Code spans are not extended by typing at their end, and neither
            // is any span once typed markdown has just closed it.
            const exits = (span: WysiwygSpan): boolean =>
                span.displayEnd === edit.start && (caretOutside || span.format === 'inline-code');

            for (const span of context) {
                if (exits(span)) {
                    sourceStart = Math.max(sourceStart, span.closeEnd);
                }
            }

            context = context.filter((span) => !exits(span));
        }

        sourceEnd = sourceStart;
    }

    // 2. Pure deletions join spans separated only by the deleted text.
    if (replacing && edit.inserted.length === 0) {
        spans.forEach((left, leftIndex) => {
            if (plan.owner[leftIndex] === -1 || left.displayEnd > edit.start) {
                return;
            }

            const rightIndex = spans.findIndex((right, index) =>
                plan.owner[index] === index && right.displayStart >= edit.end && right.format === left.format &&
                source.slice(right.openStart, right.openEnd) === source.slice(left.openStart, left.openEnd) &&
                right.openStart >= left.closeEnd && plan.removed.slice(left.closeEnd, right.openStart).every((flag) => flag === 1) &&
                formatsKey(model.charFormats[left.displayEnd - 1]!) === formatsKey(model.charFormats[right.displayStart]!));

            if (rightIndex === -1) {
                return;
            }

            plan.removed.fill(1, left.closeStart, left.closeEnd);
            plan.removed.fill(1, spans[rightIndex]!.openStart, spans[rightIndex]!.openEnd);
            plan.owner[rightIndex] = plan.owner[leftIndex]!;
        });
    }

    // 3. Where the inserted text goes relative to the surrounding delimiters.
    const closing = context.filter((span) => span.displayEnd <= edit.end && span.format !== 'inline-code');
    const straddling = context.filter((span) => span.displayEnd > edit.end);
    let closersEnd = sourceStart;

    for (const span of closing) {
        closersEnd = Math.max(closersEnd, span.closeEnd);
    }

    // Openers kept inside a replaced range must stay behind the relocated text.
    for (const span of spans) {
        if (span.openStart >= sourceStart && span.openStart < sourceEnd && !plan.removed[span.openStart]) {
            closersEnd = Math.min(closersEnd, span.openStart);
        }
    }

    closersEnd = Math.max(closersEnd, sourceStart);

    const headFormats = spanFormats(context);
    const parts = edit.inserted.split('\n');
    const first = parts[0]!;
    const caret = raw('', {caret: true, touched: true});

    if (parts.length === 1) {
        const split = closing.length > 0 ? trailingWhitespaceStart(first) : first.length;

        insertAt(plan, sourceStart, chars(first.slice(0, split), headFormats));
        insertAt(plan, closersEnd, [...chars(first.slice(split), spanFormats(straddling)), caret]);

        if (first.length === 0) {
            insertAt(plan, sourceStart, [raw('', {touched: true})]);
        }

        return plan;
    }

    const lineStart = lineStartOf(source, sourceStart);
    const continuation = edit.inserted === '\n' ? findContinuation(model, lineStart) : null;

    if (continuation && continuation.exitEnd !== -1) {
        plan.removed.fill(1, continuation.exitStart, continuation.exitEnd);
        insertAt(plan, continuation.exitEnd, [caret]);

        return plan;
    }

    const last = parts[parts.length - 1]!;
    const firstSplit = trailingWhitespaceStart(first);
    const lastSplit = leadingWhitespaceEnd(last);
    const innerFirst = [...straddling].reverse();
    const middle: Unit[] = [];

    for (const span of innerFirst) {
        middle.push({format: span.format, kind: 'close', span: spans.indexOf(span), text: source.slice(span.closeStart, span.closeEnd)});
    }

    middle.push(...chars(first.slice(firstSplit), []), newlineUnit());

    if (continuation) {
        middle.push(raw(continuation.prefix, {display: continuation.display, touched: true}));
    }

    for (const part of parts.slice(1, -1)) {
        middle.push(...chars(part, []), newlineUnit());
    }

    middle.push(...chars(last.slice(0, lastSplit), []));

    for (const span of straddling) {
        middle.push({format: span.format, kind: 'open', span: spans.indexOf(span), text: source.slice(span.openStart, span.openEnd)});
    }

    insertAt(plan, sourceStart, chars(first.slice(0, firstSplit), headFormats));
    insertAt(plan, closersEnd, middle);
    insertAt(plan, Math.max(sourceEnd, closersEnd), [...chars(last.slice(lastSplit), spanFormats(straddling)), caret]);

    return plan;
};

/**
 * Translate a change made to the visible display text back onto the markdown
 * source. The previous display selection disambiguates repeated characters;
 * callers without one retain the common prefix/suffix fallback. Bytes outside
 * the edit are preserved unless a delimiter has to move or be repaired to keep
 * the surviving formatting valid; only the edited lines are ever rewritten.
 */
export const applyDisplayEdit = (
    previousSource: string,
    nextDisplay: string,
    previousSelection?: MarkdownSelection,
    options: WysiwygEditOptions = {},
): WysiwygEditResult => {
    const model = buildWysiwygModel(previousSource);

    if (nextDisplay === model.display) {
        return {
            caretOutside: options.caretOutside === true,
            display: model.display,
            selection: normalizeSelection(model.display, previousSelection),
            value: previousSource,
        };
    }

    const edit = findDisplayEdit(model.display, nextDisplay, previousSelection);

    return realize(unitsFromPlan(model, planDisplayEdit(model, edit, options.caretOutside === true)), nextDisplay);
};

/**
 * Apply an inline format toggle from a toolbar while editing in WYSIWYG mode.
 * The selected display characters gain or lose the format and only the lines
 * they sit on are serialized again; block prefixes and other lines are kept.
 * A collapsed selection formats the word around the caret.
 */
export const applyInlineFormatWysiwyg = (
    source: string,
    displaySelection: MarkdownSelection,
    format: WysiwygInlineFormat,
): WysiwygEditResult => {
    const model = buildWysiwygModel(source);
    let selection = normalizeSelection(model.display, displaySelection);

    if (selection.start === selection.end) {
        let {start, end} = selection;

        while (start > 0 && WORD_RE.test(model.display[start - 1]!) && !model.charSynthetic[start - 1]) {
            start -= 1;
        }

        while (end < model.display.length && WORD_RE.test(model.display[end]!) && !model.charSynthetic[end]) {
            end += 1;
        }

        selection = {end, start};
    }

    const selected = new Set<number>();

    for (let index = selection.start; index < selection.end; index += 1) {
        const text = model.display[index]!;
        const skip = model.charSynthetic[index] ||
            (format === 'inline-code' ? text === '\n' || text === '\r' : WHITESPACE_RE.test(text));

        if (!skip) {
            selected.add(index);
        }
    }

    if (selected.size === 0) {
        return {caretOutside: false, display: model.display, selection, value: source};
    }

    const remove = [...selected].every((index) => model.charFormats[index]!.includes(format));
    const units = unitsFromPlan(model, createPlan(model));
    const toggled = units.map((unit): Unit => {
        if (unit.kind !== 'char' || !selected.has(unit.displayIndex)) {
            return unit;
        }

        const formats = unit.formats.filter((active) => active !== format);

        return {...unit, formats: remove ? formats : [...formats, format], inserted: true};
    });

    const {value} = assemble(reserializeTouchedLines(toggled));

    return {caretOutside: false, display: buildWysiwygModel(value).display, selection, value};
};

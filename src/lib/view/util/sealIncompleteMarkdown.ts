/**
 * Closes any unclosed fenced code block so that markdown-it produces a stable
 * parse during incremental / streaming delivery.
 *
 * Only the raw source string is touched — the parser, renderer, plugins, rules,
 * and styles are all downstream of this and remain completely unaffected.
 *
 * CommonMark fence rules implemented here:
 *  - Opening fence: line starting with 3+ identical chars (` or ~), optional
 *    info string after backtick fences (tildes allow backticks in info).
 *  - Closing fence: same char type, at least as many chars as the opener, rest
 *    of the line is optional whitespace only.
 *  - Backtick fences cannot be closed by tilde fences and vice-versa.
 */
export function sealIncompleteMarkdown(source: string): string {
    const lines = source.split('\n');
    let openFenceChar: string | null = null;
    let openFenceLen = 0;

    for (const line of lines) {
        if (openFenceChar === null) {
            const m = /^(`{3,}|~{3,})/.exec(line);

            if (m?.[1]) {
                openFenceChar = m[1][0] as string;
                openFenceLen = m[1].length;
            }
        } else {
            const closeRe = openFenceChar === '`' ? /^`{3,}\s*$/ : /^~{3,}\s*$/;

            if (closeRe.test(line) && line.trimEnd().length >= openFenceLen) {
                openFenceChar = null;
                openFenceLen = 0;
            }
        }
    }

    if (openFenceChar !== null) {
        return `${source}\n${openFenceChar.repeat(openFenceLen)}`;
    }

    return source;
}

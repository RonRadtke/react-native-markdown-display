import type {MarkdownParser, TokenLike} from '../types';

export function stringToTokens(
  source: string,
  markdownIt: MarkdownParser,
): TokenLike[] {
  try {
    return markdownIt.parse(source, {});
  } catch (error) {
    console.warn(error);
    return [];
  }
}

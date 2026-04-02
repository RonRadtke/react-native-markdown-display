import Token from './Token';

import type {TokenLike} from '../types';

export default function groupTextTokens(tokens: TokenLike[]): TokenLike[] {
  const result: TokenLike[] = [];
  let hasGroup = false;

  tokens.forEach((token) => {
    if (!token.block && !hasGroup) {
      hasGroup = true;
      result.push(new Token('textgroup', 1));
      result.push(token);
    } else if (!token.block && hasGroup) {
      result.push(token);
    } else if (token.block && hasGroup) {
      hasGroup = false;
      result.push(new Token('textgroup', -1));
      result.push(token);
    } else {
      result.push(token);
    }
  });

  return result;
}

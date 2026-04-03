import type {TokenLike} from '../types';

const regSelectOpenClose = /_open|_close/g;

export default function getTokenTypeByToken(token: TokenLike): string {
    let cleanedType = 'unknown';

    if (token.type) {
        cleanedType = token.type.replace(regSelectOpenClose, '');
    }

    if (cleanedType === 'heading') {
        return `${cleanedType}${token.tag.slice(1)}`;
    }

    return cleanedType;
}

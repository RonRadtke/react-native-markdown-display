import cssToReactNative from 'css-to-react-native';

import type {MarkdownStyleObject} from '../types';

export default function convertAdditionalStyles(
    style: string,
): MarkdownStyleObject {
    const tuples = style
        .split(';')
        .map((rule) => {
            const [rawKey, rawValue] = rule.split(':');

            if (!rawKey || !rawValue) {
                return null;
            }

            return [rawKey.trim(), rawValue.trim()] as [string, string];
        })
        .filter((tuple): tuple is [string, string] => tuple !== null);

    return cssToReactNative(tuples) as MarkdownStyleObject;
}

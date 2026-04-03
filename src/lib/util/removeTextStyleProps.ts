import textStyleProps from '../data/textStyleProps';

import type {MarkdownStyleObject} from '../types';

export default function removeTextStyleProps(
    style: MarkdownStyleObject,
): MarkdownStyleObject {
    const cleanedStyle = {
        ...style,
    } as Record<string, MarkdownStyleObject[keyof MarkdownStyleObject]>;

    textStyleProps.forEach((propertyName) => {
        delete cleanedStyle[propertyName];
    });

    return cleanedStyle as MarkdownStyleObject;
}

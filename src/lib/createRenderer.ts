import {StyleSheet, Text} from 'react-native';

import AstRenderer from './AstRenderer';
import renderRules from './renderRules';
import {styles as defaultStyles} from './styles';
import removeTextStyleProps from './util/removeTextStyleProps';

import type {
  MarkdownStyleMap,
  MarkdownStyleObject,
  OnLinkPress,
  RenderRules,
  TextComponent,
} from './types';
import type {ReactNode} from 'react';

export const getStyle = (
  mergeStyle: boolean,
  style: MarkdownStyleMap | null,
): MarkdownStyleMap => {
  const useStyles: Record<string, MarkdownStyleObject> = {};

  if (mergeStyle && style !== null) {
    Object.keys(style).forEach((styleName) => {
      useStyles[styleName] = {
        ...(StyleSheet.flatten(style[styleName]) ?? {}),
      };
    });

    Object.keys(defaultStyles).forEach((styleName) => {
      useStyles[styleName] = {
        ...defaultStyles[styleName],
        ...(StyleSheet.flatten(style[styleName]) ?? {}),
      };
    });
  } else {
    Object.assign(useStyles, defaultStyles);

    if (style !== null) {
      Object.keys(style).forEach((styleName) => {
        useStyles[styleName] = {
          ...(StyleSheet.flatten(style[styleName]) ?? {}),
        };
      });
    }
  }

  Object.keys(useStyles).forEach((styleName) => {
    useStyles[`_VIEW_SAFE_${styleName}`] = removeTextStyleProps(
      useStyles[styleName] ?? {},
    );
  });

  return StyleSheet.create(useStyles);
};

export const getRenderer = (
  textComponent: TextComponent = Text,
  renderer: AstRenderer | null,
  rules: RenderRules | null,
  style: MarkdownStyleMap | null,
  mergeStyle: boolean,
  onLinkPress: OnLinkPress | undefined,
  maxTopLevelChildren: number | null,
  topLevelMaxExceededItem: ReactNode,
  allowedImageHandlers: string[],
  defaultImageHandler: string | null,
  debugPrintTree: boolean,
): AstRenderer => {
  if (renderer && rules) {
    console.warn(
      'react-native-markdown-display you are using renderer and rules at the same time. This is not possible, props.rules is ignored',
    );
  }

  if (renderer && style) {
    console.warn(
      'react-native-markdown-display you are using renderer and style at the same time. This is not possible, props.style is ignored',
    );
  }

  if (renderer) {
    return renderer;
  }

  const useStyles = getStyle(mergeStyle, style);

  return new AstRenderer(
    {
      ...renderRules(textComponent),
      ...(rules ?? {}),
    },
    useStyles,
    onLinkPress,
    maxTopLevelChildren,
    topLevelMaxExceededItem,
    allowedImageHandlers,
    defaultImageHandler,
    debugPrintTree,
  );
};

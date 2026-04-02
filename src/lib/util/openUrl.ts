import {Linking} from 'react-native';

import type {OnLinkPress} from '../types';

export default function openUrl(
  url: string | undefined,
  customCallback?: OnLinkPress,
): void {
  if (!url) {
    return;
  }

  if (customCallback) {
    const result = customCallback(url);

    if (result === true) {
      Linking.openURL(url);
    }

    return;
  }

  Linking.openURL(url);
}

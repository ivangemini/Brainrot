import { GenericWebAdapter } from './generic-web-adapter';
import type { PlatformAdapter } from './platform-adapter';
import { shouldUseYandexAdapter, YandexAdapter } from './yandex-adapter';

export function createPlatformAdapter(): PlatformAdapter {
  return shouldUseYandexAdapter() ? new YandexAdapter() : new GenericWebAdapter();
}

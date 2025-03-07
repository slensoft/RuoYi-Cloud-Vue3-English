import store from '@/store'
import defaultSettings from '@/settings'
import useSettingsStore from '@/store/modules/settings'

/**
 * Dynamically modify title
 */
export function useDynamicTitle() {
  const settingsStore = useSettingsStore();
  if (settingsStore.dynamicTitle) {
    document.title = settingsStore.title + ' - ' + defaultSettings.title;
  } else {
    document.title = defaultSettings.title;
  }
}
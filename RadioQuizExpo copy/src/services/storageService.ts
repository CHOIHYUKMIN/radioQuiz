import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SELECTED_CHANNEL_IDS: '@radioquiz_selected_channel_ids',
};

export const getSelectedChannelIds = async (): Promise<string[] | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_CHANNEL_IDS);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Error loading selected channel IDs:', e);
    return null;
  }
};

export const saveSelectedChannelIds = async (ids: string[]): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(ids);
    await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_CHANNEL_IDS, jsonValue);
  } catch (e) {
    console.error('Error saving selected channel IDs:', e);
  }
};

export const clearSelectedChannelIds = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_CHANNEL_IDS);
  } catch (e) {
    console.error('Error clearing selected channel IDs:', e);
  }
};

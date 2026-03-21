import { Audio } from 'expo-av';

export interface Channel {
  id: string;
  name: string;
  frequency: string;
  streamUrl: string;
  color: string;
  logo: string;
}

let sound: Audio.Sound | null = null;
let currentChannel: Channel | null = null;
let currentIsPlaying = false;

type PlaybackStatusCallback = (isPlaying: boolean, currentChannel: Channel | null) => void;
let onPlaybackChange: PlaybackStatusCallback | null = null;

export const setRadioCallback = (cb: PlaybackStatusCallback) => {
  onPlaybackChange = cb;
};

export const getResolvedStreamUrl = async (channel: Channel): Promise<string> => {
  let url = channel.streamUrl;
  try {
    if (url.includes('cfpwwwapi.kbs.co.kr')) {
      const res = await fetch(url);
      const data = await res.json();
      url = data.channel_item[0].service_url;
    } else if (url.includes('sminiplay.imbc.com') || url.includes('apis.sbs.co.kr')) {
      const res = await fetch(url);
      url = await res.text();
    }
  } catch (err) {
    console.log('RadioService: URL fetch failed', err);
  }
  return url;
};

export const playChannel = async (channel: Channel): Promise<void> => {
  try {
    if (currentChannel?.id === channel.id && sound) {
      if (currentIsPlaying) {
        console.log(`RadioService: Pausing channel ${channel.name}`);
        await sound.pauseAsync();
      } else {
        console.log(`RadioService: Resuming channel ${channel.name}`);
        await sound.playAsync();
      }
      return;
    }
    
    if (sound) {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) await sound.unloadAsync();
      } catch (e) {
        console.log('RadioService: Unload failed or already unloaded');
      }
      sound = null;
    }
    
    currentIsPlaying = true;
    currentChannel = channel;
    if (onPlaybackChange) onPlaybackChange(true, channel);

    const url = await getResolvedStreamUrl(channel);

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: true }
    );
    
    newSound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded) {
        if (currentIsPlaying !== status.isPlaying) {
          currentIsPlaying = status.isPlaying;
          if (onPlaybackChange) onPlaybackChange(status.isPlaying, currentChannel);
        }
      }
    });

    sound = newSound;
  } catch (err) {
    console.error('RadioService Error playing channel:', err);
    currentIsPlaying = false;
    currentChannel = null;
    if (onPlaybackChange) onPlaybackChange(false, null);
  }
};

export const stopRadio = async () => {
  if (sound) {
    try { await sound.unloadAsync(); } catch (e) {}
    sound = null;
    currentIsPlaying = false;
    currentChannel = null;
    if (onPlaybackChange) onPlaybackChange(false, null);
  }
};

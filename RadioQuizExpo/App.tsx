import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import TrackPlayer, {
  State,
  Capability,
  usePlaybackState,
} from 'react-native-track-player';
import masterChannels from './src/data/masterChannels.json';
import { sendQuizAnswerSms } from './src/services/smsService';
import { getSelectedChannelIds, saveSelectedChannelIds } from './src/services/storageService';
import { initWhisperService, startLiveWhisper } from './src/services/whisperService';

interface Channel {
  id: string;
  name: string;
  frequency: string;
  streamUrl: string;
  color: string;
  logo: string;
}

const DEFAULT_CHANNELS = ['kbs_coolfm', 'mbc_fm4u', 'sbs_powerfm'];

const setupPlayer = async () => {
  try {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      alwaysPauseOnInterruption: true,
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.Stop,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
      ],
    });
  } catch (e) {
    console.log('Player setup error:', e);
  }
};

const App = () => {
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isWhisperReady, setIsWhisperReady] = useState(false);
  const [whisperProgress, setWhisperProgress] = useState(0);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const playbackState = usePlaybackState();
  const [sttStopFn, setSttStopFn] = useState<(() => void) | null>(null);
  const [quizDetected, setQuizDetected] = useState(false);
  const [subtitles, setSubtitles] = useState<string[]>(["시스템 대기 중..."]);

  // Channel Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      await setupPlayer();
      
      // Load saved channels
      const savedIds = await getSelectedChannelIds();
      if (isMounted) {
        setSelectedIds(savedIds || DEFAULT_CHANNELS);
        setIsPlayerReady(true);
      }

      // Initialize Whisper
      try {
        await initWhisperService((p) => setWhisperProgress(p));
        if (isMounted) setIsWhisperReady(true);
      } catch (err) {
        console.error('Whisper init failed:', err);
      }
    })();
    return () => {
      isMounted = false;
      if (sttStopFn) sttStopFn();
    };
  }, []);

  // Filtered channels based on selection
  const displayChannels = (masterChannels as Channel[]).filter(c => selectedIds.includes(c.id));

  // Handle Real STT based on playback state
  useEffect(() => {
    if (activeChannel && playbackState.state === State.Playing && isWhisperReady) {
      if (!sttStopFn) {
        setSubtitles((prev: string[]) => [...prev.slice(-9), `🔊 ${activeChannel.name} 소리 감지 중...`]);
        
        // Start live transcription
        (async () => {
          try {
            const stop = await startLiveWhisper((text: string) => {
              if (text.trim()) {
                setSubtitles((prev: string[]) => [...prev.slice(-9), text]);
                if (text.includes('퀴즈') || text.includes('정답')) {
                  setQuizDetected(true);
                  setTimeout(() => setQuizDetected(false), 15000);
                }
              }
            });
            setSttStopFn(() => stop);
          } catch (e) {
            console.error('STT activation error:', e);
          }
        })();
      }
    } else {
      if (sttStopFn) {
        sttStopFn();
        setSttStopFn(null);
        setSubtitles((prev: string[]) => [...prev.slice(-9), `📴 자동 자막 분석 일시정지`]);
        setQuizDetected(false);
      }
    }
  }, [activeChannel, playbackState.state, isWhisperReady]);

  const toggleChannelSelection = async (id: string) => {
    const newIds = selectedIds.includes(id)
      ? selectedIds.filter((selectedId: string) => selectedId !== id)
      : [...selectedIds, id];
    
    setSelectedIds(newIds);
    await saveSelectedChannelIds(newIds);
  };

  const handleSendQuizAnswer = () => {
    sendQuizAnswerSms('8910', '정답: 2번')
      .then(() => Alert.alert('성공', '정답 문자가 발송되었습니다! 🎉'))
      .catch(() => Alert.alert('실패', '발송 실패 😢'));
  };

  const playChannel = async (channel: Channel) => {
    try {
      if (activeChannel?.id === channel.id) {
        if (playbackState.state === State.Playing) {
          await TrackPlayer.pause();
        } else {
          await TrackPlayer.play();
        }
        return;
      }
      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: channel.id,
        url: channel.streamUrl,
        title: channel.name,
        artist: channel.frequency,
      });
      await TrackPlayer.play();
      setActiveChannel(channel);
      setSubtitles([`${channel.name} 스트림 연결됨.`, 'AI 자막 시스템 활성화 중...']);
    } catch (e) {
      console.log('Playback error:', e);
    }
  };

  const renderChannel = ({ item }: { item: Channel }) => {
    const isActive = activeChannel?.id === item.id;
    const isPlaying = isActive && playbackState.state === State.Playing;
    return (
      <TouchableOpacity
        style={[styles.channelCard, { borderLeftColor: item.color }, isActive && styles.channelCardActive]}
        onPress={() => playChannel(item)}
      >
        <View style={styles.channelInfo}>
          <Text style={styles.channelLogo}>{item.logo}</Text>
          <View>
            <Text style={styles.channelName}>{item.name}</Text>
            <Text style={styles.channelFrequency}>{item.frequency}</Text>
          </View>
        </View>
        <View style={styles.playButton}>
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (!isPlayerReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E63946" />
        <Text style={styles.loadingText}>시스템 초기화 중...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📻 라디오 AI 퀴즈 수집기</Text>
        <TouchableOpacity style={styles.manageButton} onPress={() => setIsModalVisible(true)}>
          <Text style={styles.manageButtonText}>채널 선택</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayChannels}
        keyExtractor={(item: Channel) => item.id}
        renderItem={renderChannel}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>선택된 채널이 없습니다.</Text>
            <TouchableOpacity style={styles.addFirstButton} onPress={() => setIsModalVisible(true)}>
              <Text style={styles.addFirstButtonText}>채널 추가하러 가기</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal visible={isModalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>방송국 목록</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Text style={styles.closeButton}>닫기</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={masterChannels as Channel[]}
            keyExtractor={(item: Channel) => item.id}
            renderItem={({ item }: { item: Channel }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => toggleChannelSelection(item.id)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, marginRight: 15 }}>{item.logo}</Text>
                  <View>
                    <Text style={styles.modalItemName}>{item.name}</Text>
                    <Text style={styles.modalItemFreq}>{item.frequency}</Text>
                  </View>
                </View>
                <View style={[styles.checkbox, selectedIds.includes(item.id) && styles.checkboxChecked]}>
                  {selectedIds.includes(item.id) && <Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>}
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ padding: 20 }}
          />
        </SafeAreaView>
      </Modal>

      {!isWhisperReady && (
        <View style={styles.whisperOverlay}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.whisperText}>
            AI 모델 다운로드 중... {Math.round(whisperProgress * 100)}%
          </Text>
        </View>
      )}

      <View style={styles.subtitleContainer}>
        <View style={styles.subtitleHeader}>
          <Text style={styles.subtitleTitle}>
            {activeChannel ? `${activeChannel.name} 라이브 분석` : '채널을 선택하세요'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {quizDetected && (
              <TouchableOpacity style={styles.quizButton} onPress={handleSendQuizAnswer}>
                <Text style={styles.quizButtonText}>정답 발송</Text>
              </TouchableOpacity>
            )}
            {activeChannel && playbackState.state === State.Playing && (
              <ActivityIndicator size="small" color="#2A9D8F" style={{ marginLeft: 10 }} />
            )}
          </View>
        </View>
        <ScrollView style={styles.subtitleScroll}>
          {subtitles.map((text: string, index: number) => (
            <Text key={index} style={[styles.subtitleText, index === subtitles.length - 1 && styles.subtitleTextLatest]}>
              {text}
            </Text>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#6C757D', fontSize: 16 },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#DEE2E6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#212529' },
  manageButton: { padding: 8, backgroundColor: '#F1F3F5', borderRadius: 8 },
  manageButtonText: { fontSize: 12, fontWeight: '600', color: '#495057' },
  listContent: { padding: 15 },
  channelCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  channelCardActive: { backgroundColor: '#F1F3F5', borderColor: '#ADB5BD', borderWidth: 1 },
  channelInfo: { flexDirection: 'row', alignItems: 'center' },
  channelLogo: { fontSize: 24, marginRight: 15 },
  channelName: { fontSize: 16, fontWeight: 'bold', color: '#343A40' },
  channelFrequency: { fontSize: 13, color: '#868E96', marginTop: 3 },
  playButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E9ECEF', justifyContent: 'center', alignItems: 'center' },
  playIcon: { fontSize: 16, color: '#495057' },
  subtitleContainer: { height: 250, backgroundColor: '#212529', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  subtitleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#495057' },
  subtitleTitle: { color: '#F8F9FA', fontSize: 16, fontWeight: '600' },
  subtitleScroll: { flex: 1 },
  subtitleText: { color: '#ADB5BD', fontSize: 15, marginBottom: 8, lineHeight: 22 },
  subtitleTextLatest: { color: '#F8F9FA', fontWeight: 'bold' },
  quizButton: { backgroundColor: '#E63946', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  quizButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  closeButton: { color: '#E63946', fontWeight: 'bold' },
  modalItem: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f8f9fa', alignItems: 'center', justifyContent: 'space-between' },
  modalItemName: { fontSize: 16, fontWeight: '600' },
  modalItemFreq: { fontSize: 12, color: '#868E96' },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#dee2e6', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#E63946', borderColor: '#E63946' },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#adb5bd', fontSize: 16, marginBottom: 20 },
  addFirstButton: { backgroundColor: '#E63946', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  addFirstButtonText: { color: '#fff', fontWeight: 'bold' },
  whisperOverlay: { backgroundColor: 'rgba(33, 37, 41, 0.9)', padding: 10, borderRadius: 10, margin: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  whisperText: { color: '#fff', fontSize: 12, marginLeft: 10 },
});

export default App;


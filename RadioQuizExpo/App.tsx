import React, { useState, useEffect, useRef } from 'react';
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
  PermissionsAndroid,
  Platform,
  SectionList,
} from 'react-native';

import masterChannels from './src/data/masterChannels.json';
import { sendQuizAnswerSms } from './src/services/smsService';
import { getSelectedChannelIds, saveSelectedChannelIds } from './src/services/storageService';

import { initSTTBridge, startSTT, isSTTReady } from './src/native/STTBridge';
import { playChannel as playRadio, stopRadio, setRadioCallback, Channel } from './src/services/RadioService';
import { SubtitleView } from './src/components/SubtitleView';
import { formatKoreanSubtitles } from './src/utils/textUtils';

const DEFAULT_CHANNELS = ['kbs_coolfm', 'mbc_fm4u', 'sbs_powerfm'];

const requestPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.SEND_SMS
      ];
      if (typeof Platform.Version === 'number' && Platform.Version >= 33) {
        permissions.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      }
      await PermissionsAndroid.requestMultiple(permissions);
    } catch (err) {
      console.warn('App: 권한 요청 에러', err);
    }
  }
};

const App = () => {
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [whisperProgress, setWhisperProgress] = useState<number>(0);
  const [isWhisperReadyState, setIsWhisperReadyState] = useState<boolean>(false);
  const [quizDetected, setQuizDetected] = useState<boolean>(false);

  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [isPlayingStore, setIsPlayingStore] = useState(false);

  const sttStopRef = useRef<(() => void) | null>(null);
  const [subtitles, setSubtitles] = useState<string[]>(["시스템 대기 중..."]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [sttRestartTrigger, setSttRestartTrigger] = useState(0);
  const isStartingSTTRef = useRef(false);

  useEffect(() => {
    return () => {
      stopRadio();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const setup = async () => {
      console.log('App: setup started');
      try {
        await requestPermissions();

        const savedIds = await getSelectedChannelIds();
        if (isMounted) {
          setSelectedIds(savedIds && savedIds.length > 0 ? savedIds : DEFAULT_CHANNELS);
        }

        console.log('App: initializing STT Bridge service...');
        await initSTTBridge((p) => setWhisperProgress(p));
        if (isMounted) {
          setIsWhisperReadyState(true);
          console.log('App: STT Bridge service ready!');
        }
      } catch (err) {
        console.error('App: init failed', err);
      }
      if (isMounted) {
        setIsPlayerReady(true);
        console.log('App: player ready!');
      }
    };
    setup();

    // Register Radio callbacks
    setRadioCallback((isPlaying: boolean, channel: Channel | null) => {
      if (isMounted) {
        setIsPlayingStore(isPlaying);
        if (channel) setActiveChannel(channel);
        if (isPlaying && channel) {
          setSubtitles((prev) => [`🔊 ${channel.name} 📡 연결 완료!`, ...prev.slice(0, 50)]);
        }
      }
    });

    return () => {
      isMounted = false;
      setRadioCallback(() => { });
    };
  }, []);

  useEffect(() => {
    const isServiceRunning = isSTTReady();
    const shouldRunSTT = isPlayingStore && isWhisperReadyState && isServiceRunning;

    if (shouldRunSTT) {
      if (!sttStopRef.current && !isStartingSTTRef.current) {
        console.log('App: Starting STT engine...');
        isStartingSTTRef.current = true;

        startSTT((text: string, isNewChunk: boolean) => {
          const cleanText = text.trim();
          if (cleanText) {
            const formattedText = formatKoreanSubtitles(cleanText);
            setSubtitles((prev) => {
              if (prev.length === 0) return [formattedText];
              if (isNewChunk) {
                return [...prev.slice(-50), formattedText];
              } else {
                return [...prev.slice(0, prev.length - 1), formattedText];
              }
            });
            if (cleanText.includes('정답') || cleanText.includes('퀴즈')) {
              setQuizDetected(true);
              setTimeout(() => setQuizDetected(false), 10000);
            }
          }
        }, () => {
          setTimeout(() => {
            if (sttStopRef.current) sttStopRef.current = null;
            setSttRestartTrigger(prev => prev + 1);
          }, 1000);
        }).then(stop => {
          sttStopRef.current = stop;
          isStartingSTTRef.current = false;
        }).catch(err => {
          console.error('App: STT start error', err);
          isStartingSTTRef.current = false;
        });
      }
    } else {
      if (sttStopRef.current || isStartingSTTRef.current) {
        console.log('App: Stopping STT engine...');
        if (sttStopRef.current) {
          sttStopRef.current();
          sttStopRef.current = null;
        }
        isStartingSTTRef.current = false;
        setQuizDetected(false);
      }
    }
  }, [isPlayingStore, isWhisperReadyState, sttRestartTrigger]);

  const displayChannels = (masterChannels as Channel[]).filter(c => selectedIds.includes(c.id));

  const sections = React.useMemo(() => {
    const groups: { [key: string]: Channel[] } = {};
    displayChannels.forEach(c => {
      const broadcaster = c.name.split(' ')[0];
      if (!groups[broadcaster]) groups[broadcaster] = [];
      groups[broadcaster].push(c);
    });
    return Object.entries(groups).map(([title, data]) => ({ title, data }));
  }, [displayChannels]);

  const toggleChannelSelection = async (id: string) => {
    const newIds = selectedIds.includes(id)
      ? selectedIds.filter((sid) => sid !== id)
      : [...selectedIds, id];
    setSelectedIds(newIds);
    await saveSelectedChannelIds(newIds);
  };

  const handleSendQuizAnswer = () => {
    sendQuizAnswerSms('8910', '정답: 2번')
      .then(() => Alert.alert('성공', '정답 문자가 발송되었습니다! 🎉'))
      .catch(() => Alert.alert('실패', '발송 실패 😢'));
  };

  const handlePlayChannel = async (channel: Channel) => {
    setSubtitles((prev) => [...prev.slice(-50), `🔊 ${channel.name} 📡 연결 중...`]);
    await playRadio(channel);
  };

  const renderChannel = ({ item }: { item: Channel }) => {
    const isActive = activeChannel?.id === item.id;
    const isPlaying = isActive && isPlayingStore;
    return (
      <TouchableOpacity
        style={[styles.channelCard, { borderLeftColor: item.color }, isActive && styles.channelCardActive]}
        onPress={() => handlePlayChannel(item)}
      >
        <View style={styles.channelInfo}>
          <Text style={styles.channelLogo}>{item.logo}</Text>
          <View style={styles.channelTextCol}>
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

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  if (!isPlayerReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E63946" />
        <Text style={styles.loadingText}>초기화 중... {Math.round(whisperProgress * 100)}%</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📻 라디오 AI 퀴즈 수집기</Text>
        <TouchableOpacity style={styles.manageButton} onPress={() => setIsModalVisible(true)}>
          <Text style={styles.manageButtonText}>채널 선택</Text>
        </TouchableOpacity>
      </View>

      {/* Main Body (Horizontal Layout) */}
      <View style={styles.mainBody}>

        {/* Left Side: Channel List */}
        <View style={styles.leftColumn}>
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={renderSectionHeader ? renderChannel : () => null}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<Text style={styles.emptyText}>채널을 선택해 주세요.</Text>}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
          />
        </View>

        {/* Right Side: Subtitle Panel */}
        <View style={styles.rightColumn}>
          <View style={styles.subtitleHeader}>
            <Text style={styles.subtitleTitle} numberOfLines={1}>
              {activeChannel ? activeChannel.name : '대기중 (마이크 켜기 가능)'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {quizDetected && (
                <TouchableOpacity style={styles.quizButton} onPress={handleSendQuizAnswer}>
                  <Text style={styles.quizButtonText}>정답 발송</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* SubtitleView 모듈화 적용 */}
          <SubtitleView subtitles={subtitles} />
        </View>
      </View>

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
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => toggleChannelSelection(item.id)}
              >
                <Text style={styles.modalItemText}>
                  {item.logo} {item.name}
                </Text>
                {selectedIds.includes(item.id) && (
                  <Text style={styles.checkIcon}>✅</Text>
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A1A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1A1A' },
  loadingText: { marginTop: 15, fontSize: 16, color: '#A0A0A0' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#242424', borderBottomWidth: 1, borderBottomColor: '#333' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  manageButton: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#333', borderRadius: 8 },
  manageButtonText: { color: '#E0E0E0', fontSize: 14, fontWeight: '600' },
  mainBody: { flex: 1, flexDirection: 'row' },
  leftColumn: { width: 320, backgroundColor: '#1E1E1E', borderRightWidth: 1, borderRightColor: '#333' },
  listContent: { padding: 15 },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 20 },
  sectionHeader: { backgroundColor: '#2A2A2A', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4, marginBottom: 8, marginTop: 10 },
  sectionHeaderText: { color: '#AAA', fontSize: 13, fontWeight: 'bold' },
  channelCard: { backgroundColor: '#2A2A2A', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  channelCardActive: { backgroundColor: '#3A3A3A', elevation: 5, transform: [{ scale: 1.02 }] },
  channelInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  channelLogo: { fontSize: 32, marginRight: 15 },
  channelTextCol: { flex: 1 },
  channelName: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  channelFrequency: { fontSize: 14, color: '#A0A0A0' },
  playButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  playIcon: { fontSize: 16, color: '#FFFFFF' },
  rightColumn: { flex: 1, backgroundColor: '#121212', margin: 15, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#333' },
  subtitleHeader: { padding: 20, backgroundColor: '#1E1E1E', borderBottomWidth: 1, borderBottomColor: '#333', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subtitleTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', flex: 1, marginRight: 15 },
  quizButton: { backgroundColor: '#E63946', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, marginLeft: 10 },
  quizButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  modalContainer: { flex: 1, backgroundColor: '#1A1A1A' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#242424', borderBottomWidth: 1, borderBottomColor: '#333' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  closeButton: { fontSize: 16, color: '#E0E0E0', padding: 10 },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  modalItemText: { fontSize: 18, color: '#FFFFFF' },
  checkIcon: { fontSize: 20 },
  separator: { height: 1, backgroundColor: '#333' },
});

export default App;

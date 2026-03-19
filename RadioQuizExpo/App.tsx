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
} from 'react-native';
import TrackPlayer, {
  State,
  Capability,
  usePlaybackState,
} from 'react-native-track-player';
import channelsData from './src/data/channels.json';
import { startSTTSimulation } from './src/services/sttSimulator';
import { sendQuizAnswerSms } from './src/services/smsService';

interface Channel {
  id: string;
  name: string;
  frequency: string;
  streamUrl: string;
  color: string;
  logo: string;
}

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
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const playbackState = usePlaybackState();
  const [sttStopFn, setSttStopFn] = useState<(() => void) | null>(null);
  const [quizDetected, setQuizDetected] = useState(false);

  // Mock state for subtitles preview
  const [subtitles, setSubtitles] = useState([
    "라디오 스트림에 연결 중...",
  ]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      await setupPlayer();
      if (isMounted) setIsPlayerReady(true);
    })();
    return () => {
      isMounted = false;
      if (sttStopFn) sttStopFn();
    };
  }, []);

  // Handle STT simulation based on playback state
  useEffect(() => {
    if (activeChannel && playbackState.state === State.Playing) {
      if (!sttStopFn) {
        setSubtitles(prev => [...prev.slice(-9), `${activeChannel.name} 실시간 자막 분석 시작...`]);
        const stop = startSTTSimulation(activeChannel.name, (text) => {
          setSubtitles(prev => [...prev.slice(-9), text]); // Keep last 9 lines
          
          // Simple rule-based quiz detection
          if (text.includes('퀴즈') || text.includes('정답')) {
            setQuizDetected(true);
            setTimeout(() => setQuizDetected(false), 15000); // Hide button after 15s
          }
        });
        setSttStopFn(() => stop);
      }
    } else {
      if (sttStopFn) {
        sttStopFn();
        setSttStopFn(null);
        setSubtitles(prev => [...prev.slice(-9), `[시스템] 자막 분석 일시정지`]);
        setQuizDetected(false);
      }
    }
  }, [activeChannel, playbackState.state]);

  const handleSendQuizAnswer = () => {
    // In real app, Gemini extracts answer and target number from STT context
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
      setSubtitles([`${channel.name} 스트림 연결됨.`, '자막 시스템 대기 중...']);
    } catch (e) {
      console.log('Playback error:', e);
    }
  };

  const renderChannel = ({ item }: { item: Channel }) => {
    const isActive = activeChannel?.id === item.id;
    const isPlaying = isActive && playbackState.state === State.Playing;

    return (
      <TouchableOpacity
        style={[
          styles.channelCard,
          { borderLeftColor: item.color },
          isActive && styles.channelCardActive,
        ]}
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
        <Text style={styles.loadingText}>오디오 시스템 초기화 중...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📻 라디오 퀴즈 수집기</Text>
      </View>

      <View style={styles.channelListContainer}>
        <FlatList
          data={channelsData}
          keyExtractor={(item) => item.id}
          renderItem={renderChannel}
          contentContainerStyle={styles.listContent}
        />
      </View>

      <View style={styles.subtitleContainer}>
        <View style={styles.subtitleHeader}>
          <Text style={styles.subtitleTitle}>
            {activeChannel ? `${activeChannel.name} 실시간 자막` : '채널을 선택하세요'}
          </Text>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            {quizDetected && (
              <TouchableOpacity style={styles.quizButton} onPress={handleSendQuizAnswer}>
                <Text style={styles.quizButtonText}>정답 발송</Text>
              </TouchableOpacity>
            )}
            {activeChannel && playbackState.state === State.Playing && (
              <ActivityIndicator size="small" color="#2A9D8F" style={{marginLeft: 10}} />
            )}
          </View>
        </View>
        <ScrollView style={styles.subtitleScroll}>
          {subtitles.map((text, index) => (
            <Text
              key={index}
              style={[
                styles.subtitleText,
                index === subtitles.length - 1 && styles.subtitleTextLatest
              ]}
            >
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
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#212529' },
  channelListContainer: { flex: 1 },
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
  channelCardActive: {
    backgroundColor: '#F1F3F5',
    borderColor: '#ADB5BD',
    borderWidth: 1,
  },
  channelInfo: { flexDirection: 'row', alignItems: 'center' },
  channelLogo: { fontSize: 24, marginRight: 15 },
  channelName: { fontSize: 16, fontWeight: 'bold', color: '#343A40' },
  channelFrequency: { fontSize: 13, color: '#868E96', marginTop: 3 },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: { fontSize: 16, color: '#495057' },
  subtitleContainer: {
    height: 250,
    backgroundColor: '#212529',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  subtitleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#495057',
  },
  subtitleTitle: { color: '#F8F9FA', fontSize: 16, fontWeight: '600' },
  subtitleScroll: { flex: 1 },
  subtitleText: { color: '#ADB5BD', fontSize: 15, marginBottom: 8, lineHeight: 22 },
  subtitleTextLatest: { color: '#F8F9FA', fontWeight: 'bold' },
  quizButton: {
    backgroundColor: '#E63946',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  quizButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});

export default App;

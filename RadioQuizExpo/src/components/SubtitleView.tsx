import React, { useRef } from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';

interface SubtitleViewProps {
  subtitles: string[];
  isPiP?: boolean;
}

export const SubtitleView: React.FC<SubtitleViewProps> = ({ subtitles, isPiP = false }) => {
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <ScrollView 
      style={styles.subtitleScroll} 
      contentContainerStyle={{ paddingBottom: 60 }}
      automaticallyAdjustContentInsets={false}
      ref={scrollViewRef}
      onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
    >
      {subtitles.map((text, idx) => (
        <Text 
          key={idx} 
          style={[
            isPiP ? styles.subtitleTextPiP : styles.subtitleText, 
            idx === subtitles.length - 1 && (isPiP ? styles.subtitleTextLatestPiP : styles.subtitleTextLatest)
          ]}
        >
          {text}
        </Text>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  subtitleScroll: {
    flex: 1,
    padding: 15,
  },
  subtitleText: {
    fontSize: 18,
    color: '#E0E0E0',
    lineHeight: 28,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  subtitleTextLatest: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  subtitleTextPiP: {
    fontSize: 22,
    color: '#E0E0E0',
    lineHeight: 32,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  subtitleTextLatestPiP: {
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: '900',
    textShadowColor: '#E63946',
    textShadowRadius: 8,
  },
});

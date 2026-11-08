import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import YoutubePlayer from 'react-native-youtube-iframe';

interface ClickToLoadYouTubePlayerProps {
  videoId: string;
  thumbnailUrl: string;
  title: string;
  isLive?: boolean;
  height?: number;
}

export const ClickToLoadYouTubePlayer: React.FC<ClickToLoadYouTubePlayerProps> = ({
  videoId,
  thumbnailUrl,
  title,
  isLive = false,
  height = 210,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingPlayer, setLoadingPlayer] = useState(false);

  const handleOpenOnYouTube = () => {
    const url = isLive
      ? `https://www.youtube.com/live/${videoId}`
      : `https://www.youtube.com/watch?v=${videoId}`;
    Linking.openURL(url).catch((err) => {
      console.warn('Failed to open YouTube URL:', err);
    });
  };

  const handleTapToLoad = () => {
    setLoadingPlayer(true);
    setIsLoaded(true);
  };

  return (
    <View style={styles.container}>
      {!isLoaded ? (
        // Click-to-Load Thumbnail with Play Button Overlay
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleTapToLoad}
          style={[styles.thumbnailWrapper, { height }]}
          accessibilityRole="button"
          accessibilityLabel={`Play video: ${title}`}
          accessibilityHint="Loads official YouTube stream player"
        >
          <Image
            source={{ uri: thumbnailUrl || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` }}
            style={styles.thumbnail}
            contentFit="cover"
            transition={300}
          />
          <View style={styles.overlay} />

          {/* Live Indicator Banner */}
          {isLive && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>LIVE STREAM</Text>
            </View>
          )}

          {/* Large Center Play Icon */}
          <View style={styles.playButton}>
            <Text style={styles.playIconText}>▶</Text>
          </View>

          {/* Tap to load callout */}
          <View style={styles.tapCallout}>
            <Text style={styles.tapCalloutText}>Tap to play video</Text>
          </View>
        </TouchableOpacity>
      ) : (
        // Embedded Native YouTube Player
        <View style={[styles.playerWrapper, { height }]}>
          <YoutubePlayer
            height={height}
            play={true}
            videoId={videoId}
            onReady={() => setLoadingPlayer(false)}
          />
          {loadingPlayer && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color="#0F52BA" size="small" />
            </View>
          )}
        </View>
      )}

      {/* Fallback button: Open on YouTube */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          onPress={handleOpenOnYouTube}
          style={styles.openYouTubeBtn}
          accessibilityRole="link"
          accessibilityLabel="Open on YouTube"
        >
          <Text style={styles.youtubeBrandText}>▶ YouTube</Text>
          <Text style={styles.openYouTubeText}>Open on YouTube</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  thumbnailWrapper: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#000000',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  liveBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  playButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 6,
  },
  playIconText: {
    color: '#DC2626',
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  tapCallout: {
    position: 'absolute',
    bottom: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tapCalloutText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '600',
  },
  playerWrapper: {
    width: '100%',
    backgroundColor: '#000000',
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#1E293B',
  },
  openYouTubeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: '#334155',
    minHeight: 32,
  },
  youtubeBrandText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
  openYouTubeText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '600',
  },
});


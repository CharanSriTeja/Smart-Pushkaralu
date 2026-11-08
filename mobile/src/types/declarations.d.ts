declare module 'react-native-youtube-iframe' {
  import React from 'react';
  export interface YoutubePlayerProps {
    height: number;
    play?: boolean;
    videoId: string;
    onReady?: () => void;
    onChangeState?: (state: string) => void;
  }
  const YoutubePlayer: React.FC<YoutubePlayerProps>;
  export default YoutubePlayer;
}


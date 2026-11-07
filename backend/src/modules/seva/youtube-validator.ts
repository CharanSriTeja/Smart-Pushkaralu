/**
 * YouTube URL Parser and Validator for Module 10 (Virtual Seva)
 * 
 * Strict server-side validation extracting video ID from:
 * 1. youtu.be/<id>
 * 2. youtube.com/watch?v=<id>
 * 3. youtube.com/live/<id>
 * 
 * Rejects all other domains, channels, playlists, or malformed IDs.
 */

export interface ParsedYouTubeInfo {
  videoId: string;
  sourceFormat: 'youtu.be' | 'watch' | 'live';
  canonicalUrl: string;
  thumbnailUrl: string;
  embedUrl: string;
}

// YouTube video IDs are strictly 11 characters containing alphanumeric, underscore, or hyphen
const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export function extractYouTubeVideoId(inputUrl: string): ParsedYouTubeInfo | null {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return null;
  }

  const trimmed = inputUrl.trim();
  if (!trimmed) {
    return null;
  }

  // Prepend protocol if user pasted bare domain (e.g., 'youtube.com/watch?v=...')
  const urlWithProtocol = /^[a-zA-Z]+:\/\//.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(urlWithProtocol);
  } catch {
    return null;
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');

  let videoId: string | null = null;
  let sourceFormat: 'youtu.be' | 'watch' | 'live' | null = null;

  // 1. youtu.be/<id>
  if (hostname === 'youtu.be') {
    const pathname = parsed.pathname.replace(/^\/+/, '');
    const firstSegment = pathname.split('/')[0];
    if (firstSegment && YOUTUBE_ID_REGEX.test(firstSegment)) {
      videoId = firstSegment;
      sourceFormat = 'youtu.be';
    }
  } 
  // 2. youtube.com/watch?v=<id>
  else if (hostname === 'youtube.com') {
    if (parsed.pathname === '/watch' || parsed.pathname === '/watch/') {
      const v = parsed.searchParams.get('v');
      if (v && YOUTUBE_ID_REGEX.test(v)) {
        videoId = v;
        sourceFormat = 'watch';
      }
    } 
    // 3. youtube.com/live/<id>
    else if (parsed.pathname.startsWith('/live/')) {
      const liveSegment = parsed.pathname.replace(/^\/live\//, '').split('/')[0];
      if (liveSegment && YOUTUBE_ID_REGEX.test(liveSegment)) {
        videoId = liveSegment;
        sourceFormat = 'live';
      }
    }
  }

  if (!videoId || !sourceFormat) {
    return null;
  }

  return {
    videoId,
    sourceFormat,
    canonicalUrl: sourceFormat === 'live'
      ? `https://www.youtube.com/live/${videoId}`
      : `https://www.youtube.com/watch?v=${videoId}`,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
  };
}

export function validateYouTubeUrl(url: string): { isValid: boolean; videoId?: string; error?: string } {
  const result = extractYouTubeVideoId(url);
  if (!result) {
    return {
      isValid: false,
      error: 'Invalid YouTube URL. Only valid youtu.be, youtube.com/watch?v=, and youtube.com/live/ links are accepted.',
    };
  }
  return {
    isValid: true,
    videoId: result.videoId,
  };
}


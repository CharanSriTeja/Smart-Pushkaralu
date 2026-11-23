import { Platform } from 'react-native';
type SafeRouter = {
  canGoBack: () => boolean;
  back: () => void;
  replace: (href: any) => void;
};

export function safeGoBack(router: SafeRouter, fallback: string = '/') {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.href = fallback;
    return;
  }

  router.replace(fallback as any);
}

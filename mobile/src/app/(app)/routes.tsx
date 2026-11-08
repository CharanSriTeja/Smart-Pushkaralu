import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { RoutePlannerScreen } from '../../screens/RoutePlannerScreen';

export default function RoutesPage() {
  const router = useRouter();
  const params = useLocalSearchParams();

  let initialGhat: any = undefined;
  if (params.ghatId) {
    let ghatName = params.ghatName as string;
    try {
      if (ghatName && ghatName.includes('%')) {
        ghatName = decodeURIComponent(ghatName);
      }
    } catch {}

    const lat = params.lat ? parseFloat(params.lat as string) : undefined;
    const lng = params.lng ? parseFloat(params.lng as string) : undefined;

    initialGhat = {
      id: params.ghatId as string,
      name: ghatName || 'Destination Ghat',
      lat: lat && !isNaN(lat) ? lat : undefined,
      lng: lng && !isNaN(lng) ? lng : undefined,
    };
  }

  return (
    <RoutePlannerScreen
      initialGhat={initialGhat}
      onBack={() => router.back()}
    />
  );
}


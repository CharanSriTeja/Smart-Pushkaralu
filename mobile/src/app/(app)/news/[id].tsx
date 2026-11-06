import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { NewsDetailScreen } from '../../../screens/NewsDetailScreen';

export default function NewsDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <NewsDetailScreen id={id as string} />;
}


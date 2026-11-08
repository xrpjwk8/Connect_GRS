import React, { useEffect, useState } from 'react';
import { AppState, Image, StyleSheet, View, type ImageStyle, type StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storePhotoUrl } from '../services/storePhotos';

export default function StorePhoto({ path, style }: { path?: string | null; style?: StyleProp<ImageStyle> }) {
  const [image, setImage] = useState<{ path: string; uri: string } | null>(null);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      if (!path) return;
      try { const uri = await storePhotoUrl(path); if (active) setImage(uri ? { path, uri } : null); }
      catch { if (active) setImage(null); }
    };
    void refresh();
    const timer = setInterval(() => { void refresh(); }, 240000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => { active = false; clearInterval(timer); subscription.remove(); };
  }, [path]);
  return <View style={[styles.placeholder, style]}>
    <Ionicons name="storefront-outline" size={36} color="#aaa" />
    {image && image.path === path && <Image accessibilityLabel="매장 소개 사진" source={{ uri: image.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setImage(null)} />}
  </View>;
}
const styles = StyleSheet.create({ placeholder: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee' } });

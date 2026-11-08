import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import type { Database } from '../models/database.types';
import { developmentPreview } from './developmentPreview';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const supabaseConfigured = Boolean(url && key?.startsWith('sb_publishable_'));
// Keep a missing configuration on a recoverable setup screen, never a mock login.
export const supabase = createClient<Database>(url || 'https://unconfigured.supabase.co', key || 'unconfigured', {
  global: { fetch: developmentPreview.wrapFetch((input, init) => fetch(input, init)) },
  auth: {
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage, lock: processLock } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

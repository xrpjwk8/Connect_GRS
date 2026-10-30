import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../models/database.types';
import type { SearchFilter } from '../models/types';
import { mapStore, serviceDate, timeMinute } from '../utils/reservation';

export function createBackend(supabase: SupabaseClient<Database>) {
type Functions = Database['public']['Functions'];
async function rpc<N extends keyof Functions>(name: N, args: Functions[N]['Args']) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  // Supabase's generic overload cannot retain the relation between N and Args here.
  return data as unknown as Functions[N]['Returns'];
}
async function searchStores(filter: SearchFilter | null) {
  const rows = await rpc('search_stores', {
    p_region: filter?.region && filter.region !== '전체' ? filter.region : undefined,
    p_service_date: filter ? serviceDate(filter.date) : undefined,
    p_start_minute: filter?.time && filter.time !== '상관없음' ? timeMinute(filter.time) : undefined,
    p_people: filter?.people ?? 1,
  });
  return rows.map(mapStore);
}
  return { rpc, searchStores };
}

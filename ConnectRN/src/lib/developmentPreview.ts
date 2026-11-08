import type { StoreRow } from '../utils/reservation';

export const previewStore: StoreRow = {
  id: 'preview-store', owner_id: 'preview-owner', name: '테스트 매장 · 캠퍼스 포차',
  region: '신촌', category: '술집', capacity: 45, opening_minute: 1020, closing_minute: 1470,
  allow_shared: true, approved: false, description: '화면 확인용 예시 매장입니다. 실제 예약은 전송되지 않습니다.', created_at: '',
};
export const previewRestriction = '테스트 미리보기에서는 실제 예약·채팅·서버 저장을 사용할 수 없습니다.';

// A separate local mode: never manufacture a Supabase session or verified profile.
export function createPreviewBoundary(development: boolean) {
  let active = false;
  return {
    get active() { return development && active; },
    enter() {
      if (!development) throw new Error('테스트 진입은 개발 빌드에서만 가능합니다.');
      active = true;
    },
    exit() { active = false; },
    wrapFetch(network: typeof fetch): typeof fetch {
      return async (input, init) => {
        if (!development || !active) return network(input, init);
        const path = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url).pathname;
        const method = (init?.method ?? (typeof input === 'object' && 'method' in input ? input.method : 'GET')).toUpperCase();
        let data: unknown;
        if (method === 'POST' && path === '/rest/v1/rpc/search_stores') {
          const args = JSON.parse(String(init?.body ?? '{}'));
          data = (!args.p_region || args.p_region === previewStore.region) && (args.p_people ?? 1) <= previewStore.capacity ? [previewStore] : [];
        } else if (method === 'POST' && path === '/rest/v1/rpc/get_availability') {
          data = Array.from({ length: 15 }, (_, i) => ({ start_minute: 1020 + i * 30, remaining_seats: 45, blocked: false }));
        } else {
          // Includes Auth, direct table writes, Storage, and newly added RPCs.
          throw new Error(previewRestriction);
        }
        return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
      };
    },
  };
}

export const developmentPreview = createPreviewBoundary(__DEV__);

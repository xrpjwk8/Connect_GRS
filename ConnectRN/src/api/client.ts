import { Platform } from 'react-native';

// 시뮬레이터/에뮬레이터에서 macOS 호스트로 붙는 기본값.
// Android 에뮬레이터는 10.0.2.2가 호스트 loopback, iOS 시뮬레이터/웹은 localhost 그대로 사용 가능.
// 실기기 테스트 시엔 EXPO_PUBLIC_API_BASE_URL로 macOS의 LAN IP를 지정해서 실행하세요.
const DEFAULT_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function buildQuery(query?: Record<string, string | number | undefined | null>): string {
  if (!query) return '';
  const entries = Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (entries.length === 0) return '';
  const params = new URLSearchParams(entries.map(([k, v]) => [k, String(v)]));
  return `?${params.toString()}`;
}

async function request<Response>(
  path: string,
  options: { method?: string; body?: unknown; query?: Record<string, string | number | undefined | null> } = {}
): Promise<Response> {
  const { method = 'GET', body, query } = options;
  const res = await fetch(`${API_BASE_URL}${path}${buildQuery(query)}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      message = data?.message ?? message;
    } catch {
      // 응답 본문이 JSON이 아닌 경우 statusText 그대로 사용
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) {
    return undefined as Response;
  }
  return (await res.json()) as Response;
}

export const apiClient = {
  get: <Response>(path: string, query?: Record<string, string | number | undefined | null>) =>
    request<Response>(path, { method: 'GET', query }),
  post: <Response>(path: string, body?: unknown) => request<Response>(path, { method: 'POST', body }),
  patch: <Response>(path: string, body?: unknown) => request<Response>(path, { method: 'PATCH', body }),
  put: <Response>(path: string, body?: unknown) => request<Response>(path, { method: 'PUT', body }),
  delete: <Response>(path: string) => request<Response>(path, { method: 'DELETE' }),
};

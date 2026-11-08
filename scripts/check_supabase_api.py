#!/usr/bin/env python3
"""Check the hosted public API using only the app's publishable key.

Read-only requests plus forbidden RPC probes; never creates users or sends email.
Run from any directory. No secret/service-role credentials are accepted.
"""
import json
from pathlib import Path
import urllib.error
import urllib.parse
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parents[1]


def main():
    values = {}
    for line in (ROOT / 'ConnectRN/.env.local').read_text().splitlines():
        if line.strip() and not line.lstrip().startswith('#'):
            name, value = line.split('=', 1)
            values[name.strip()] = value.strip()
    base = values['EXPO_PUBLIC_SUPABASE_URL'].rstrip('/')
    key = values['EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY']
    if not key.startswith('sb_publishable_'):
        raise ValueError('Only a publishable key is allowed')
    if urllib.parse.urlparse(base).scheme != 'https':
        raise ValueError('HTTPS is required for the hosted API')

    def request(path, payload=None, extra_headers=None):
        headers = {'apikey': key, 'Content-Type': 'application/json'}
        headers.update(extra_headers or {})
        req = urllib.request.Request(base + path, headers=headers,
                                     data=None if payload is None else json.dumps(payload).encode())
        try:
            with urllib.request.urlopen(req, timeout=20) as response:
                return response.status, json.load(response)
        except urllib.error.HTTPError as error:
            return error.code, json.load(error)

    def expect(label, response, status, shape=None, code=None):
        actual, data = response
        if actual != status or (shape and not isinstance(data, shape)) or (code and data.get('code') != code):
            raise AssertionError(f'{label}: expected HTTP {status}/{code}, got HTTP {actual}')
        print(f'PASS {label} (HTTP {actual})')

    expect('approved stores can be read', request('/rest/v1/stores?select=id&limit=1'), 200, list)
    expect('public search RPC works', request('/rest/v1/rpc/search_stores', {}), 200, list)
    expect('reservation data is private', request('/rest/v1/reservations?select=id&limit=1'), 401, code='42501')
    expect('profile data is private', request('/rest/v1/profiles?select=id&limit=1'), 401, code='42501')
    expect('profile registration requires login', request('/rest/v1/rpc/complete_profile',
           {'p_role': 'owner', 'p_real_name': 'unauthenticated probe'}), 401, code='42501')
    expect('store approval requires login', request('/rest/v1/rpc/approve_store',
           {'p_store_id': str(uuid.uuid4()), 'p_approved': True}), 401, code='42501')
    expect('private schema is not exposed', request('/rest/v1/admin_users?select=user_id',
           extra_headers={'Accept-Profile': 'private'}), 406, code='PGRST106')
    expect('Auth settings endpoint works', request('/auth/v1/settings'), 200, dict)
    expect('student applications are private', request('/rest/v1/student_verifications?select=user_id&limit=1'), 401, code='42501')
    expect('student review requires login', request('/rest/v1/rpc/review_student_verification',
           {'p_user_id': str(uuid.uuid4()), 'p_request_id': str(uuid.uuid4()), 'p_approve': True}), 401, code='42501')
    expect('admin invitation requires login', request('/rest/v1/rpc/accept_admin_invitation', {}), 401, code='42501')
    expect('store photo path is exposed', request('/rest/v1/stores?select=id,photo_path&limit=1'), 200, list)
    expect('store photo mutation requires login', request('/rest/v1/rpc/set_store_photo',
           {'p_store_id': str(uuid.uuid4()), 'p_path': None}), 401, code='42501')
    expect('chat history requires login', request('/rest/v1/chat_messages?select=id&limit=1'), 401, code='42501')
    expect('notification inbox requires login', request('/rest/v1/notifications?select=id&limit=1'), 401, code='42501')
    expect('chat sending requires login', request('/rest/v1/rpc/send_chat_message',
           {'p_reservation_id': str(uuid.uuid4()), 'p_body': 'forbidden probe', 'p_request_id': str(uuid.uuid4())}), 401, code='42501')
    expect('device registration requires login', request('/rest/v1/rpc/register_push_device',
           {'p_device_id': str(uuid.uuid4()), 'p_token': 'ExpoPushToken[forbiddenProbe000]', 'p_platform': 'ios'}), 401, code='42501')
    expect('notification read requires login', request('/rest/v1/rpc/mark_notification_read', {'p_id': str(uuid.uuid4())}), 401, code='42501')
    expect('transfer history requires login', request('/rest/v1/reservation_transfers?select=id&limit=1'), 401, code='42501')
    expect('transfer board requires login', request('/rest/v1/rpc/list_transfers', {}), 401, code='42501')
    expect('transfer creation requires login', request('/rest/v1/rpc/create_transfer',
           {'p_reservation_id': str(uuid.uuid4()), 'p_terms': 'forbidden probe', 'p_no_deposit': True}), 401, code='42501')
    expect('transfer claim requires login', request('/rest/v1/rpc/claim_transfer',
           {'p_id': str(uuid.uuid4()), 'p_request_id': str(uuid.uuid4()), 'p_accept_terms': True}), 401, code='42501')
    expect('versioned chat requires login', request('/rest/v1/rpc/send_chat_message_epoch',
           {'p_reservation_id': str(uuid.uuid4()), 'p_body': 'forbidden probe', 'p_request_id': str(uuid.uuid4()), 'p_epoch': 1}), 401, code='42501')
    print('23 hosted API checks passed; authenticated JWT/OTP flows require separate testing.')


if __name__ == '__main__':
    main()

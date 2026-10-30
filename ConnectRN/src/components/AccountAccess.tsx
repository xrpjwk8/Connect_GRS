import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppState, useTypography } from '../state/AppState';
import type { UserRole } from '../models/types';
import { supabase } from '../lib/supabase';
import { rpc, errorMessage } from '../services/backend';
import { AppTextField, FormLabel } from './CommonComponents';
import { LimeButton, GhostButton } from './Buttons';
import AgreementSection from './AgreementSection';
import { AppColors } from '../theme/colors';

export default function AccountAccess({ role, signup = false }: { role: UserRole; signup?: boolean }) {
  const { session, cancelSignUp, refresh, logout, enterPreview } = useAppState();
  const [useEmailAuth, setUseEmailAuth] = useState(!__DEV__ || !signup);
  const previewSignup = __DEV__ && signup && !useEmailAuth;
  const T = useTypography(role);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState('');
  const normalized = email.trim().toLowerCase();
  const emailValid = role === 'booker' ? /^[^@\s]+@[^@\s]+\.ac\.kr$/.test(normalized) : /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  async function run(action: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError('');
    try { await action(); } catch (e) { setError(errorMessage(e)); }
    finally { busyRef.current = false; setBusy(false); }
  }
  const requestCode = () => run(async () => {
    if (!emailValid) throw new Error(role === 'booker' ? '.ac.kr 학교 이메일을 입력해주세요.' : '이메일 주소를 확인해주세요.');
    const { error } = await supabase.auth.signInWithOtp({ email: normalized, options: { shouldCreateUser: signup } });
    if (error) throw error;
    setSentTo(normalized); setCode(''); setCooldown(60);
  });
  const verify = () => run(async () => {
    if (normalized !== sentTo || !/^\d{6,10}$/.test(code)) throw new Error('메일로 받은 인증번호를 입력해주세요.');
    const { error } = await supabase.auth.verifyOtp({ email: sentTo, token: code, type: 'email' });
    if (error) throw error;
    // Auth state listener loads the server profile; local form values never grant access.
  });
  const complete = () => run(async () => {
    if (!agreed || !name.trim() || (role === 'booker' && !school.trim())) throw new Error('기본 정보와 필수 약관을 확인해주세요.');
    await rpc('complete_profile', { p_role: role, p_real_name: name.trim(), p_school_name: school.trim(),
      p_department_name: department.trim(), p_position: position.trim() });
    await refresh();
  });
  const field = (label: string, value: string, change: (value: string) => void) => (
    <View style={{ gap: 8 }}><FormLabel title={label} appRole={role} />
      <AppTextField value={value} onChangeText={change} editable={!busy} appRole={role} /></View>
  );
  const emailField = <View style={{ gap: 8 }}><FormLabel title={role === 'booker' ? (previewSignup ? '이메일 (학교 메일 권장)' : '학교 이메일') : '이메일'} appRole={role} />
    <AppTextField appRole={role} value={email} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" editable={!busy}
      placeholder={role === 'booker' ? 'name@university.ac.kr' : 'name@example.com'}
      onChangeText={v => { setEmail(v); setSentTo(''); setCode(''); }} />
  </View>;
  return <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.surface }}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 22, gap: 22 }} keyboardShouldPersistTaps="handled">
        <GhostButton title="뒤로" appRole={role} onPress={cancelSignUp} disabled={busy} />
        <Text style={[T.headlineLG, { color: AppColors.ink }]}>{role === 'booker' ? '예약자' : '점주'} {signup ? '회원가입' : '로그인'}</Text>
        {(signup || session) && <>
          <Text style={T.bodyLG}>기본 정보</Text>
          {field('이름', name, setName)}
          {role === 'booker' && <>{field('학교명', school, setSchool)}{field('학과 / 단체명', department, setDepartment)}{field('직책', position, setPosition)}</>}
          {!session && emailField}
        </>}
        {previewSignup ? <>
          <Text style={T.bodyLG}>출시 전 테스트: 정보 입력과 약관 동의 없이도 앱을 둘러볼 수 있습니다. 실제 계정은 생성되지 않습니다.</Text>
          <AgreementSection onRequiredAgreedChange={setAgreed} appRole={role} />
          <LimeButton title="가입 완료하기" appRole={role} disabled={busy}
            onPress={() => enterPreview(role, { name, school, department, position, email })} />
          <GhostButton title="이메일 인증으로 실제 가입" appRole={role} onPress={() => setUseEmailAuth(true)} />
        </> : session ? <>
          <Text style={T.bodyLG}>{session.user.email} 이메일 인증 완료</Text>
          <AgreementSection onRequiredAgreedChange={setAgreed} appRole={role} />
          <LimeButton title={busy ? '저장 중…' : '가입 완료하기'} onPress={complete} appRole={role} disabled={busy || !agreed || !name.trim() || (role === 'booker' && !school.trim())} />
          <GhostButton title="다른 계정으로 인증" onPress={logout} appRole={role} disabled={busy} />
        </> : <>
          <Text style={T.bodyLG}>{role === 'booker' ? '학교 이메일로 받은 인증번호를 입력해주세요.' : '이메일로 받은 인증번호로 로그인하세요.'}</Text>
          {!signup && emailField}
          <LimeButton title={cooldown ? `${cooldown}초 후 재요청` : '인증번호 요청'} onPress={requestCode} disabled={busy || !emailValid || cooldown > 0} appRole={role} />
          {sentTo ? <Text style={T.bodyMD}>{sentTo}로 인증 메일을 요청했습니다. 메일함과 스팸함을 확인해주세요.</Text> : null}
          <View style={{ gap: 8 }}><FormLabel title="인증번호" appRole={role} />
            <AppTextField appRole={role} value={code} placeholder="메일에 표시된 인증번호" keyboardType="number-pad" editable={!busy}
              onChangeText={v => setCode(v.replace(/\D/g, '').slice(0, 10))} />
          </View>
          <LimeButton title={busy ? '처리 중…' : '인증하고 계속'} onPress={verify} disabled={busy || !sentTo || !/^\d{6,10}$/.test(code)} appRole={role} />
        </>}
        {__DEV__ && signup && useEmailAuth && <GhostButton title="테스트 가입으로 돌아가기" appRole={role} disabled={busy} onPress={() => setUseEmailAuth(false)} />}
        {error ? <Text accessibilityRole="alert" style={[T.bodyLG, { color: AppColors.danger }]}>{error}</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

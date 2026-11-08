import useNativeBack from '../navigation/useNativeBack';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppState, useTypography } from '../state/AppState';
import type { UserRole } from '../models/types';
import { supabase } from '../lib/supabase';
import { rpc, errorMessage } from '../services/backend';
import { AppTextField, FormLabel } from './CommonComponents';
import { LimeButton, GhostButton } from './Buttons';
import ScreenHeader from './ScreenHeader';
import { AppSpacing } from '../theme/spacing';
import { AppRadius } from '../theme/radius';
import AgreementSection from './AgreementSection';
import { AppColors } from '../theme/colors';

export default function AccountAccess({ role, signup = false }: { role: UserRole; signup?: boolean }) {
  const { session, ready, refresh, logout, enterPreview, isAdmin, setAdminPanelOpen, setStudentVerificationOnEntry } = useAppState();
  const [useEmailAuth, setUseEmailAuth] = useState(!__DEV__ || !signup);
  const previewSignup = __DEV__ && signup && !session && !useEmailAuth;
  const T = useTypography(role);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [requestingCode, setRequestingCode] = useState(false);
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [actionBusy, setBusy] = useState(false);
  const busy = actionBusy || !ready;
  const goBack = useNativeBack(busy);
  const busyRef = useRef(false);
  const [error, setError] = useState('');
  const [passwordMode, setPasswordMode] = useState(false);
  const [password, setPassword] = useState('');
  const normalized = email.trim().toLowerCase();
  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized);
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
    if (!emailValid) throw new Error('이메일 주소를 확인해주세요.');
    setRequestingCode(true);
    try {
    const { error } = await supabase.auth.signInWithOtp({ email: normalized, options: { shouldCreateUser: signup } });
    if (error) throw error;
    setSentTo(normalized); setCode(''); setCooldown(60);
    } finally { setRequestingCode(false); }
  });
  const verify = () => run(async () => {
    if (normalized !== sentTo || !/^\d{6,10}$/.test(code)) throw new Error('메일로 받은 인증번호를 입력해주세요.');
    const { error } = await supabase.auth.verifyOtp({ email: sentTo, token: code, type: 'email' });
    if (error) throw error;
    // Auth state listener loads the server profile; local form values never grant access.
  });
  const loginWithPassword = () => run(async () => {
    if (!emailValid || !password) throw new Error('이메일과 비밀번호를 입력해주세요.');
    const { error } = await supabase.auth.signInWithPassword({ email: normalized, password });
    if (error) throw error;
    setPassword('');
  });
  const profileComplete = !!name.trim() && (role !== 'booker' || !!(school.trim() && department.trim() && position.trim()));
  const complete = () => run(async () => {
    if (!agreed || !profileComplete) throw new Error('기본 정보와 필수 약관을 확인해주세요.');
    await rpc('complete_profile', { p_role: role, p_real_name: name.trim(), p_school_name: school.trim(),
      p_department_name: department.trim(), p_position: position.trim() });
    if (role === 'booker') setStudentVerificationOnEntry(true);
    await refresh();
  });
  const field = (label: string, value: string, change: (value: string) => void, placeholder: string) => (
    <View style={{ gap: 8 }}><FormLabel title={label} required appRole={role} />
      <AppTextField accessibilityLabel={`${label} 필수`} placeholder={placeholder} value={value} onChangeText={change} editable={!busy} appRole={role} /></View>
  );
  const emailField = <View style={{ gap: 8 }}><FormLabel title="이메일" required appRole={role} />
    <AppTextField appRole={role} accessibilityLabel="이메일 필수" value={email} autoCapitalize="none" autoCorrect={false} keyboardType={Platform.OS === 'ios' ? 'ascii-capable' : 'email-address'} textContentType="emailAddress" spellCheck={false} editable={!busy}
      placeholder="name@example.com"
      onChangeText={v => { setEmail(v); setSentTo(''); setCode(''); }} />
  </View>;
  return <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.surface }}>
    <ScreenHeader title={`${role === 'booker' ? '예약자' : '점주'} ${session ? '가입 정보 확인' : signup ? '회원가입' : '로그인'}`} onBack={goBack} disabled={busy} appRole={role} />
      <ScrollView automaticallyAdjustKeyboardInsets style={{ flex: 1 }} contentContainerStyle={{ padding: AppSpacing.s24, paddingTop: AppSpacing.s8, gap: AppSpacing.s20 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        {!ready ? <Text style={T.bodyLG}>인증된 계정을 확인하고 있습니다…</Text> : session ? <Text style={T.bodyLG}>{session.user.email} 이메일 인증 완료. 기본 정보와 필수 약관을 확인하면 {role === 'booker' ? '학생증 제출로 이어집니다.' : '가입이 완료됩니다.'}</Text> : null}
        {isAdmin && <GhostButton title="관리자 학생증 심사" appRole={role} onPress={() => setAdminPanelOpen(true)} />}
        {(signup || session) && <>
          <Text style={T.bodyLG}>기본 정보</Text>
          {field(role === 'booker' ? '이름' : '점주 성함', name, setName, role === 'booker' ? '학생증에 기재된 이름을 입력해주세요' : '점주님의 성함을 입력해주세요')}
          {role === 'owner' && <Text style={T.bodyMD}>매장명은 다음 매장 등록 단계에서 입력합니다.</Text>}
          {role === 'booker' && <>{field('학교명', school, setSchool, '예: 연세대학교')}{field('학과 / 집단명', department, setDepartment, '예: 경영학과 학생회, 중앙동아리')}{field('직책', position, setPosition, '예: 회장, 총무, 동아리원')}</>}
          {!session && emailField}
          {previewSignup && <View style={{ gap: 12 }}>
            <LimeButton title="이메일 인증하기" appRole={role} disabled={busy} onPress={() => setUseEmailAuth(true)} />
            <Text style={T.bodyMD}>{role === 'booker' ? '이메일 인증과 가입 정보 확인 후 학생증을 제출할 수 있어요. 예약은 학생증 승인 후 이용할 수 있습니다.' : '이메일 인증과 가입 정보 확인 후 매장을 등록하고 예약을 관리할 수 있어요.'}</Text>
          </View>}
        </>}
        {previewSignup ? <>
          <AgreementSection onRequiredAgreedChange={setAgreed} appRole={role} />
          <View style={{ gap: AppSpacing.s12, padding: AppSpacing.s16, borderRadius: AppRadius.lg, backgroundColor: AppColors.surfaceContainer }}>
          <Text style={T.titleMD}>개발용 테스트 미리보기</Text>
          <Text style={[T.bodyMD, { color: AppColors.inkSecondary }]}>입력과 약관 동의 없이 화면을 둘러볼 수 있어요. 실제 계정 생성·예약·학생증 업로드는 진행되지 않습니다.</Text>
          <GhostButton title="입력 없이 테스트 미리보기" appRole={role} disabled={busy}
            onPress={() => enterPreview(role, { name, school, department, position, email })} />
          </View>
        </> : session ? <>
          <AgreementSection onRequiredAgreedChange={setAgreed} appRole={role} />
          <LimeButton title={busy ? '처리 중…' : role === 'booker' ? '가입 완료하고 학생증 제출하기' : '가입 완료하기'} onPress={complete} appRole={role} disabled={busy || !agreed || !profileComplete} />
          <GhostButton title="다른 계정으로 인증" onPress={logout} appRole={role} disabled={busy} />
        </> : !signup && passwordMode ? <>
          <Text style={T.bodyLG}>비밀번호가 설정된 계정으로 로그인해주세요.</Text>
          {emailField}
          <View style={{ gap: 8 }}><FormLabel title="비밀번호" required appRole={role} />
            <AppTextField appRole={role} accessibilityLabel="비밀번호 필수" value={password} onChangeText={setPassword}
              placeholder="비밀번호" secureTextEntry autoCapitalize="none" autoCorrect={false} textContentType="password" editable={!busy} />
          </View>
          <LimeButton title="로그인" loading={actionBusy} onPress={loginWithPassword} disabled={busy || !emailValid || !password} appRole={role} />
          <GhostButton title="이메일 인증번호로 로그인" disabled={busy} appRole={role}
            onPress={() => { setPasswordMode(false); setPassword(''); setError(''); }} />
        </> : <>
          <Text style={T.bodyLG}>이메일로 인증번호를 받은 뒤 아래에 입력해주세요.{role === 'booker' ? ' 학교 메일이 아니어도 가입할 수 있으며, 예약은 학생증 승인 후 이용할 수 있습니다.' : ''}</Text>
          {!signup && emailField}
          <LimeButton loading={requestingCode || cooldown > 0} title={requestingCode ? '인증번호 요청 중…' : cooldown ? `${cooldown}초 후 재요청` : '인증번호 요청'} onPress={requestCode} disabled={busy || !emailValid || cooldown > 0} appRole={role} />
          {sentTo ? <Text style={T.bodyMD}>{sentTo}로 인증 메일을 요청했습니다. 메일함과 스팸함을 확인해주세요.</Text> : null}
          <View style={{ gap: 8 }}><FormLabel title="인증번호" appRole={role} />
            <AppTextField appRole={role} value={code} placeholder="메일에 표시된 인증번호" keyboardType="number-pad" editable={!busy}
              onChangeText={v => setCode(v.replace(/\D/g, '').slice(0, 10))} />
          </View>
          <LimeButton title="인증하고 계속" onPress={verify} disabled={busy || !sentTo || !/^\d{6,10}$/.test(code)} appRole={role} />
          {!signup && <GhostButton title="비밀번호로 로그인" disabled={busy} appRole={role}
            onPress={() => { setPasswordMode(true); setCode(''); setError(''); }} />}
        </>}
        {__DEV__ && signup && !session && useEmailAuth && <GhostButton title="테스트 미리보기로 돌아가기" appRole={role} disabled={busy} onPress={() => setUseEmailAuth(false)} />}
        {error ? <Text accessibilityRole="alert" style={[T.bodyLG, { color: AppColors.danger }]}>{error}</Text> : null}
      </ScrollView>
  </SafeAreaView>;
}

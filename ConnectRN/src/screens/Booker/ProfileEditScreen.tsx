import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppState, useTypography } from '../../state/AppState';
import { AppTextField, FormLabel } from '../../components/CommonComponents';
import { LimeButton, GhostButton } from '../../components/Buttons';
import { useServerAction } from '../../hooks/useServer';
import { AppColors } from '../../theme/colors';
export default function ProfileEditScreen() {
  const app = useAppState(); const T = useTypography('booker'); const navigation = useNavigation<any>();
  const action = useServerAction();
  const [name, setName] = useState(app.realName); const [school, setSchool] = useState(app.schoolName);
  const [department, setDepartment] = useState(app.departmentName); const [position, setPosition] = useState(app.position);
  return <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.surface }}><ScrollView contentContainerStyle={{ padding: 22, gap: 20 }} keyboardShouldPersistTaps="handled">
    <GhostButton title="뒤로" onPress={() => navigation.goBack()} />
    <Text style={T.headlineLG}>개인정보 수정</Text><Text style={T.bodyLG}>{app.isPreview ? '입력한 이메일 (미인증)' : '인증된 이메일'}: {app.schoolEmail || '미입력'}</Text>
    {['pending','approved'].includes(app.studentVerification?.status ?? '') && <Text style={T.bodyLG}>이름이나 학교를 바꾸면 학생증 인증을 다시 신청해야 합니다.</Text>}
    {([['이름', name, setName], ['학교명', school, setSchool], ['학과 / 단체명', department, setDepartment], ['직책', position, setPosition]] as const).map(([label, value, change]) =>
      <View key={label} style={{ gap: 8 }}><FormLabel title={label} /><AppTextField value={value} onChangeText={change} editable={!action.busy} /></View>)}
    <LimeButton title={action.busy ? '저장 중…' : '변경사항 저장'} disabled={action.busy || !name.trim() || !school.trim()}
      onPress={() => action.run(() => app.saveProfile(name.trim(), school.trim(), department.trim(), position.trim()), () => navigation.goBack())} />
  </ScrollView></SafeAreaView>;
}

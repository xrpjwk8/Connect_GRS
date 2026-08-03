import { Alert, Platform } from 'react-native';

export interface AlertButtonOption {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

// react-native-web의 Alert.alert()는 완전 no-op(빈 함수)라 웹에서는 아무 것도 안 뜨고
// 버튼 onPress도 안 불림. window.alert/confirm으로 대체해서 크로스플랫폼으로 동작시킴.
export function showAlert(title: string, message?: string, buttons?: AlertButtonOption[]): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons as Parameters<typeof Alert.alert>[2]);
    return;
  }

  const fullText = message ? `${title}\n\n${message}` : title;

  if (!buttons || buttons.length === 0) {
    window.alert(fullText);
    return;
  }

  if (buttons.length === 2) {
    const cancelButton = buttons.find((b) => b.style === 'cancel') ?? buttons[0];
    const actionButton = buttons.find((b) => b !== cancelButton) ?? buttons[1];
    if (window.confirm(fullText)) {
      actionButton.onPress?.();
    } else {
      cancelButton.onPress?.();
    }
    return;
  }

  window.alert(fullText);
  const defaultButton = buttons.find((b) => b.style !== 'cancel') ?? buttons[0];
  defaultButton.onPress?.();
}

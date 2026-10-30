import { Alert, Platform } from 'react-native';
import type { AlertButton } from 'react-native';
// React Native Alert has no web implementation. Keep confirmations functional there.
export function showAlert(title: string, message = '', buttons?: AlertButton[]) {
  if (Platform.OS !== 'web') { Alert.alert(title, message, buttons); return; }
  const actions = buttons?.filter(b => b.style !== 'cancel') ?? [];
  const content = `${title}\n\n${message}`;
  if (actions.length && (buttons?.length ?? 0) > 1) {
    if (window.confirm(content)) actions[0].onPress?.();
  } else {
    window.alert(content);
    actions[0]?.onPress?.();
  }
}

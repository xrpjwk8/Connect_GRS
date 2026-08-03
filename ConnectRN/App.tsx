import { Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AppStateProvider } from './src/state/AppState';
import RootNavigator from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import { AppColors } from './src/theme/colors';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppStateProvider>
          <View style={styles.webBackdrop}>
            <View style={styles.webFrame}>
              <NavigationContainer ref={navigationRef}>
                <RootNavigator />
                <StatusBar style="auto" />
              </NavigationContainer>
            </View>
          </View>
        </AppStateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// 웹 데스크톱 브라우저에서 모바일 화면이 그대로 늘어나 보이는 걸 막기 위해
// 폰 폭(430px)으로 가운데 고정. 모바일 브라우저(뷰포트 <430)에서는 100% 폭 그대로라 영향 없음.
const styles = StyleSheet.create({
  webBackdrop: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Platform.OS === 'web' ? AppColors.canvasDeep : AppColors.surface,
  },
  webFrame: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 430 : undefined,
    backgroundColor: AppColors.surface,
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 0 60px rgba(0,0,0,0.12)' } as object) : null),
  },
});

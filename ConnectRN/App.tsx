import { useState } from 'react';
import { navigationRef } from './src/navigation/navigationRef';
import NotificationBridge from './src/components/NotificationBridge';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AppStateProvider } from './src/state/AppState';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  const [navigationReady, setNavigationReady] = useState(false);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppStateProvider>
          <NavigationContainer ref={navigationRef} onReady={() => setNavigationReady(true)}>
            <RootNavigator />
            <NotificationBridge navigationReady={navigationReady} />
            <StatusBar style="auto" />
          </NavigationContainer>
        </AppStateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

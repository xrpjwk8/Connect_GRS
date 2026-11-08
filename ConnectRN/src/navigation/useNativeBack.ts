import { useLayoutEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import { useNavigation, usePreventRemove } from '@react-navigation/native';

export default function useNativeBack(disabled = false) {
  const { width } = useWindowDimensions();
  const navigation = useNavigation<any>();
  usePreventRemove(disabled, () => {});
  useLayoutEffect(() => {
    navigation.setOptions({
      gestureEnabled: !disabled,
      fullScreenGestureEnabled: true,
      gestureResponseDistance: { start: 0, end: width / 2 },
    });
  }, [navigation, disabled, width]);
  return () => { if (!disabled) navigation.goBack(); };
}

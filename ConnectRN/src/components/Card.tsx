import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { AppColors } from '../theme/colors';
import { AppRadius } from '../theme/radius';

interface CardProps {
  children: React.ReactNode;
  padding?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export default function Card({ children, padding = 16, radius = AppRadius.lg, style }: CardProps) {
  return (
    <View
      style={[
        {
          padding,
          borderRadius: radius,
          backgroundColor: AppColors.white,
          borderWidth: 1,
          borderColor: AppColors.borderStrong,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

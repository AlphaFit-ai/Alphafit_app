import React from 'react';
import { View } from 'react-native';

export const Camera = { requestCameraPermissionsAsync: async () => ({ status: 'denied' }) };
export function CameraView({ children, style }) {
  return React.createElement(View, { style: [{ backgroundColor: '#222' }, style] }, children);
}

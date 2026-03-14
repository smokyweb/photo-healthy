import React from 'react';
import { View } from 'react-native';

export const SafeAreaProvider = ({ children }) => children;
export const SafeAreaView = ({ children, style, ...rest }) => (
  <View style={style} {...rest}>{children}</View>
);
export const useSafeAreaInsets = () => ({ top: 0, bottom: 0, left: 0, right: 0 });
export const SafeAreaInsetsContext = React.createContext({ top: 0, bottom: 0, left: 0, right: 0 });
export const SafeAreaFrameContext = React.createContext({ x: 0, y: 0, width: 0, height: 0 });
export const initialWindowMetrics = { insets: { top: 0, bottom: 0, left: 0, right: 0 }, frame: { x: 0, y: 0, width: 0, height: 0 } };
export const useSafeAreaFrame = () => ({ x: 0, y: 0, width: 0, height: 0 });
export const withSafeAreaInsets = (Component) => (props) => <Component {...props} insets={{ top: 0, bottom: 0, left: 0, right: 0 }} />;
export default { SafeAreaProvider, SafeAreaView, useSafeAreaInsets };

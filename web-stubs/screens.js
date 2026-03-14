import React from 'react';
import { View } from 'react-native';

export const enableScreens = () => {};
export const enableFreeze = () => {};
export const screensEnabled = () => true;

export class Screen extends React.Component {
  render() {
    const { active, activityState, children, style, ...rest } = this.props;
    return <View style={[{ flex: 1 }, style]} {...rest}>{children}</View>;
  }
}

export class ScreenContainer extends React.Component {
  render() {
    const { children, style, ...rest } = this.props;
    return <View style={[{ flex: 1 }, style]} {...rest}>{children}</View>;
  }
}

export class ScreenStack extends React.Component {
  render() {
    const { children, style, ...rest } = this.props;
    return <View style={[{ flex: 1 }, style]} {...rest}>{children}</View>;
  }
}

export class ScreenStackHeaderConfig extends React.Component {
  render() { return null; }
}

export const NativeScreen = Screen;
export const NativeScreenContainer = ScreenContainer;
export const NativeScreenNavigationContainer = View;
export const ScreenStackHeaderBackButtonImage = View;
export const ScreenStackHeaderRightView = View;
export const ScreenStackHeaderLeftView = View;
export const ScreenStackHeaderCenterView = View;
export const ScreenStackHeaderSearchBarView = View;
export const SearchBar = View;
export const FullWindowOverlay = View;
export const useTransitionProgress = () => ({ progress: { value: 1 } });

export default {
  enableScreens,
  enableFreeze,
  screensEnabled,
  Screen,
  ScreenContainer,
  ScreenStack,
  ScreenStackHeaderConfig,
};

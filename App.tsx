import React from 'react';
import { Platform, View, Text, ActivityIndicator } from 'react-native';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useWindowDimensions } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { C } from './src/theme';
import BottomNavBar from './src/components/BottomNavBar';
import TopNavBar from './src/components/TopNavBar';
import ScreenWithNav from './src/components/ScreenWithNav';
import AppBackground from './src/components/AppBackground';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import ChallengesScreen from './src/screens/ChallengesScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import ChallengeDetailScreen from './src/screens/ChallengeDetailScreen';
import SubmitPhotoScreen from './src/screens/SubmitPhotoScreen';
import UserSubmissionsScreen from './src/screens/UserSubmissionsScreen';
import SubmissionDetailScreen from './src/screens/SubmissionDetailScreen';
import ShopScreen from './src/screens/ShopScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import CartScreen from './src/screens/CartScreen';
import CheckoutSuccessScreen from './src/screens/CheckoutSuccessScreen';
import AdminScreen from './src/screens/AdminScreen';
import GalleryScreen from './src/screens/GalleryScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';
import OrderHistoryScreen from './src/screens/OrderHistoryScreen';
import PartnersScreen from './src/screens/PartnersScreen';
import ContactScreen from './src/screens/ContactScreen';
import AboutScreen from './src/screens/AboutScreen';
import HowItWorksScreen from './src/screens/HowItWorksScreen';
import FAQScreen from './src/screens/FAQScreen';
import LegalScreen from './src/screens/LegalScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import MyProgressScreen from './src/screens/MyProgressScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
  },
};

const linking = {
  prefixes: ['https://photoai.betaplanets.com', 'http://localhost:19006'],
  config: {
    screens: {
      Main: {
        screens: {
          HomeTab: '/',
          ChallengesTab: 'challenges',
          CommunityTab: 'community',
          ProfileTab: 'profile',
        },
      },
      Login: 'login',
      Register: 'register',
      ResetPassword: 'reset-password',
      ChallengeDetail: 'challenge/:challengeId',
      SubmitPhoto: 'challenge/:challengeId/submit',
      SubmissionDetail: 'submission/:submissionId',
  UserSubmissions: 'user/:userId/submissions',
      Shop: 'shop',
      ProductDetail: 'shop/product/:id',
      Cart: 'cart',
      CheckoutSuccess: 'checkout/success',
      Admin: 'admin',
      Gallery: 'gallery',
      Subscription: 'subscription',
      OrderHistory: 'my-orders',
      Partners: 'partners',
      Contact: 'contact',
      About: 'about',
      HowItWorks: 'how-it-works',
      FAQ: 'faq',
      Legal: 'legal',
      EditProfile: 'profile/edit',
      MyProgress: 'profile/progress',
    },
  },
};

function MainTabs() {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  return (
    <View style={{ flex: 1, flexDirection: 'column' }}>
      <AppBackground />
      <View style={{ flex: 1 }}>
        <TopNavBar />
      <Tab.Navigator
      sceneContainerStyle={{ backgroundColor: 'transparent' }}
      screenOptions={{
        headerShown: false,
        tabBarStyle: isDesktop
          ? ({ display: 'none' } as any)
          : {
              backgroundColor: C.NAV_BG,
              borderTopColor: 'rgba(255,255,255,0.08)',
              borderTopWidth: 1,
              // Use safe-area-inset-bottom so the tab bar clears the iOS Safari URL bar
              height: Platform.OS === 'web' ? 'calc(64px + env(safe-area-inset-bottom, 0px))' as any : 80,
              paddingBottom: Platform.OS === 'web' ? 'max(8px, env(safe-area-inset-bottom, 8px))' as any : 20,
              paddingTop: 8,
            } as any,
        tabBarActiveTintColor: C.ORANGE,
        tabBarInactiveTintColor: C.MED,
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home', tabBarLabel: 'Home', tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size || 20, color }}>🏠</Text> }} />
      <Tab.Screen name="ChallengesTab" component={ChallengesScreen} options={{ title: 'Challenges', tabBarLabel: 'Challenges', tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size || 20, color }}>🏆</Text> }} />
      <Tab.Screen name="CommunityTab" component={CommunityScreen} options={{ title: 'Community', tabBarLabel: 'Community', tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size || 20, color }}>👥</Text> }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile', tabBarLabel: 'Profile', tabBarIcon: ({ color, size }) => <Text style={{ fontSize: size || 20, color }}>👤</Text> }} />
    </Tab.Navigator>
      </View>
    </View>
  );
}

// Wrapper for outer stack screens - adds TopNavBar + bottom nav
function OuterScreenWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ScreenWithNav>
      <View style={{ flex: 1 }}>{children}</View>
    </ScreenWithNav>
  );
}

function AppNavigator() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.BG, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={C.ORANGE} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking} theme={navTheme} fallback={<ActivityIndicator color={C.ORANGE} />}>
      <Stack.Navigator screenOptions={{
          headerShown: false,
          // On web: allow each screen to scroll naturally via the browser
          ...(Platform.OS === 'web' ? {
            cardStyle: { flex: 1 as any, overflow: 'hidden' as any, backgroundColor: 'transparent' },
            cardOverlayEnabled: false,
          } : {}),
        }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Login">{(p) => <OuterScreenWrapper><LoginScreen {...p} /></OuterScreenWrapper>}</Stack.Screen>
        <Stack.Screen name="Register">{(p) => <OuterScreenWrapper><RegisterScreen {...p} /></OuterScreenWrapper>}</Stack.Screen>
        <Stack.Screen name="ResetPassword">{(p) => <OuterScreenWrapper><ResetPasswordScreen {...p} /></OuterScreenWrapper>}</Stack.Screen>
        <Stack.Screen name="ChallengeDetail">{(props) => <OuterScreenWrapper><ChallengeDetailScreen {...props} /></OuterScreenWrapper>}</Stack.Screen>
        <Stack.Screen name="SubmitPhoto">{(props) => <OuterScreenWrapper><SubmitPhotoScreen {...props} /></OuterScreenWrapper>}</Stack.Screen>
        <Stack.Screen name="UserSubmissions">{(p) => <OuterScreenWrapper><UserSubmissionsScreen {...p} /></OuterScreenWrapper>}</Stack.Screen>
        <Stack.Screen name="SubmissionDetail">{(p) => <OuterScreenWrapper><SubmissionDetailScreen {...p} /></OuterScreenWrapper>}</Stack.Screen>
        <Stack.Screen name="Shop">{(p) => <OuterScreenWrapper><ShopScreen {...p} /></OuterScreenWrapper>}</Stack.Screen>
        <Stack.Screen name="ProductDetail">{(p) => <OuterScreenWrapper><ProductDetailScreen {...p} /></OuterScreenWrapper>}</Stack.Screen>
        <Stack.Screen name="Cart">{(p) => <OuterScreenWrapper><CartScreen {...p} /></OuterScreenWrapper>}</Stack.Screen>
        <Stack.Screen name="CheckoutSuccess">{(p) => <OuterScreenWrapper><CheckoutSuccessScreen {...p} /></OuterScreenWrapper>}</Stack.Screen>
        <Stack.Screen name="Admin">{(p) => <OuterScreenWrapper><AdminScreen {...p} /></OuterScreenWrapper>}</Stack.Screen>
        <Stack.Screen name="Gallery">{(p) => <OuterScreenWrapper><GalleryScreen {...p} /></OuterScreenWrapper>}</Stack.Screen>
        <Stack.Screen name="Subscription">{(p) => <OuterScreenWrapper><SubscriptionScreen {...p} /></OuterScreenWrapper>}</Stack.Screen>
        <Stack.Screen name="OrderHistory">{(p) => <OuterScreenWrapper><OrderHistoryScreen {...p} /></OuterScreenWrapper>}</Stack.Screen>
        <Stack.Screen name="Partners">{(p) => <OuterScreenWrapper><PartnersScreen {...p} /></OuterScreenWrapper>}</Stack.Screen>
        <Stack.Screen name="Contact">{(p) => <OuterScreenWrapper><ContactScreen {...p} /></OuterScreenWrapper>}</Stack.Screen>
        <Stack.Screen name="About">{(p) => <OuterScreenWrapper><AboutScreen {...p} /></OuterScreenWrapper>}</Stack.Screen>
        <Stack.Screen name="HowItWorks">{(p) => <OuterScreenWrapper><HowItWorksScreen {...p} /></OuterScreenWrapper>}</Stack.Screen>
        <Stack.Screen name="FAQ">{(p) => <OuterScreenWrapper><FAQScreen {...p} /></OuterScreenWrapper>}</Stack.Screen>
        <Stack.Screen name="Legal">{(p) => <OuterScreenWrapper><LegalScreen {...p} /></OuterScreenWrapper>}</Stack.Screen>
        <Stack.Screen name="EditProfile">{(p) => <OuterScreenWrapper><EditProfileScreen {...p} /></OuterScreenWrapper>}</Stack.Screen>
        <Stack.Screen name="MyProgress">{(p) => <OuterScreenWrapper><MyProgressScreen {...p} /></OuterScreenWrapper>}</Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppNavigator />
      </CartProvider>
    </AuthProvider>
  );
}

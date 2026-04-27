import React from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useWindowDimensions } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { C } from './src/theme';
import BottomNavBar from './src/components/BottomNavBar';

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
      ChallengeDetail: 'challenge/:id',
      SubmitPhoto: 'challenge/:challengeId/submit',
      SubmissionDetail: 'submission/:id',
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
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: isDesktop
          ? ({ display: 'none' } as any)
          : {
              backgroundColor: C.NAV_BG,
              borderTopColor: 'rgba(255,255,255,0.08)',
              borderTopWidth: 1,
              height: Platform.OS === 'web' ? 64 : 80,
              paddingBottom: Platform.OS === 'web' ? 8 : 20,
              paddingTop: 8,
            },
        tabBarActiveTintColor: C.ORANGE,
        tabBarInactiveTintColor: C.MED,
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home', tabBarLabel: 'Home' }} />
      <Tab.Screen name="ChallengesTab" component={ChallengesScreen} options={{ title: 'Challenges', tabBarLabel: 'Challenges' }} />
      <Tab.Screen name="CommunityTab" component={CommunityScreen} options={{ title: 'Community', tabBarLabel: 'Community' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile', tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

// Wrapper that adds bottom nav to outer screens
function OuterScreenWrapper({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>{children}</View>
      <BottomNavBar />
    </View>
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
    <NavigationContainer linking={linking} fallback={<ActivityIndicator color={C.ORANGE} />}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="ChallengeDetail">{(props) => <OuterScreenWrapper><ChallengeDetailScreen {...props} /></OuterScreenWrapper>}</Stack.Screen>
        <Stack.Screen name="SubmitPhoto">{(props) => <OuterScreenWrapper><SubmitPhotoScreen {...props} /></OuterScreenWrapper>}</Stack.Screen>
        <Stack.Screen name="SubmissionDetail" component={SubmissionDetailScreen} />
        <Stack.Screen name="Shop" component={ShopScreen} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="CheckoutSuccess">{(props) => <OuterScreenWrapper><CheckoutSuccessScreen {...props} /></OuterScreenWrapper>}</Stack.Screen>
        <Stack.Screen name="Admin" component={AdminScreen} />
        <Stack.Screen name="Gallery" component={GalleryScreen} />
        <Stack.Screen name="Subscription" component={SubscriptionScreen} />
        <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
        <Stack.Screen name="Partners" component={PartnersScreen} />
        <Stack.Screen name="Contact" component={ContactScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="HowItWorks" component={HowItWorksScreen} />
        <Stack.Screen name="FAQ" component={FAQScreen} />
        <Stack.Screen name="Legal" component={LegalScreen} />
        <Stack.Screen name="EditProfile">{(props) => <OuterScreenWrapper><EditProfileScreen {...props} /></OuterScreenWrapper>}</Stack.Screen>
        <Stack.Screen name="MyProgress" component={MyProgressScreen} />
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

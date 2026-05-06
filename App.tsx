import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { C } from './src/theme';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ChallengesScreen from './src/screens/ChallengesScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ChallengeDetailScreen from './src/screens/ChallengeDetailScreen';
import SubmitPhotoScreen from './src/screens/SubmitPhotoScreen';
import SubmissionDetailScreen from './src/screens/SubmissionDetailScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';
import AdminScreen from './src/screens/AdminScreen';
import GalleryScreen from './src/screens/GalleryScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import MyProgressScreen from './src/screens/MyProgressScreen';
import AboutScreen from './src/screens/AboutScreen';
import FAQScreen from './src/screens/FAQScreen';
import LegalScreen from './src/screens/LegalScreen';
import HowItWorksScreen from './src/screens/HowItWorksScreen';
import PartnersScreen from './src/screens/PartnersScreen';
import ContactScreen from './src/screens/ContactScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const APP_FONT_FAMILY = 'Lexend';
const ORANGE_GRADIENT_135 = 'linear-gradient(135deg, #F55B09 0%, #FFD000 100%)';

const applyDefaultFont = (Component: any) => {
  Component.defaultProps = Component.defaultProps || {};
  Component.defaultProps.style = [
    { fontFamily: APP_FONT_FAMILY },
    Component.defaultProps.style,
  ];
};

applyDefaultFont(Text);
applyDefaultFont(TextInput);

const linking = {
  prefixes: [],
  config: {
    screens: {
      Main: {
        screens: {
          HomeTab: { screens: { Home: '' } },
          ChallengesTab: { screens: { Challenges: 'challenges' } },
          SubmitTab: 'submit-tab',
          CommunityTab: { screens: { Community: 'community' } },
          ProfileTab: { screens: { Profile: 'profile' } },
        },
      },
      Login: 'login',
      Register: 'register',
      ChallengeDetail: 'challenge/:id',
      SubmitPhoto: 'submit/:challengeId',
      SubmissionDetail: 'submission/:id',
      Gallery: 'gallery',
      Subscription: 'subscription',
      Admin: 'admin',
    },
  },
};

const ionIcon = (name: string, color: string) => {
  const stroke = `stroke="${color}" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"`;
  const svg = (() => {
    switch (name) {
      case 'Home':
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path ${stroke} fill="none" d="M80 212v236a4 4 0 004 4h120V320h104v132h120a4 4 0 004-4V212"/><path ${stroke} fill="none" d="M480 256L266.89 52c-5.18-4.96-16.6-4.96-21.78 0L32 256M400 179V64h-48v69"/></svg>`;
      case 'Challenges':
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path ${stroke} fill="none" d="M350.54 148.68l-26.62-42.06C318.31 100.08 310.62 96 302.42 96h-92.84c-8.2 0-15.89 4.08-21.5 10.62l-26.62 42.06C155.85 155.23 148.16 160 140 160H80a32 32 0 00-32 32v192a32 32 0 0032 32h352a32 32 0 0032-32V192a32 32 0 00-32-32h-60c-8.16 0-15.85-4.77-21.46-11.32z"/><circle ${stroke} fill="none" cx="256" cy="288" r="80"/></svg>`;
      case 'Community':
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path ${stroke} fill="none" d="M336 256c-35.35 0-64-32.24-64-72s28.65-72 64-72 64 32.24 64 72-28.65 72-64 72zM176 256c-35.35 0-64-32.24-64-72s28.65-72 64-72 64 32.24 64 72-28.65 72-64 72zM336 304c-46.25 0-80 23.39-80 56v24h160v-24c0-32.61-33.75-56-80-56zM176 304c-46.25 0-80 23.39-80 56v24h160v-24c0-32.61-33.75-56-80-56z"/></svg>`;
      case 'Profile':
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path ${stroke} fill="none" d="M344 144c-3.92 52.87-40 96-88 96s-84.08-43.13-88-96c-4-55.43 35.54-96 88-96s92 40.57 88 96zM256 304c-87 0-160 44.79-160 100v8a36 36 0 0036 36h248a36 36 0 0036-36v-8c0-55.21-73-100-160-100z"/></svg>`;
      default:
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><circle cx="256" cy="256" r="160" fill="${color}"/></svg>`;
    }
  })();
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};

const TabIcon = ({ name, focused, isSubmit }: { name: string; focused: boolean; isSubmit?: boolean }) => {
  if (isSubmit) {
    return (
      <View style={tabStyles.submitBtn}>
        <Text style={tabStyles.submitIcon}>+</Text>
      </View>
    );
  }
  const color = focused ? C.ORANGE : C.TEXT_SECONDARY;
  return (
    <View
      style={[
        tabStyles.ionIcon,
        { backgroundImage: ionIcon(name, color) } as any,
      ]}
    />
  );
};

// Placeholder for Submit tab - redirects to login or submit
const SubmitPlaceholder = ({ navigation }: any) => {
  const { user } = useAuth();
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', (e: any) => {
      e.preventDefault();
      if (!user) {
        navigation.navigate('Login');
      } else {
        // Navigate to challenges to pick one, or a default submit
        navigation.navigate('ChallengesTab');
      }
    });
    return unsubscribe;
  }, [navigation, user]);

  return <View style={{ flex: 1, backgroundColor: C.BG }} />;
};

// Profile with auth guard
const ProfileGuard = ({ navigation }: any) => {
  const { user } = useAuth();
  React.useEffect(() => {
    if (!user) {
      navigation.navigate('Login');
    }
  }, [user, navigation]);

  if (!user) return <View style={{ flex: 1, backgroundColor: C.BG }} />;
  return <ProfileScreen navigation={navigation} />;
};

// Stack wrappers for each tab
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Home" component={HomeScreen} />
  </Stack.Navigator>
);

const ChallengesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Challenges" component={ChallengesScreen} />
  </Stack.Navigator>
);

const CommunityStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Community" component={CommunityScreen} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Profile" component={ProfileGuard} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="MyProgress" component={MyProgressScreen} />
  </Stack.Navigator>
);

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.NAV_BG,
          borderTopColor: 'rgba(255,255,255,0.08)',
          borderTopWidth: 1,
          height: Platform.OS === 'web' ? 64 : 80,
          paddingBottom: Platform.OS === 'web' ? 8 : 20,
          paddingTop: 8,
        },
        tabBarActiveTintColor: C.ORANGE,
        tabBarInactiveTintColor: C.TEXT_SECONDARY,
        tabBarLabelStyle: { fontFamily: APP_FONT_FAMILY, fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="Home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ChallengesTab"
        component={ChallengesStack}
        options={{
          tabBarLabel: 'Challenges',
          tabBarIcon: ({ focused }) => <TabIcon name="Challenges" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="SubmitTab"
        component={SubmitPlaceholder}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ focused }) => <TabIcon name="Submit" focused={focused} isSubmit />,
        }}
      />
      <Tab.Screen
        name="CommunityTab"
        component={CommunityStack}
        options={{
          tabBarLabel: 'Community',
          tabBarIcon: ({ focused }) => <TabIcon name="Community" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={C.ORANGE} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking} fallback={<ActivityIndicator color={C.ORANGE} />}>
      <Stack.Navigator screenOptions={{ headerShown: false, headerTitleStyle: { fontFamily: APP_FONT_FAMILY } }}>
        <Stack.Screen name="Main">
          {() => (user ? <MainTabs /> : <HomeStack />)}
        </Stack.Screen>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ChallengeDetail" component={ChallengeDetailScreen}
          options={{ headerShown: true, title: 'Challenge', headerStyle: { backgroundColor: C.BG }, headerTintColor: C.TEXT }} />
        <Stack.Screen name="SubmissionDetail" component={SubmissionDetailScreen}
          options={{ headerShown: true, title: 'Photo', headerStyle: { backgroundColor: C.BG }, headerTintColor: C.TEXT }} />
        <Stack.Screen name="SubmitPhoto" component={SubmitPhotoScreen}
          options={{ headerShown: true, title: 'Submit Photo', headerStyle: { backgroundColor: C.BG }, headerTintColor: C.TEXT }} />
        <Stack.Screen name="Subscription" component={SubscriptionScreen}
          options={{ headerShown: true, title: 'Subscription', headerStyle: { backgroundColor: C.BG }, headerTintColor: C.TEXT }} />
        <Stack.Screen name="Admin" component={AdminScreen} />
        <Stack.Screen name="Gallery" component={GalleryScreen} />
      <Stack.Screen name="About">{(p: any) => <OuterScreenWrapper><AboutScreen /></OuterScreenWrapper>}</Stack.Screen>
      <Stack.Screen name="FAQ">{(p: any) => <OuterScreenWrapper><FAQScreen /></OuterScreenWrapper>}</Stack.Screen>
      <Stack.Screen name="Legal">{(p: any) => <OuterScreenWrapper><LegalScreen /></OuterScreenWrapper>}</Stack.Screen>
      <Stack.Screen name="HowItWorks">{(p: any) => <OuterScreenWrapper><HowItWorksScreen /></OuterScreenWrapper>}</Stack.Screen>
      <Stack.Screen name="Partners">{(p: any) => <OuterScreenWrapper><PartnersScreen /></OuterScreenWrapper>}</Stack.Screen>
      <Stack.Screen name="Contact">{(p: any) => <OuterScreenWrapper><ContactScreen /></OuterScreenWrapper>}</Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.BG },
});

const tabStyles = StyleSheet.create({
  ionIcon: {
    width: 24,
    height: 24,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '24px 24px',
  } as any,
  submitBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.ORANGE,
    backgroundImage: ORANGE_GRADIENT_135,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    shadowColor: C.ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  } as any,
  submitIcon: { color: '#FFFFFF', fontSize: 28, fontWeight: '700', marginTop: -2 },
});

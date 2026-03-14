import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

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

// Tab icons using unicode/text
const TabIcon = ({ name, focused, isSubmit }: { name: string; focused: boolean; isSubmit?: boolean }) => {
  if (isSubmit) {
    return (
      <View style={tabStyles.submitBtn}>
        <Text style={tabStyles.submitIcon}>+</Text>
      </View>
    );
  }
  const icons: Record<string, string> = {
    Home: '⌂',
    Challenges: '📷',
    Community: '👥',
    Profile: '👤',
  };
  return (
    <Text style={[tabStyles.icon, { color: focused ? C.ORANGE : C.TEXT_SECONDARY }]}>
      {icons[name] || '●'}
    </Text>
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
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
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
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loader}>
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
  icon: { fontSize: 22 },
  submitBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    shadowColor: C.ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  submitIcon: { color: '#FFFFFF', fontSize: 28, fontWeight: '700', marginTop: -2 },
});

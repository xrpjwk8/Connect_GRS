import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../theme/colors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ outline, filled, focused }: { outline: IoniconName; filled: IoniconName; focused: boolean }) {
  return <Ionicons name={focused ? filled : outline} size={22} color={focused ? AppColors.primaryDeep : AppColors.neutral} />;
}

import BookerHomeScreen from '../screens/Booker/BookerHomeScreen';
import SearchResultsScreen from '../screens/Booker/SearchResultsScreen';
import StoreDetailScreen from '../screens/Booker/StoreDetailScreen';
import SearchFilterScreen from '../screens/Booker/SearchFilterScreen';
import FavoritesScreen from '../screens/Booker/FavoritesScreen';
import MyReservationsScreen from '../screens/Booker/MyReservationsScreen';
import ReservationEditScreen from '../screens/Booker/ReservationEditScreen';
import MyPageScreen from '../screens/Booker/MyPageScreen';
import ProfileEditScreen from '../screens/Booker/ProfileEditScreen';
import ChatListScreen from '../screens/Chat/ChatListScreen';
import ChatScreen from '../screens/Chat/ChatScreen';

const HomeStack = createNativeStackNavigator();
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="BookerHome" component={BookerHomeScreen} />
      <HomeStack.Screen name="SearchResults" component={SearchResultsScreen} />
      <HomeStack.Screen name="StoreDetail" component={StoreDetailScreen} />
      <HomeStack.Screen name="Favorites" component={FavoritesScreen} />
      <HomeStack.Screen
        name="SearchFilter"
        component={SearchFilterScreen}
        options={{ presentation: 'modal', headerShown: false }}
      />
    </HomeStack.Navigator>
  );
}

const ChatStack = createNativeStackNavigator();
function ChatStackNavigator() {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="ChatList" component={ChatListScreen} />
      <ChatStack.Screen name="Chat" component={ChatScreen} />
    </ChatStack.Navigator>
  );
}

const MyReservationsStack = createNativeStackNavigator();
function MyReservationsStackNavigator() {
  return (
    <MyReservationsStack.Navigator screenOptions={{ headerShown: false }}>
      <MyReservationsStack.Screen name="MyReservations" component={MyReservationsScreen} />
      <MyReservationsStack.Screen
        name="ReservationEdit"
        component={ReservationEditScreen}
        options={{ presentation: 'modal', headerShown: false }}
      />
    </MyReservationsStack.Navigator>
  );
}

const MyPageStack = createNativeStackNavigator();
function MyPageStackNavigator() {
  return (
    <MyPageStack.Navigator screenOptions={{ headerShown: false }}>
      <MyPageStack.Screen name="MyPage" component={MyPageScreen} />
      <MyPageStack.Screen name="ProfileEdit" component={ProfileEditScreen} />
    </MyPageStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

export default function BookerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: AppColors.primaryDeep,
        tabBarStyle: { backgroundColor: AppColors.white },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          title: '홈',
          tabBarIcon: ({ focused }) => <TabIcon outline="home-outline" filled="home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatStackNavigator}
        options={{
          title: '채팅',
          tabBarIcon: ({ focused }) => (
            <TabIcon outline="chatbubble-outline" filled="chatbubble" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="MyReservationsTab"
        component={MyReservationsStackNavigator}
        options={{
          title: '내 예약',
          tabBarIcon: ({ focused }) => <TabIcon outline="calendar-outline" filled="calendar" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="MyPageTab"
        component={MyPageStackNavigator}
        options={{
          title: '마이페이지',
          tabBarIcon: ({ focused }) => (
            <TabIcon outline="person-circle-outline" filled="person-circle" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

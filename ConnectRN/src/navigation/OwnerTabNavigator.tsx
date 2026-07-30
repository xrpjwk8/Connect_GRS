import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../theme/colors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ outline, filled, focused }: { outline: IoniconName; filled: IoniconName; focused: boolean }) {
  return <Ionicons name={focused ? filled : outline} size={22} color={focused ? AppColors.primaryDeep : AppColors.neutral} />;
}

import OwnerDashboardScreen from '../screens/Owner/OwnerDashboardScreen';
import ReservationCalendarScreen from '../screens/Owner/ReservationCalendarScreen';
import TimeBlockScreen from '../screens/Owner/TimeBlockScreen';
import ManualReservationScreen from '../screens/Owner/ManualReservationScreen';
import StoreProfileScreen from '../screens/Owner/StoreProfileScreen';
import StoreInfoEditScreen from '../screens/Owner/StoreInfoEditScreen';
import ChatListScreen from '../screens/Chat/ChatListScreen';
import ChatScreen from '../screens/Chat/ChatScreen';

const DashboardStack = createNativeStackNavigator();
function DashboardStackNavigator() {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name="OwnerDashboard" component={OwnerDashboardScreen} />
    </DashboardStack.Navigator>
  );
}

const ReservationCalendarStack = createNativeStackNavigator();
function ReservationCalendarStackNavigator() {
  return (
    <ReservationCalendarStack.Navigator screenOptions={{ headerShown: false }}>
      <ReservationCalendarStack.Screen name="ReservationCalendar" component={ReservationCalendarScreen} />
      <ReservationCalendarStack.Screen name="TimeBlock" component={TimeBlockScreen} />
      <ReservationCalendarStack.Screen
        name="ManualReservation"
        component={ManualReservationScreen}
        options={{ presentation: 'modal', headerShown: false }}
      />
    </ReservationCalendarStack.Navigator>
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

const StoreProfileStack = createNativeStackNavigator();
function StoreProfileStackNavigator() {
  return (
    <StoreProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <StoreProfileStack.Screen name="StoreProfile" component={StoreProfileScreen} />
      <StoreProfileStack.Screen name="StoreInfoEdit" component={StoreInfoEditScreen} />
    </StoreProfileStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

export default function OwnerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: AppColors.primaryDeep,
        tabBarStyle: { backgroundColor: AppColors.white },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStackNavigator}
        options={{
          title: '대시보드',
          tabBarIcon: ({ focused }) => <TabIcon outline="grid-outline" filled="grid" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ReservationCalendarTab"
        component={ReservationCalendarStackNavigator}
        options={{
          title: '예약 관리',
          tabBarIcon: ({ focused }) => <TabIcon outline="calendar-outline" filled="calendar" focused={focused} />,
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
        name="StoreProfileTab"
        component={StoreProfileStackNavigator}
        options={{
          title: '마이페이지',
          tabBarIcon: ({ focused }) => <TabIcon outline="person-circle-outline" filled="person-circle" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

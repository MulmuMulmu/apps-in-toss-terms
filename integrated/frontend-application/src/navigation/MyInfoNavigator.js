import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MyInfoScreen from '../screens/MyInfoScreen';
import MyPostsScreen from '../screens/MyPostsScreen';
import MyShareHistoryScreen from '../screens/MyShareHistoryScreen';
import MarketWriteScreen from '../screens/MarketWriteScreen';

const Stack = createStackNavigator();

export default function MyInfoNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyInfoHome" component={MyInfoScreen} />
      <Stack.Screen name="MyPosts" component={MyPostsScreen} />
      <Stack.Screen name="MyShareHistory" component={MyShareHistoryScreen} />
      <Stack.Screen name="MyPostEdit" component={MarketWriteScreen} />
    </Stack.Navigator>
  );
}

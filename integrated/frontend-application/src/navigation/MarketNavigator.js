import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MarketScreen from '../screens/MarketScreen';
import LocationSettingScreen from '../screens/LocationSettingScreen';
import MarketWriteScreen from '../screens/MarketWriteScreen';
import MarketDetailScreen from '../screens/MarketDetailScreen';
const Stack = createStackNavigator();

export default function MarketNavigator() {
  return (
    <Stack.Navigator screenOptions={{
      headerShown: false,
      cardStyleInterpolator: ({ current }) => ({
        cardStyle: {
          opacity: current.progress,
        },
      }),
    }}>
      <Stack.Screen name="Market" component={MarketScreen} />
      <Stack.Screen name="LocationSetting" component={LocationSettingScreen} />
      <Stack.Screen name="MarketWrite" component={MarketWriteScreen} />
      <Stack.Screen name="MarketDetail" component={MarketDetailScreen} />
    </Stack.Navigator>
  );
}
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import FridgeScreen from '../screens/FridgeScreen';
import ReceiptCameraScreen from '../screens/ReceiptCameraScreen';
import ReceiptLoadingScreen from '../screens/ReceiptLoadingScreen';
import ReceiptGalleryScreen from '../screens/ReceiptGalleryScreen';
import DirectInputScreen from '../screens/DirectInputScreen';
const Stack = createStackNavigator();

export default function FridgeNavigator() {
  return (
    <Stack.Navigator screenOptions={{
      headerShown: false,
      cardStyleInterpolator: ({ current }) => ({
        cardStyle: {
          opacity: current.progress,
        },
      }),
    }}>
      <Stack.Screen name="Fridge" component={FridgeScreen} />
      <Stack.Screen name="ReceiptCamera" component={ReceiptCameraScreen} />
      <Stack.Screen name="ReceiptLoading" component={ReceiptLoadingScreen} />
      <Stack.Screen name="ReceiptGallery" component={ReceiptGalleryScreen} />
      <Stack.Screen name="DirectInput" component={DirectInputScreen} />
    </Stack.Navigator>
  );
}
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import RecipeScreen from '../screens/RecipeScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import RecipeRecommendScreen from '../screens/RecipeRecommendScreen';
import RecipeResultScreen from '../screens/RecipeResultScreen';

const Stack = createStackNavigator();

export default function RecipeNavigator() {
  return (
    <Stack.Navigator screenOptions={{
      headerShown: false,
      cardStyleInterpolator: ({ current }) => ({
        cardStyle: { opacity: current.progress },
      }),
    }}>
      <Stack.Screen name="RecipeMain" component={RecipeScreen} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
      <Stack.Screen name="RecipeRecommend" component={RecipeRecommendScreen} />
      <Stack.Screen name="RecipeResult" component={RecipeResultScreen} />
    </Stack.Navigator>
  );
}

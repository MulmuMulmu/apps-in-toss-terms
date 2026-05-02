import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FridgeNavigator from './FridgeNavigator';
import MarketNavigator from './MarketNavigator';
import RecipeNavigator from './RecipeNavigator';
import ChatNavigator from './ChatNavigator';
import MyInfoNavigator from './MyInfoNavigator';
import { colors } from '../styles/tossTokens';
import AppAdBanner from '../components/AppAdBanner';


const Tab = createBottomTabNavigator();

function FloatingTabBar(props) {
  return (
    <View pointerEvents="box-none" style={styles.tabShell}>
      <AppAdBanner />
      <BottomTabBar {...props} />
    </View>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.placeholder,
        tabBarStyle: {
          position: 'relative',
          marginHorizontal: 16,
          marginBottom: 12,
          backgroundColor: colors.surfaceRaised,
          borderTopWidth: 0,
          borderRadius: 22,
          height: 66,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
        },
      }}
    >
      <Tab.Screen
        name="내 식자재"
        component={FridgeNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/fridge.png')}
              style={{ width: 24, height: 24, tintColor: focused ? colors.primary : colors.placeholder }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="나눔"
        component={MarketNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/market.png')}
              style={{ width: 24, height: 24, tintColor: focused ? colors.primary : colors.placeholder }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="레시피"
        component={RecipeNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/recipe.png')}
              style={{ width: 24, height: 24, tintColor: focused ? colors.primary : colors.placeholder }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="채팅"
        component={ChatNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/chat.png')}
              style={{ width: 24, height: 24, tintColor: focused ? colors.primary : colors.placeholder }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="내 정보"
        component={MyInfoNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/info.png')}
              style={{ width: 24, height: 24, tintColor: focused ? colors.primary : colors.placeholder }}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabShell: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 0,
  },
});

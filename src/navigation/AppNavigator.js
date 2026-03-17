import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../constants/theme';

import HomeScreen from '../screens/HomeScreen';
import QuoteListScreen from '../screens/quote/QuoteListScreen';
import CreateQuoteScreen from '../screens/quote/CreateQuoteScreen';
import QuotePreviewScreen from '../screens/quote/QuotePreviewScreen';
import InvoiceListScreen from '../screens/invoice/InvoiceListScreen';
import CreateInvoiceScreen from '../screens/invoice/CreateInvoiceScreen';
import InvoicePreviewScreen from '../screens/invoice/InvoicePreviewScreen';
import ClientsScreen from '../screens/ClientsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function QuoteStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="QuoteList" component={QuoteListScreen} />
      <Stack.Screen name="CreateQuote" component={CreateQuoteScreen} />
      <Stack.Screen name="QuotePreview" component={QuotePreviewScreen} />
    </Stack.Navigator>
  );
}

function InvoiceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InvoiceList" component={InvoiceListScreen} />
      <Stack.Screen name="CreateInvoice" component={CreateInvoiceScreen} />
      <Stack.Screen name="InvoicePreview" component={InvoicePreviewScreen} />
    </Stack.Navigator>
  );
}

function TabIcon({ name, focused, label }) {
  return (
    <View style={styles.tabItem}>
      <Ionicons name={name} size={22} color={focused ? colors.accentPurple : colors.textDisabled} />
      <Text
        style={[styles.tabLabel, { color: focused ? colors.accentPurple : colors.textDisabled }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export default function AppNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: [styles.tabBar, { height: 60 + insets.bottom, paddingBottom: insets.bottom }],
          tabBarShowLabel: false,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} label="Home" /> }}
        />
        <Tab.Screen
          name="Quotes"
          component={QuoteStack}
          options={{ tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'document-text' : 'document-text-outline'} focused={focused} label="Quotes" /> }}
        />
        <Tab.Screen
          name="Invoices"
          component={InvoiceStack}
          options={{ tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'receipt' : 'receipt-outline'} focused={focused} label="Invoices" /> }}
        />
        <Tab.Screen
          name="Clients"
          component={ClientsScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'people' : 'people-outline'} focused={focused} label="Clients" /> }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'settings' : 'settings-outline'} focused={focused} label="Settings" /> }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bgCard,
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 8,
    width: 64,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});

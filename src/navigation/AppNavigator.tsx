import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import DashboardScreen from '../screens/DashboardScreen';
import TradesScreen from '../screens/TradesScreen';
import AddTradeScreen from '../screens/AddTradeScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import JournalScreen from '../screens/JournalScreen';
import TradeDetailScreen from '../screens/TradeDetailScreen';
import AddJournalScreen from '../screens/AddJournalScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  TradeDetail: { tradeId: string };
  EditTrade: { tradeId: string };
  AddJournal: { entryId?: string };
};

export type TradesStackParamList = {
  TradesList: undefined;
  TradeDetail: { tradeId: string };
  EditTrade: { tradeId: string };
};

export type JournalStackParamList = {
  JournalList: undefined;
  AddJournal: { entryId?: string };
};

export type TabParamList = {
  Dashboard: undefined;
  Trades: undefined;
  AddTrade: undefined;
  Statistics: undefined;
  Journal: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const TradesStack = createNativeStackNavigator<TradesStackParamList>();
const JournalStack = createNativeStackNavigator<JournalStackParamList>();

function TradesNavigator() {
  return (
    <TradesStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <TradesStack.Screen
        name="TradesList"
        component={TradesScreen}
        options={{ title: 'Trades' }}
      />
      <TradesStack.Screen
        name="TradeDetail"
        component={TradeDetailScreen}
        options={{ title: 'Trade Detail' }}
      />
      <TradesStack.Screen
        name="EditTrade"
        component={AddTradeScreen}
        options={{ title: 'Edit Trade' }}
      />
    </TradesStack.Navigator>
  );
}

function JournalNavigator() {
  return (
    <JournalStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <JournalStack.Screen
        name="JournalList"
        component={JournalScreen}
        options={{ title: 'Journal' }}
      />
      <JournalStack.Screen
        name="AddJournal"
        component={AddJournalScreen}
        options={{ title: 'Journal Entry' }}
      />
    </JournalStack.Navigator>
  );
}

function AddTabIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={styles.addButton}>
      <Ionicons name="add" size={28} color={colors.white} />
    </View>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Trades"
          component={TradesNavigator}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="AddTrade"
          component={AddTradeScreen}
          options={{
            title: 'Add',
            tabBarIcon: ({ color, size }) => <AddTabIcon color={color} size={size} />,
            headerShown: true,
            headerTitle: 'Add Trade',
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '700' },
          }}
        />
        <Tab.Screen
          name="Statistics"
          component={StatisticsScreen}
          options={{
            headerShown: true,
            headerTitle: 'Statistics',
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '700' },
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bar-chart" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Journal"
          component={JournalNavigator}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="book" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});

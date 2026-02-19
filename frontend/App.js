import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, StyleSheet } from 'react-native';

import LoginScreen from './screens/LoginScreen';
import AdminDashboard from './screens/AdminDashboard';
import ManageClasses from './screens/ManageClasses';
import ManageFaculty from './screens/ManageFaculty';
import TeacherHome from './screens/TeacherHome';
import ClassChat from './screens/ClassChat';
import ClassDashboard from './screens/ClassDashboard';
import SubjectDashboard from './screens/SubjectDashboard';
import Stats from './screens/Stats';
import Profile from './screens/Profile';

import Header from './components/Header';
import BottomNav from './components/BottomNav';

import { AuthProvider } from './context/AuthContext';

const Stack = createStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <View style={{ flex: 1 }}>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
              header: () => <Header />
            }}
          >
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ header: () => null }}
            />
            <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
            <Stack.Screen name="ManageClasses" component={ManageClasses} />
            <Stack.Screen name="ManageFaculty" component={ManageFaculty} />
            <Stack.Screen name="TeacherHome" component={TeacherHome} />
            <Stack.Screen name="ClassChat" component={ClassChat} />
            <Stack.Screen name="ClassDashboard" component={ClassDashboard} />
            <Stack.Screen name="SubjectDashboard" component={SubjectDashboard} />
            <Stack.Screen name="Stats" component={Stats} />
            <Stack.Screen name="Profile" component={Profile} />
          </Stack.Navigator>
        </View>
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({});

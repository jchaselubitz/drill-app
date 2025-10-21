import React from 'react';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from '@/navigation/RootNavigator';
import { AppProvider } from '@/AppProvider';

const App: React.FC = () => {
  return (
    <AppProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </AppProvider>
  );
};

export default App;

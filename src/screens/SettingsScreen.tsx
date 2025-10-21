import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const SettingsScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Settings</Text>
      <View style={styles.card}>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.description}>
          Authentication, account linking, and profile management are handled through Supabase Auth.
          Use this screen to surface profile settings once the flows are connected.
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>AI provider</Text>
        <Text style={styles.description}>
          Users will be able to select between OpenAI and Google via a Supabase function-backed
          toggle. Wire this to a remote config value when the API integration is ready.
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>Frequency defaults</Text>
        <Text style={styles.description}>
          Configure default presentation frequency for new vocabulary or grammar items. Persist this
          preference in the user profile table and rehydrate it on sign-in.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6'
  },
  content: {
    padding: 16,
    gap: 16
  },
  heading: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827'
  },
  description: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22
  }
});

export default SettingsScreen;

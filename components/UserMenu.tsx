import { useAuth } from '@/context/AuthContext';
import { colors, spacing, typography } from '@/theme/colors';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import UserButton from './UserButton';

interface UserMenuProps {
  size?: number;
}

const UserMenu: React.FC<UserMenuProps> = ({ size = 40 }) => {
  const { session, signOut } = useAuth();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [buttonLayout, setButtonLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/login');
          } catch (error) {
            console.error('Error signing out:', error);
          }
        },
      },
    ]);
  };

  const menuItems = [
    {
      id: 'settings',
      title: 'Settings',
      onPress: () => {
        setIsMenuVisible(false);
        router.push('/settings');
      },
    },
    {
      id: 'feedback',
      title: 'Feedback',
      onPress: () => {
        setIsMenuVisible(false);
        // TODO: Implement feedback navigation
        console.log('Feedback pressed');
      },
    },
  ];

  const handleButtonPress = () => {
    setIsMenuVisible(true);
  };

  const handleButtonLayout = (event: any) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setButtonLayout({ x, y, width, height });
  };

  return (
    <>
      <View onLayout={handleButtonLayout}>
        <UserButton size={size} onPress={handleButtonPress} />
      </View>
      <Modal
        visible={isMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setIsMenuVisible(false)}>
          <View
            style={[
              styles.menuContainer,
              { top: buttonLayout.y + buttonLayout.height + 8, right: 0 },
            ]}
          >
            <View style={styles.menu}>
              <View style={styles.userInfo}>
                <Text style={styles.userEmail}>{session?.user?.email}</Text>
              </View>
              <View style={styles.separator} />
              {menuItems.map((item) => (
                <TouchableOpacity key={item.id} style={styles.menuItem} onPress={item.onPress}>
                  <Text style={styles.menuItemText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
              <View style={styles.separator} />
              <TouchableOpacity
                style={[styles.menuItem, styles.signOutItem]}
                onPress={handleSignOut}
              >
                <Text style={styles.signOutText}>Log out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menuContainer: {
    position: 'absolute',
    right: spacing.lg,
    alignItems: 'flex-end',
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userInfo: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  userEmail: {
    color: colors.textPrimary,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  menuItem: {
    padding: spacing.md,
    paddingVertical: spacing.sm,
  },
  menuItemText: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '500',
  },
  signOutItem: {
    // Additional styling for sign out if needed
  },
  signOutText: {
    color: colors.error,
    fontSize: typography.body,
    fontWeight: '500',
  },
});

export default UserMenu;

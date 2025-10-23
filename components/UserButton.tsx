import { useAuth } from '@/context/AuthContext';
import { colors, spacing } from '@/theme/colors';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface UserButtonProps {
  onPress?: () => void;
  size?: number;
}

const UserButton: React.FC<UserButtonProps> = ({ onPress, size = 40 }) => {
  const { session } = useAuth();

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={[styles.userImage, { width: size, height: size, borderRadius: size * 0.3 }]}>
        {session?.user?.user_metadata?.avatar_url ? (
          <Image
            source={{ uri: session.user.user_metadata.avatar_url }}
            style={[styles.userImage, { width: size, height: size, borderRadius: size * 0.3 }]}
            resizeMode="cover"
          />
        ) : (
          <Text style={[styles.userInitial, { fontSize: size * 0.4 }]}>
            {session?.user?.email?.charAt(0).toUpperCase() || 'U'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xs,
  },
  userImage: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitial: {
    color: colors.background,
    fontWeight: '700',
  },
});

export default UserButton;

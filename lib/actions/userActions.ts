import { supabase } from '@/lib/supabaseClient';

export const signIn = async ({ email, password }: { email: string; password: string }) => {
  if (!email || !password) {
    throw Error('/login?message=Missing required fields');
  }
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    console.error(error);
    throw `Could not sign in: ${error.message}`;
  }
  console.log('signIn success');
  return true;
};

export const signUp = async ({
  email,
  password,
  name,
  token,
  inviteEmail,
}: {
  email: string;
  password: string;
  name: string;
  token: string | null | undefined;
  inviteEmail?: string;
}) => {
  if (!inviteEmail && !email) {
    throw Error('/login?message=Missing required fields');
  }
  const { error, data } = await supabase.auth.signUp({
    email: inviteEmail ?? (email as string),
    password,
    options: {
      data: {
        name,
        has_password: true,
      },
    },
  });

  if (error) {
    console.log(error);
    if (error.message.includes('already exists')) {
      throw Error(`Email already in use${token ? '&code=' + token : ''}`);
    }
    if (error.message.includes('Password should contain at least one character')) {
      throw Error(`Password should contain at least one letter and one number`);
    }
    throw Error(`Could not authenticate user${token ? '&code=' + token : ''}`);
  }
};

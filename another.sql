create table public.profiles (
  id uuid not null,
  username text null,
  full_name text null,
  avatar_url text null,
  bio text null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  rank integer not null,
  cover_url text null,
  gender text null,
  cover_is_video boolean null default false,
  constraint profiles_pkey primary key (id),
  constraint profiles_username_key unique (username),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists profiles_username_idx on public.profiles using btree (username) TABLESPACE pg_default;

create index IF not exists profiles_rank_idx on public.profiles using btree (rank) TABLESPACE pg_default;

create index IF not exists profiles_gender_idx on public.profiles using btree (gender) TABLESPACE pg_default;

create trigger assign_rank_on_insert BEFORE INSERT on profiles for EACH row
execute FUNCTION assign_user_rank ();

create trigger prevent_verified_username_change BEFORE
update on profiles for EACH row
execute FUNCTION prevent_username_change_if_verified ();

create trigger trg_profiles_propagate_rank_to_stories
after
update OF rank on profiles for EACH row
execute FUNCTION profiles_propagate_rank_to_stories ();








Policy Name
Authenticated users can read profiles (with blocking)
Table

on clause


public.profiles
Policy Behavior

as clause

permissive
Policy Command

for clause


SELECT
Target Roles

to clause

authenticated
Use options above to edit


alter policy "Authenticated users can read profiles (with blocking)"


on "public"."profiles"


to authenticated


using (

 (NOT (EXISTS ( SELECT 1
   FROM blocked_users
  WHERE (((blocked_users.blocker_id = auth.uid()) AND (blocked_users.blocked_id = profiles.id)) OR ((blocked_users.blocked_id = auth.uid()) AND (blocked_users.blocker_id = profiles.id))))))

);







Policy Name
Users can delete their own profile
Table

on clause


public.profiles
Policy Behavior

as clause

permissive
Policy Command

for clause



DELETE


Target Roles

to clause

authenticated
Use options above to edit


alter policy "Users can delete their own profile"


on "public"."profiles"


to authenticated


using (

7
  (auth.uid() = id)

);





Policy Name
Users can insert their own profile
Table

on clause


public.profiles
Policy Behavior

as clause

permissive
Policy Command

for clause



INSERT



ALL
Target Roles

to clause

authenticated
Use options above to edit


alter policy "Users can insert their own profile"


on "public"."profiles"


to authenticated


with check (


  (auth.uid() = id)

);





Policy Name
Users can update their own profile
Table

on clause


public.profiles
Policy Behavior

as clause

permissive
Policy Command

for clause



UPDATE




Target Roles

to clause

authenticated
Use options above to edit


alter policy "Users can update their own profile"


on "public"."profiles"


to authenticated


using (


  (auth.uid() = id)

with check (

  (auth.uid() = id)
);


import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const SignupScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !username) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const lowerEmail = email.trim().toLowerCase();
    if (!lowerEmail.endsWith('@gmail.com') && !lowerEmail.endsWith('@hotmail.com')) {
      Alert.alert('Error', 'Only Gmail or Hotmail addresses are allowed');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: lowerEmail,
        password: password.trim(),
        options: {
          data: { username: username.trim() },
        },
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      if (data.user) {
        Alert.alert(
          '✨ Almost There!',
          'We sent you a premium verification code. Please check your email and enter the code to unlock your exclusive Flexx experience.'
        );
        navigation.navigate('OTPVerification', { email: lowerEmail });
      } else {
        Alert.alert('Error', 'An unexpected error occurred during sign-up.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 10 : 50 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <LinearGradient
            colors={['rgba(255, 215, 0, 0.1)', 'rgba(255, 215, 0, 0.05)']}
            style={styles.backButtonGradient}
          >
            <Ionicons name="arrow-back" size={24} color="#ffd700" />
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={['#ffd700', '#ffb300', '#ff8f00']}
            style={styles.logoGradient}
          >
            <Text style={styles.logo}>✨ Join Flexx</Text>
          </LinearGradient>
          <Text style={styles.subtitle}>Premium Social Experience Awaits</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#ffd700" style={styles.inputIcon} />
            <TextInput 
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#ffd700" style={styles.inputIcon} />
            <TextInput 
              style={styles.input}
              placeholder="Email (Gmail or Hotmail only)"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#ffd700" style={styles.inputIcon} />
            <TextInput 
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity 
            style={[styles.signupButton, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            <LinearGradient
              colors={['#ffd700', '#ffb300', '#ff8f00']}
              style={styles.buttonGradient}
            >
              <Text style={styles.signupButtonText}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Text>
              {!loading && <Ionicons name="sparkles" size={20} color="#1a1a2e" style={styles.buttonIcon} />}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ paddingBottom: insets.bottom }} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingBottom: 20 
  },
  backButton: { 
    borderRadius: 12,
    overflow: 'hidden',
  },
  backButtonGradient: {
    padding: 12,
    borderRadius: 12,
  },
  headerTitle: { 
    color: '#ffd700', 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginLeft: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  content: { 
    flex: 1, 
    padding: 24, 
    justifyContent: 'center' 
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoGradient: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 22,
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a2e',
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
  },
  signupButton: {
    borderRadius: 16,
    marginTop: 20,
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
  },
  buttonDisabled: { opacity: 0.7 },
  signupButtonText: { 
    color: '#1a1a2e', 
    fontSize: 18, 
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  buttonIcon: {
    marginLeft: 8,
  },
});

export default SignupScreen;

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const OTPVerificationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const { email } = route.params;

  const handleVerify = async () => {
    if (!token) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email,
        token: token.trim(),
        type: 'signup',
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      Alert.alert(
        'Success',
        'Your email has been verified! You can now log in.'
      );
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : 50 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#3399ff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify Account</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.infoText}>
          An email with a verification code has been sent to {email}.
        </Text>
        <TextInput 
          style={styles.input}
          placeholder="Enter verification code"
          placeholderTextColor="#666666"
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          keyboardType="number-pad"
        />
        <TouchableOpacity 
          style={[styles.verifyButton, loading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          <Text style={styles.verifyButtonText}>
            {loading ? 'Verifying...' : 'Verify'}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={{ paddingBottom: insets.bottom }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000033' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingBottom: 15 },
  backButton: { padding: 5 },
  headerTitle: { color: '#3399ff', fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  infoText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#000066',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#3399ff',
    textAlign: 'center',
    fontSize: 18,
  },
  verifyButton: {
    backgroundColor: '#3399ff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: { opacity: 0.7 },
  verifyButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default OTPVerificationScreen;


import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LoginScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [identifier, setIdentifier] = useState(''); // email or username
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const resolveEmailFromIdentifier = async (raw) => {
    const id = raw.trim().toLowerCase();
    if (id.includes('@')) return id; // looks like an email, use directly

    // Otherwise, map username -> email via your RPC
    const { data: resolvedEmail, error } = await supabase.rpc(
      'get_user_by_email_or_username',
      { identifier: id }
    );
    if (error) throw error;
    if (!resolvedEmail) throw new Error('User not found');
    return resolvedEmail;
  };

  const ensureProfileExists = async (user) => {
    // Check if a profile already exists
    const { data: existing, error: selectErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (selectErr) throw selectErr;

    if (!existing) {
      // Insert minimal profile data; your DB trigger will set rank
      const usernameFromMeta = user.user_metadata?.username ?? null;

      const { error: insertErr } = await supabase.from('profiles').insert({
        id: user.id,
        username: usernameFromMeta,
        // no rank here; let BEFORE INSERT trigger assign_rank_on_insert handle it
      });

      // Ignore unique violation (if a race created it)
      // @ts-ignore (RN env: insertErr may have code)
      if (insertErr && insertErr.code !== '23505') {
        throw insertErr;
      }
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);

      if (!identifier || !password) {
        throw new Error('Please enter your email/username and password.');
      }

      const emailToUse = await resolveEmailFromIdentifier(identifier);

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: password,
      });
      if (signInError) throw signInError;

      const user = signInData?.user;
      if (!user) throw new Error('Login failed. Please try again.');

      const isConfirmed = !!(user.email_confirmed_at || user.confirmed_at);
      if (!isConfirmed) {
        // Optional: sign out to avoid any partial sessions
        await supabase.auth.signOut();
        throw new Error('Please verify your email before logging in.');
      }

      // Create profile only AFTER verification & successful login
      await ensureProfileExists(user);

      navigation.replace('MainApp');
    } catch (error) {
      Alert.alert('Login Error', error.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      <View style={styles.logoContainer}>
        <LinearGradient
          colors={['#ffd700', '#ffb300', '#ff8f00']}
          style={styles.logoGradient}
        >
          <Text style={styles.logo}>✨ Flexx</Text>
        </LinearGradient>
        <Text style={styles.subtitle}>Premium Social Experience</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#ffd700" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email or Username"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#ffd700" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          <LinearGradient
            colors={['#ffd700', '#ffb300', '#ff8f00']}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Logging in...' : 'Login'}
            </Text>
            {!loading && <Ionicons name="arrow-forward" size={20} color="#1a1a2e" style={styles.buttonIcon} />}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signupButton} onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <Text style={styles.signupTextBold}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 24, 
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  logo: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#1a1a2e',
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    padding: 18,
    color: 'white',
    fontSize: 16,
  },
  button: {
    borderRadius: 16,
    marginTop: 12,
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
  },
  buttonText: { 
    color: '#1a1a2e', 
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  signupButton: { 
    marginTop: 32, 
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: { 
    color: 'rgba(255, 255, 255, 0.7)', 
    fontSize: 16,
  },
  signupTextBold: {
    color: '#ffd700',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginScreen;

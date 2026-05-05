import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { DriverStackParamList } from '../navigation/DriverNavigator';
import { requestOtp, verifyOtp } from '../services/api';

type Props = { navigation: StackNavigationProp<DriverStackParamList, 'Login'> };

export function LoginScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const animateIn = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  };

  const handleSendOtp = async () => {
    const trimmed = phone.trim();
    if (!trimmed) { setError('Please enter your phone number'); return; }
    setLoading(true);
    setError('');
    try {
      await requestOtp(trimmed);
      setStep('otp');
      animateIn();
    } catch (e) {
      setError((e as Error).message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length < 6) { setError('Enter the 6-digit OTP'); return; }
    setLoading(true);
    setError('');
    try {
      const token = await verifyOtp(phone.trim(), otp.trim());
      navigation.replace('Home', { token });
    } catch (e) {
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      <LinearGradient colors={['#020617', '#0f172a', '#1e1b4b']} style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28 }}>
          {/* Logo area */}
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={{ alignItems: 'center', marginBottom: 48 }}>
              <View style={{
                width: 80, height: 80, borderRadius: 24,
                backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center',
                shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20,
                elevation: 12, marginBottom: 20,
              }}>
                <Text style={{ fontSize: 36 }}>🚌</Text>
              </View>
              <Text style={{ fontSize: 28, fontWeight: '800', color: '#F8FAFC', letterSpacing: -0.5 }}>
                Driver Portal
              </Text>
              <Text style={{ fontSize: 14, color: '#94A3B8', marginTop: 6 }}>
                School Bus Tracking System
              </Text>
            </View>

            {/* Card */}
            <View style={{
              backgroundColor: '#0F172A',
              borderRadius: 24,
              padding: 24,
              borderWidth: 1,
              borderColor: '#1E293B',
            }}>
              <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '600', marginBottom: 6, letterSpacing: 0.8 }}>
                {step === 'phone' ? 'PHONE NUMBER' : 'VERIFICATION CODE'}
              </Text>

              {step === 'phone' ? (
                <>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+1 000 000 0003"
                    placeholderTextColor="#475569"
                    keyboardType="phone-pad"
                    style={{
                      backgroundColor: '#1E293B', color: '#F8FAFC', borderRadius: 14,
                      paddingHorizontal: 18, paddingVertical: 16, fontSize: 18, fontWeight: '600',
                      borderWidth: 1, borderColor: '#334155', marginBottom: 16,
                    }}
                    autoFocus
                  />
                  <TouchableOpacity
                    onPress={handleSendOtp}
                    disabled={loading}
                    style={{
                      backgroundColor: '#3B82F6', borderRadius: 14, paddingVertical: 16,
                      alignItems: 'center', opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Send OTP →</Text>}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={{ color: '#64748B', fontSize: 13, marginBottom: 12 }}>
                    OTP sent to {phone}
                  </Text>
                  <TextInput
                    value={otp}
                    onChangeText={setOtp}
                    placeholder="123456"
                    placeholderTextColor="#475569"
                    keyboardType="number-pad"
                    maxLength={6}
                    style={{
                      backgroundColor: '#1E293B', color: '#F8FAFC', borderRadius: 14,
                      paddingHorizontal: 18, paddingVertical: 16, fontSize: 24, fontWeight: '800',
                      borderWidth: 1, borderColor: '#334155', marginBottom: 16, letterSpacing: 8,
                      textAlign: 'center',
                    }}
                    autoFocus
                  />
                  <TouchableOpacity
                    onPress={handleVerifyOtp}
                    disabled={loading}
                    style={{
                      backgroundColor: '#3B82F6', borderRadius: 14, paddingVertical: 16,
                      alignItems: 'center', opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Verify & Sign In</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setStep('phone'); setOtp(''); setError(''); }} style={{ marginTop: 14, alignItems: 'center' }}>
                    <Text style={{ color: '#64748B', fontSize: 14 }}>← Change number</Text>
                  </TouchableOpacity>
                </>
              )}

              {error ? (
                <Text style={{ color: '#F87171', fontSize: 13, marginTop: 12, textAlign: 'center' }}>{error}</Text>
              ) : null}
            </View>

            <Text style={{ color: '#334155', fontSize: 12, textAlign: 'center', marginTop: 32 }}>
              🔒 Secure · End-to-End Encrypted
            </Text>
          </Animated.View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

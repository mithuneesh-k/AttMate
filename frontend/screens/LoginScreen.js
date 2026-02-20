import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, GLOBAL_STYLES } from '../styles/theme';

import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
    const navigation = useNavigation();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState('teacher');

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }
        setLoading(true);

        try {
            // Await the asynchronous login
            const result = await login(email, password, role);

            setLoading(false);
            if (result.success) {
                if (result.role === 'admin') {
                    navigation.replace('AdminDashboard');
                } else {
                    navigation.replace('TeacherHome');
                }
            } else {
                Alert.alert('Login Failed', result.message);
            }
        } catch (error) {
            setLoading(false);
            Alert.alert('Error', 'Caught an unexpected error during login.');
            console.error(error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <View style={styles.content}>
                    {/* Immersive Brand Section */}
                    <View style={styles.brandSection}>
                        <View style={styles.logo}>
                            <View style={styles.logoInner} />
                        </View>
                        <Text style={styles.brandTitle}>AttMate</Text>
                        <Text style={styles.brandTagline}>Classroom management, redefined.</Text>
                    </View>

                    <View style={GLOBAL_STYLES.card}>
                        <Text style={styles.loginTitle}>Welcome Back</Text>
                        <Text style={styles.loginSubtitle}>Login to manage your class attendance.</Text>

                        {/* Role Selector */}
                        <View style={styles.roleContainer}>
                            <TouchableOpacity
                                style={[styles.roleBtn, role === 'teacher' && styles.roleBtnActive]}
                                onPress={() => setRole('teacher')}
                            >
                                <Text style={[styles.roleBtnText, role === 'teacher' && styles.roleBtnTextActive]}>Teacher</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.roleBtn, role === 'admin' && styles.roleBtnActive]}
                                onPress={() => setRole('admin')}
                            >
                                <Text style={[styles.roleBtnText, role === 'admin' && styles.roleBtnTextActive]}>Admin</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={GLOBAL_STYLES.input}
                            placeholder="name@college.edu"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />

                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={GLOBAL_STYLES.input}
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <TouchableOpacity
                            style={[GLOBAL_STYLES.btnPrimary, { marginTop: 10 }]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={GLOBAL_STYLES.btnText}>Sign In</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.forgotBtn}>
                            <Text style={styles.forgotText}>Forgot password?</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => Alert.alert('Demo Mode', 'Contact admin to create an account.')}>
                            <Text style={styles.linkText}>Get Started</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.accentDeep },
    flex: { flex: 1 },
    content: { flex: 1, padding: 24, justifyContent: 'center' },
    brandSection: { alignItems: 'center', marginBottom: 40 },
    logo: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
    },
    logoInner: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#fff' },
    brandTitle: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -1 },
    brandTagline: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', fontWeight: '500' },

    loginTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
    loginSubtitle: { fontSize: 13, color: COLORS.muted, marginBottom: 24 },

    roleContainer: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        padding: 4,
        borderRadius: 14,
        marginBottom: 20
    },
    roleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    roleBtnActive: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    roleBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.muted },
    roleBtnTextActive: { color: COLORS.accentDeep },

    label: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 6, marginLeft: 2 },
    forgotBtn: { alignSelf: 'center', marginTop: 16 },
    forgotText: { color: COLORS.muted, fontSize: 14 },

    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
    footerText: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 14 },
    linkText: { color: '#fff', fontWeight: '700', fontSize: 14 }
});

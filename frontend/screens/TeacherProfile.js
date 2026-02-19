import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function TeacherProfile() {
    const [user, setUser] = useState(null);
    const navigation = useNavigation();

    useEffect(() => {
        const getUser = async () => {
            const u = await AsyncStorage.getItem('user');
            if (u) setUser(JSON.parse(u));
        };
        getUser();
    }, []);

    const logout = async () => {
        await AsyncStorage.clear();
        navigation.replace('Login');
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <View style={styles.avatar} />
                <Text style={styles.email}>{user?.email}</Text>
                <Text style={styles.role}>{user?.role?.toUpperCase()}</Text>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.btnLogout} onPress={logout}>
                    <Text style={styles.btnText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc', padding: 20, justifyContent: 'center' },
    card: { backgroundColor: '#fff', padding: 30, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, elevation: 5 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#22c55e', marginBottom: 16 },
    email: { fontSize: 18, fontWeight: 'bold' },
    role: { fontSize: 14, color: '#6b7280', marginTop: 4 },
    divider: { width: '100%', height: 1, backgroundColor: '#e5e7eb', my: 20 },
    btnLogout: { backgroundColor: '#ef4444', padding: 16, borderRadius: 12, width: '100%', alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: 'bold' }
});

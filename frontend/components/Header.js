import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, GLOBAL_STYLES } from '../styles/theme';
import { useAuth } from '../context/AuthContext';

export default function Header() {
    const navigation = useNavigation();
    const route = useRoute();
    const { user, logout } = useAuth();

    const isActive = (tabName) => {
        if (tabName === 'Home') {
            return route.name === 'TeacherHome' || route.name === 'AdminDashboard' || route.name === 'ManageClasses' || route.name === 'ManageFaculty';
        }
        if (tabName === 'Dashboard') {
            return route.name === 'ClassDashboard' || route.name === 'SubjectDashboard';
        }
        if (tabName === 'Profile') {
            return route.name === 'Profile';
        }
        return false;
    };

    const handleNav = (target) => {
        if (target === 'Home') {
            navigation.navigate(user?.role === 'admin' ? 'AdminDashboard' : 'TeacherHome');
        } else {
            navigation.navigate(target);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <View style={styles.topRow}>
                    <View style={styles.brand}>
                        <View style={styles.logo}>
                            <View style={styles.logoInner} />
                        </View>
                        <Text style={styles.brandText}>AttMate</Text>
                    </View>
                    <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.tabContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={[styles.tabScroll, GLOBAL_STYLES.webScroll]}
                    >
                        <TouchableOpacity
                            style={[styles.tabBtn, isActive('Home') && styles.tabBtnActive]}
                            onPress={() => handleNav('Home')}
                        >
                            <Text style={[styles.tabBtnText, isActive('Home') && styles.tabBtnTextActive]}>Home</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.tabBtn, isActive('Dashboard') && styles.tabBtnActive]}
                            onPress={() => handleNav('ClassDashboard')}
                        >
                            <Text style={[styles.tabBtnText, isActive('Dashboard') && styles.tabBtnTextActive]}>Dashboard</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.tabBtn, isActive('Profile') && styles.tabBtnActive]}
                            onPress={() => handleNav('Profile')}
                        >
                            <Text style={[styles.tabBtnText, isActive('Profile') && styles.tabBtnTextActive]}>Profile</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { backgroundColor: COLORS.accentDeep },
    header: {
        backgroundColor: COLORS.accentDeep,
        paddingBottom: 4,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    logoutBtn: { backgroundColor: 'rgba(255, 255, 255, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    logoutText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    logo: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoInner: {
        width: 18,
        height: 18,
        borderRadius: 4,
        backgroundColor: '#fff',
    },
    brandText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -0.5,
    },
    tabContainer: {
        paddingVertical: 8,
    },
    tabScroll: {
        paddingHorizontal: 20,
        gap: 10,
    },
    tabBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    tabBtnActive: { backgroundColor: '#fff' },
    tabBtnText: { color: 'rgba(255, 255, 255, 0.9)', fontSize: 13, fontWeight: '600' },
    tabBtnTextActive: { color: COLORS.accentDeep, fontWeight: '700' }
});

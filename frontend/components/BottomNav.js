import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../styles/theme';

export default function BottomNav() {
    const navigation = useNavigation();
    const route = useRoute();

    const tabs = [
        { name: 'Chat', route: 'TeacherHome', icon: '💬' },
        { name: 'My Class', route: 'ClassDashboard', icon: '📊' },
        { name: 'Profile', route: 'Profile', icon: '👤' },
    ];

    const isActive = (routeName) => route.name === routeName;

    return (
        <SafeAreaView edges={['bottom']} style={{ backgroundColor: '#fff' }}>
            <View style={styles.container}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.name}
                        style={[styles.navItem, isActive(tab.route) && styles.navItemActive]}
                        onPress={() => navigation.navigate(tab.route)}
                    >
                        <Text style={[styles.navIcon, isActive(tab.route) && styles.navTextActive]}>{tab.icon}</Text>
                        <Text style={[styles.navText, isActive(tab.route) && styles.navTextActive]}>{tab.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingVertical: 8,
        paddingHorizontal: 6,
    },
    navItem: {
        alignItems: 'center',
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    navItemActive: { backgroundColor: 'rgba(79, 70, 229, 0.08)' },
    navIcon: { fontSize: 16, color: COLORS.muted },
    navText: { fontSize: 12, color: COLORS.muted },
    navTextActive: { color: COLORS.accent, fontWeight: '600' },
});

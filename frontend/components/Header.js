import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../styles/theme';

export default function Header() {
    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <View style={styles.topRow}>
                    <View style={styles.brand}>
                        <View style={styles.logo}>
                            <View style={styles.logoInner} />
                        </View>
                        <Text style={styles.brandText}>AttMate</Text>
                    </View>
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
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, GLOBAL_STYLES } from '../styles/theme';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
    const navigation = useNavigation();
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.header}>
                    <View style={[styles.avatarContainer, { backgroundColor: user.avatarColor || '#16a34a' }]}>
                        <Text style={styles.avatarLetter}>{user.name?.charAt(0)}</Text>
                        <TouchableOpacity style={styles.editAvatarBtn}>
                            <Text style={styles.editIcon}>✎</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>{user.role === 'admin' ? 'Administrator' : 'Faculty'}</Text>
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <View style={[GLOBAL_STYLES.card, styles.statMiniCard]}>
                        <Text style={styles.statNumber}>{user.role === 'admin' ? 'Active' : (user.subjects?.length || '—')}</Text>
                        <Text style={styles.statLabel}>{user.role === 'admin' ? 'Admin' : 'Subjects'}</Text>
                    </View>
                    <View style={[GLOBAL_STYLES.card, styles.statMiniCard]}>
                        <Text style={styles.statNumber}>—</Text>
                        <Text style={styles.statLabel}>Classes</Text>
                    </View>
                    <View style={[GLOBAL_STYLES.card, styles.statMiniCard]}>
                        <Text style={styles.statNumber}>—</Text>
                        <Text style={styles.statLabel}>Avg. Att.</Text>
                    </View>
                </View>


                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Settings</Text>
                    <TouchableOpacity style={[GLOBAL_STYLES.card, styles.menuItem]}>
                        <View style={styles.menuIconArea}>
                            <Text style={styles.menuIcon}>🔔</Text>
                        </View>
                        <Text style={styles.menuText}>Notifications</Text>
                        <Text style={styles.chevron}>➔</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[GLOBAL_STYLES.card, styles.menuItem]}>
                        <View style={styles.menuIconArea}>
                            <Text style={styles.menuIcon}>🛡️</Text>
                        </View>
                        <Text style={styles.menuText}>Security & Privacy</Text>
                        <Text style={styles.chevron}>➔</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[GLOBAL_STYLES.card, styles.menuItem]}>
                        <View style={styles.menuIconArea}>
                            <Text style={styles.menuIcon}>🔑</Text>
                        </View>
                        <Text style={styles.menuText}>Change Password</Text>
                        <Text style={styles.chevron}>➔</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[GLOBAL_STYLES.card, styles.menuItem]}
                        onPress={() => {
                            logout();
                            navigation.replace('Login');
                        }}
                    >
                        <View style={[styles.menuIconArea, { backgroundColor: '#fff1f2' }]}>
                            <Text style={styles.menuIcon}>🚪</Text>
                        </View>
                        <Text style={[styles.menuText, { color: '#e11d48' }]}>Logout</Text>
                        <Text style={styles.chevron}>➔</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', height: '100%' },
    scrollContent: { flexGrow: 1 },
    header: { alignItems: 'center', paddingVertical: 40, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    avatarContainer: { width: 100, height: 100, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    logoutBtn: { backgroundColor: 'rgba(255, 255, 255, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    logoutText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    tabBtnText: { color: 'rgba(255, 255, 255, 0.9)', fontSize: 13, fontWeight: '600' },
    editAvatarBtn: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#fff', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
    editIcon: { fontSize: 14, color: COLORS.text },
    userName: { fontSize: 24, fontWeight: '800', color: COLORS.text },
    userEmail: { fontSize: 14, color: COLORS.muted, marginTop: 4 },
    roleBadge: { backgroundColor: COLORS.mint, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 12 },
    roleText: { color: COLORS.accentDeep, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },

    statsRow: { flexDirection: 'row', paddingHorizontal: 20, justifyContent: 'space-between', marginTop: -25 },
    statMiniCard: { width: '31%', padding: 12, alignItems: 'center' },
    statNumber: { fontSize: 18, fontWeight: '800', color: COLORS.text },
    statLabel: { fontSize: 10, color: COLORS.muted, marginTop: 2, fontWeight: '600' },

    section: { paddingHorizontal: 24, marginTop: 32 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 16 },

    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 12 },
    menuIconArea: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    menuIcon: { fontSize: 18 },
    menuText: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },
    chevron: { color: COLORS.border, fontSize: 14, fontWeight: '700' }
});

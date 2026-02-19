import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, GLOBAL_STYLES } from '../styles/theme';
import api from '../api';

export default function AdminDashboard() {
    const navigation = useNavigation();
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/admin/stats');
                const data = response.data;
                // Transform API data to dashboard format
                const formattedStats = [
                    { label: 'Total classes', value: data.total_classes },
                    { label: 'Total faculty', value: data.total_faculty },
                    { label: 'Total students', value: data.total_students },
                ];
                setStats(formattedStats);
            } catch (error) {
                console.error('Failed to fetch admin stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Mapping icons to stats for scannability
    const icons = ['🏫', '👨‍🏫', '🎓'];

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={COLORS.accent} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <Text style={GLOBAL_STYLES.title}>Admin Panel</Text>
                <Text style={GLOBAL_STYLES.subtitle}>Overview of institution departments and classes.</Text>
            </View>

            <View style={styles.statsGrid}>
                {stats.map((stat, index) => (
                    <View key={index} style={[GLOBAL_STYLES.card, styles.statCard]}>
                        <View style={styles.iconCircle}>
                            <Text style={styles.iconText}>{icons[index] || '📊'}</Text>
                        </View>
                        <Text style={styles.statValue}>{stat.value}</Text>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>

                <TouchableOpacity
                    style={[GLOBAL_STYLES.card, styles.actionCard]}
                    onPress={() => navigation.navigate('ManageClasses')}
                    activeOpacity={0.8}
                >
                    <View style={styles.actionIcon}>
                        <Text style={styles.actionIconText}>📚</Text>
                    </View>
                    <View>
                        <Text style={styles.actionTitle}>Manage Classes</Text>
                        <Text style={styles.actionSubtitle}>Add, remove, or edit class subjects.</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[GLOBAL_STYLES.card, styles.actionCard]}
                    onPress={() => navigation.navigate('ManageFaculty')}
                    activeOpacity={0.8}
                >
                    <View style={styles.actionIcon}>
                        <Text style={styles.actionIconText}>💼</Text>
                    </View>
                    <View>
                        <Text style={styles.actionTitle}>Faculty Management</Text>
                        <Text style={styles.actionSubtitle}>Assign professors to core subjects.</Text>
                    </View>
                </TouchableOpacity>
            </View>
            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { padding: 24, paddingBottom: 0 },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        justifyContent: 'space-between'
    },
    statCard: {
        width: '48%',
        marginBottom: 16,
        alignItems: 'center',
        paddingVertical: 24,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.accentSoft,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconText: { fontSize: 22 },
    statValue: { fontSize: 22, fontWeight: '800', color: COLORS.text },
    statLabel: { fontSize: 12, color: COLORS.muted, marginTop: 2, fontWeight: '600' },

    section: { paddingHorizontal: 24, marginTop: 8 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        padding: 16,
    },
    actionIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    actionIconText: { fontSize: 20 },
    actionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
    actionSubtitle: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
});

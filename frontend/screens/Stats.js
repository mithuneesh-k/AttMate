import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, GLOBAL_STYLES } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Stats() {
    const navigation = useNavigation();
    const route = useRoute();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ overall: 0, subjects: [] });

    const { classId, className } = route.params || {};

    useEffect(() => {
        if (classId) {
            fetchStats();
        } else {
            setLoading(false);
        }
    }, [classId]);

    const fetchStats = async () => {
        try {
            const response = await api.get(`/teacher/class-stats/${classId}`);
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch class stats for stats screen:', error);
        } finally {
            setLoading(false);
        }
    };

    const subjects = stats.subjects;

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.header}>
                    <Text style={GLOBAL_STYLES.title}>{className} Stats</Text>
                    <Text style={GLOBAL_STYLES.subtitle}>Performance analysis for your handled subjects</Text>
                </View>

                <View style={[GLOBAL_STYLES.card, styles.overallCard]}>
                    <View style={styles.overallInfo}>
                        <View>
                            <Text style={styles.overallLabel}>Subject Aggregate</Text>
                            <Text style={styles.overallValue}>{stats.overall}%</Text>
                            <Text style={styles.overallTrend}>Target met for all subjects</Text>
                        </View>
                        <View style={styles.pillBadge}>
                            <Text style={styles.pillBadgeText}>On Track</Text>
                        </View>
                    </View>
                    <View style={styles.progressBarContainer}>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressFill, { width: `${stats.overall}%` }]} />
                        </View>
                    </View>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 20 }} />
                ) : (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>My Subjects Performance</Text>
                        </View>

                        <View style={styles.subjectGrid}>
                            {subjects.map((sub, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[GLOBAL_STYLES.card, styles.subjectCard]}
                                    onPress={() => navigation.navigate('SubjectDashboard', { classId, subject: sub.name, subjectId: sub.id, days: sub.working_days, percent: sub.attendance })}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.subjectTop}>
                                        <View style={styles.subjectIcon}>
                                            <Text style={styles.subjectIconText}>{sub.name.charAt(0)}</Text>
                                        </View>
                                        <Text style={styles.subjectPercent}>{sub.attendance}%</Text>
                                    </View>
                                    <Text style={styles.subjectName} numberOfLines={1}>{sub.name}</Text>
                                    <Text style={styles.subjectDays}>{sub.working_days} Sessions</Text>
                                </TouchableOpacity>
                            ))}
                            {subjects.length === 0 && (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>No subjects handled in this class.</Text>
                                </View>
                            )}
                        </View>
                    </>
                )}
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', height: '100%' },
    scrollContent: { flexGrow: 1 },
    header: { padding: 24, paddingBottom: 12 },
    overallCard: { margin: 24, marginTop: 0, padding: 24 },
    overallInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    overallLabel: { fontSize: 13, color: COLORS.muted, fontWeight: '600' },
    overallValue: { fontSize: 32, fontWeight: '800', color: COLORS.text, marginTop: 4 },
    overallTrend: { fontSize: 11, color: COLORS.accent, marginTop: 4, fontWeight: '700' },
    pillBadge: { backgroundColor: COLORS.mint, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    pillBadgeText: { color: COLORS.accentDeep, fontSize: 11, fontWeight: '700' },

    progressBarContainer: { width: '100%' },
    progressBarBg: { height: 10, backgroundColor: '#f1f5f9', borderRadius: 5, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 5 },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginTop: 12, marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },

    subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, justifyContent: 'space-between' },
    subjectCard: { width: '47%', marginBottom: 16, padding: 16 },
    subjectTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    subjectIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.accentSoft, justifyContent: 'center', alignItems: 'center' },
    subjectIconText: { color: COLORS.accentDeep, fontWeight: '800', fontSize: 14 },
    subjectPercent: { fontSize: 14, fontWeight: '800', color: COLORS.text },
    subjectName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
    subjectDays: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
    emptyState: { width: '100%', padding: 40, alignItems: 'center' },
    emptyText: { color: COLORS.muted, fontSize: 14, fontWeight: '600' },
});

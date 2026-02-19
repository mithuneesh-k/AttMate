import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, GLOBAL_STYLES } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function ClassDashboard() {
    const navigation = useNavigation();
    const route = useRoute();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ overall: 0, subjects: [] });

    // 1. Context: Use class_id from route params or user context
    // For now, let's assume we pass classId in navigation. 
    // If not, we'll need a way to find "my advisory class"
    const classId = route.params?.classId;

    useEffect(() => {
        if (classId) {
            fetchClassStats();
        } else {
            setLoading(false);
        }
    }, [classId]);

    const fetchClassStats = async () => {
        try {
            const response = await api.get(`/teacher/class-stats/${classId}`);
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch class stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={COLORS.accent} />
            </View>
        );
    }

    if (!classId && !loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <View style={styles.emptyIconArea}>
                    <Text style={styles.emptyIcon}>🛡️</Text>
                </View>
                <Text style={styles.emptyTitle}>Access Restricted</Text>
                <Text style={styles.emptyDesc}>No Class ID provided or you are not an advisor.</Text>
                <TouchableOpacity style={GLOBAL_STYLES.btnPrimary} onPress={() => navigation.navigate('TeacherHome')}>
                    <Text style={GLOBAL_STYLES.btnText}>Back to Home</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { overall, subjects } = stats;
    const targetClassName = route.params?.className || 'Class';

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.header}>
                    <Text style={GLOBAL_STYLES.title}>{targetClassName} Dashboard</Text>
                    <Text style={GLOBAL_STYLES.subtitle}>
                        Advisor Access: Full Class Insight
                    </Text>
                </View>

                <View style={[GLOBAL_STYLES.card, styles.overallCard]}>
                    <View style={styles.overallInfo}>
                        <View>
                            <Text style={styles.overallLabel}>Aggregate Attendance</Text>
                            <Text style={styles.overallValue}>{overall}%</Text>
                            <Text style={styles.overallTrend}>↑ 2.4% from last month</Text>
                        </View>
                        <View style={styles.pillBadge}>
                            <Text style={styles.pillBadgeText}>Healthy</Text>
                        </View>
                    </View>
                    <View style={styles.progressBarContainer}>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressFill, { width: `${overall}%` }]} />
                        </View>
                        <View style={styles.progressMarkers}>
                            <Text style={styles.markerText}>0%</Text>
                            <Text style={styles.markerText}>Target (75%)</Text>
                            <Text style={styles.markerText}>100%</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Full Subject Breakdown</Text>
                    <TouchableOpacity>
                        <Text style={styles.viewAllText}>Monthly View</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.subjectGrid}>
                    {subjects.map((sub, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[GLOBAL_STYLES.card, styles.subjectCard]}
                            onPress={() => navigation.navigate('SubjectDashboard', { classId, subject: sub.name, days: sub.working_days, percent: sub.attendance })}
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
    progressMarkers: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    markerText: { fontSize: 10, color: COLORS.border, fontWeight: '600' },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginTop: 12, marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
    viewAllText: { fontSize: 13, color: COLORS.accent, fontWeight: '700' },

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

    center: { justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyIconArea: { width: 80, height: 80, borderRadius: 30, backgroundColor: COLORS.mint, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    emptyIcon: { fontSize: 32 },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
    emptyDesc: { fontSize: 14, color: COLORS.muted, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
});

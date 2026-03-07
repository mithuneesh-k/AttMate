import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';

import { COLORS, GLOBAL_STYLES } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import CalendarView from '../components/CalendarView';

export default function Stats() {
    const navigation = useNavigation();
    const route = useRoute();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ overall: 0, subjects: [] });
    const [activeTab, setActiveTab] = useState('performance'); // 'performance', 'logs', or 'calendar'
    const [logs, setLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedDateDetails, setSelectedDateDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    // Performance Optimization: Cache management
    const [lastFetched, setLastFetched] = useState({ stats: null, logs: {} });
    const FETCH_COOLDOWN = 120000; // 2 minutes

    const { classId, className } = route.params || {};

    useFocusEffect(
        useCallback(() => {
            if (classId) {
                fetchStats();
            }
        }, [classId])
    );

    const fetchStats = async () => {
        const now = Date.now();
        if (lastFetched.stats && (now - lastFetched.stats < FETCH_COOLDOWN)) return;

        try {
            const response = await api.get(`/teacher/class-stats/${classId}`);
            setStats(response.data);
            setLastFetched(prev => ({ ...prev, stats: now }));
            if (response.data.subjects.length > 0 && !selectedSubject) {
                setSelectedSubject(response.data.subjects[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch class stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async (subId) => {
        if (!subId) return;
        const now = Date.now();
        if (lastFetched.logs[subId] && (now - lastFetched.logs[subId] < FETCH_COOLDOWN)) return;

        setLogsLoading(true);
        try {
            const response = await api.get(`/teacher/session-logs/${classId}/${subId}`);
            setLogs(response.data);
            setLastFetched(prev => ({
                ...prev,
                logs: { ...prev.logs, [subId]: now }
            }));
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLogsLoading(false);
        }
    };

    useEffect(() => {
        if ((activeTab === 'logs' || activeTab === 'calendar') && selectedSubject) {
            fetchLogs(selectedSubject);
        }
    }, [activeTab, selectedSubject]);

    const subjects = stats.subjects;

    const markedDates = useMemo(() => {
        const marks = {};
        logs.forEach(log => {
            const d = log.date;
            if (!marks[d]) marks[d] = {};
            marks[d].hasLogs = true;
        });
        return marks;
    }, [logs]);

    const handleDateSelect = async (date) => {
        setDetailsLoading(true);
        try {
            const res = await api.get(`/teacher/day-details/${classId}/${date}`);
            setSelectedDateDetails(res.data);
        } catch (error) {
            console.error("Failed to fetch day details:", error);
        } finally {
            setDetailsLoading(false);
        }
    };

    const renderPerformance = () => (
        <>
            <View style={[GLOBAL_STYLES.card, styles.overallCard]}>
                <View style={styles.overallInfo}>
                    <View>
                        <Text style={styles.overallLabel}>Subject Aggregate</Text>
                        <Text style={styles.overallValue}>{stats.overall}%</Text>
                        <Text style={styles.overallTrend}>Performance summary across all subjects</Text>
                    </View>
                    <View style={styles.pillBadge}>
                        <Text style={styles.pillBadgeText}>Live Data</Text>
                    </View>
                </View>
                <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressFill, { width: `${stats.overall}%` }]} />
                    </View>
                </View>
            </View>

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
            </View>
        </>
    );

    const renderLogs = () => (
        <View style={styles.logsContainer}>
            <View style={styles.subjectSelector}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorScroll}>
                    {subjects.map((sub) => (
                        <TouchableOpacity
                            key={sub.id}
                            style={[styles.subjectPill, selectedSubject === sub.id && styles.activeSubjectPill]}
                            onPress={() => setSelectedSubject(sub.id)}
                        >
                            <Text style={[styles.subjectPillText, selectedSubject === sub.id && styles.activeSubjectPillText]}>
                                {sub.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {logsLoading ? (
                <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />
            ) : (
                <View style={styles.logsList}>
                    {logs.map((log) => (
                        <View key={log.id} style={[GLOBAL_STYLES.card, styles.logCard]}>
                            <View style={styles.logHeader}>
                                <View style={styles.dateBox}>
                                    <Text style={styles.dateDay}>{new Date(log.date).getDate()}</Text>
                                    <Text style={styles.dateMonth}>{new Date(log.date).toLocaleString('default', { month: 'short' })}</Text>
                                </View>
                                <View style={styles.logMeta}>
                                    <Text style={styles.logTime}>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                    <Text style={styles.logYear}>{new Date(log.date).getFullYear()}</Text>
                                </View>
                            </View>
                            <View style={styles.logBody}>
                                <Text style={styles.logContent}>{log.content}</Text>
                            </View>
                        </View>
                    ))}
                    {logs.length === 0 && (
                        <View style={styles.emptyLogs}>
                            <Text style={styles.emptyLogsText}>No logs found for this subject.</Text>
                            <Text style={styles.emptyLogsSubtext}>Logs you add from the Subject Dashboard will appear here.</Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );

    const renderCalendar = () => (
        <View style={styles.calendarTabContent}>
            <CalendarView
                onDateSelect={handleDateSelect}
                markedDates={markedDates}
            />

            <View style={styles.detailsContainer}>
                {detailsLoading ? (
                    <ActivityIndicator color={COLORS.accent} style={{ marginTop: 20 }} />
                ) : selectedDateDetails ? (
                    <View style={styles.detailsContent}>
                        <Text style={styles.detailsTitle}>Activity on {selectedDateDetails.date}</Text>

                        <Text style={styles.subSectionTitle}>Session Logs</Text>
                        {selectedDateDetails.logs.length > 0 ? (
                            selectedDateDetails.logs.map(log => (
                                <View key={log.id} style={styles.detailLogCard}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <Text style={styles.detailLogLabel}>Subject: {subjects.find(s => s.id === log.subject_id)?.name || 'Unknown'}</Text>
                                        <Text style={styles.detailLogTime}>
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                    <Text style={styles.detailLogText}>{log.content}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.noDataText}>No logs for this date.</Text>
                        )}

                        <Text style={styles.subSectionTitle}>Attendance Summary</Text>
                        {Object.keys(selectedDateDetails.attendance).length > 0 ? (
                            Object.entries(selectedDateDetails.attendance).map(([sub, statsData]) => {
                                const subjectObj = subjects.find(s => s.name === sub);
                                return (
                                    <TouchableOpacity
                                        key={sub}
                                        style={styles.detailAttCard}
                                        onPress={() => {
                                            if (subjectObj) {
                                                navigation.navigate('SubjectDashboard', {
                                                    classId,
                                                    subject: sub,
                                                    subjectId: subjectObj.id,
                                                    initialTab: 'sheet',
                                                    targetDate: selectedDateDetails.date
                                                });
                                            }
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text style={styles.detailAttSub}>{sub}</Text>
                                            <Text style={{ fontSize: 10, color: COLORS.accent, fontWeight: '700' }}>View Sheet →</Text>
                                        </View>
                                        <View style={styles.attRow}>
                                            <Text style={[styles.attStat, { color: COLORS.accent }]}>P: {statsData.Present}</Text>
                                            <Text style={[styles.attStat, { color: COLORS.danger }]}>A: {statsData.Absent}</Text>
                                            <Text style={[styles.attStat, { color: COLORS.accentDeep }]}>O: {statsData.OD}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        ) : (
                            <Text style={styles.noDataText}>No attendance records for this date.</Text>
                        )}
                    </View>
                ) : (
                    <View style={styles.emptyDetails}>
                        <Text style={styles.emptyDetailsText}>Select a date to see session details</Text>
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.header}>
                    <Text style={GLOBAL_STYLES.title}>{className} Stats</Text>
                    <Text style={GLOBAL_STYLES.subtitle}>Performance analysis and session logs</Text>
                </View>

                {/* Tab Switcher */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'performance' && styles.activeTab]}
                        onPress={() => setActiveTab('performance')}
                    >
                        <Text style={[styles.tabText, activeTab === 'performance' && styles.activeTabText]}>Performance</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'logs' && styles.activeTab]}
                        onPress={() => setActiveTab('logs')}
                    >
                        <Text style={[styles.tabText, activeTab === 'logs' && styles.activeTabText]}>Logs</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'calendar' && styles.activeTab]}
                        onPress={() => setActiveTab('calendar')}
                    >
                        <Text style={[styles.tabText, activeTab === 'calendar' && styles.activeTabText]}>Calendar</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 40 }} />
                ) : activeTab === 'performance' ? (
                    renderPerformance()
                ) : activeTab === 'logs' ? (
                    renderLogs()
                ) : (
                    renderCalendar()
                )}
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fdfdfd',
    },
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
    tabContainer: { flexDirection: 'row', paddingHorizontal: 24, marginBottom: 20, gap: 12 },
    tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#f1f5f9' },
    activeTab: { backgroundColor: COLORS.accent },
    tabText: { fontSize: 14, fontWeight: '700', color: COLORS.muted },
    activeTabText: { color: '#fff' },
    logsContainer: { flex: 1 },
    subjectSelector: { marginBottom: 20 },
    selectorScroll: { paddingHorizontal: 24, gap: 8 },
    subjectPill: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' },
    activeSubjectPill: { borderColor: COLORS.accent, backgroundColor: COLORS.accentSoft },
    subjectPillText: { fontSize: 13, fontWeight: '600', color: COLORS.muted },
    activeSubjectPillText: { color: COLORS.accentDeep },
    logsList: { paddingHorizontal: 24 },
    logCard: { padding: 20, marginBottom: 16 },
    logHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 12 },
    dateBox: { width: 50, height: 50, backgroundColor: COLORS.accentSoft, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    dateDay: { fontSize: 18, fontWeight: '800', color: COLORS.accentDeep },
    dateMonth: { fontSize: 10, fontWeight: '700', color: COLORS.accentDeep, textTransform: 'uppercase' },
    logMeta: { marginLeft: 16 },
    logTime: { fontSize: 13, fontWeight: '700', color: COLORS.text },
    logYear: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
    logBody: { marginTop: 4 },
    logContent: { fontSize: 15, color: COLORS.text, lineHeight: 22 },
    emptyLogs: { alignItems: 'center', marginTop: 60 },
    emptyLogsText: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
    emptyLogsSubtext: { fontSize: 13, color: COLORS.muted, textAlign: 'center' },
    noDataText: { fontSize: 13, color: COLORS.muted, fontStyle: 'italic', marginBottom: 12 },
    emptyDetails: { alignItems: 'center', marginTop: 40, padding: 20 },
    emptyDetailsText: { color: COLORS.muted, fontSize: 14, fontWeight: '600' },
    calendarTabContent: { flex: 1 },
    detailsContainer: { padding: 24, paddingBottom: 100 },
    detailsContent: { backgroundColor: '#fff', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#f1f5f9' },
    detailsTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 20 },
    subSectionTitle: { fontSize: 11, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 15 },
    detailLogCard: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, marginBottom: 8 },
    detailLogText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
    detailLogLabel: { fontSize: 10, color: COLORS.accentDeep, fontWeight: '700' },
    detailLogTime: { fontSize: 10, color: COLORS.muted },
    detailAttCard: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, marginBottom: 8 },
    detailAttSub: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
    attRow: { flexDirection: 'row', gap: 15 },
    attStat: { fontSize: 12, fontWeight: '800' }
});

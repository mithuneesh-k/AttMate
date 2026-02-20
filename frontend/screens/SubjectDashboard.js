import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { COLORS, GLOBAL_STYLES } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const { width } = Dimensions.get('window');

export default function SubjectDashboard() {
    const route = useRoute();
    const navigation = useNavigation();
    const { user } = useAuth();
    const { classId, subject, subjectId, days, percent } = route.params || {};

    const [activeTab, setActiveTab] = useState('sheet'); // 'summary' or 'sheet'
    const [loading, setLoading] = useState(false);
    const [sheetData, setSheetData] = useState(null);
    const [overview, setOverview] = useState({ days: days || '-', percent: percent || '-' });

    useEffect(() => {
        if (!days || !percent) {
            const fetchOverview = async () => {
                if (!user?.id) return;
                try {
                    const res = await api.get(`/teacher/class-stats/${classId}?user_id=${user.id}`);
                    const subStat = res.data.subjects.find(s => s.id === subjectId);
                    if (subStat) {
                        setOverview({ days: subStat.working_days, percent: subStat.attendance });
                    }
                } catch (e) {
                    console.error("Failed to fetch subject stats overview:", e);
                }
            };
            fetchOverview();
        }
    }, [classId, subjectId, days, percent, user]);

    useEffect(() => {
        if (activeTab === 'sheet') {
            fetchAttendanceSheet();
        }
    }, [activeTab]);

    const fetchAttendanceSheet = async () => {
        setLoading(true);
        try {
            // Updated endpoint to fetch matrix data
            const response = await api.get(`/teacher/attendance-sheet/${classId}/${subjectId}`);
            setSheetData(response.data);
        } catch (error) {
            console.error("Failed to fetch attendance sheet:", error);
        } finally {
            setLoading(false);
        }
    };

    const renderSummary = () => (
        <View style={styles.tabContent}>
            <View style={[GLOBAL_STYLES.card, styles.summaryCard]}>
                <Text style={styles.summaryTitle}>Current Standing</Text>
                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>{overview.percent}%</Text>
                        <Text style={styles.summaryLabel}>Attendance</Text>
                    </View>
                    <View style={styles.vertLine} />
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>{overview.days}</Text>
                        <Text style={styles.summaryLabel}>Sessions</Text>
                    </View>
                </View>
            </View>
            <Text style={styles.placeholderText}>Charts and detailed analytics coming soon...</Text>
        </View>
    );

    const renderSheet = () => {
        if (loading) return <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 40 }} />;
        if (!sheetData) return <Text style={styles.errorText}>No data available.</Text>;

        const { dates, students } = sheetData.students ? sheetData : { dates: [], students: [] };

        if (!students || students.length === 0) return <Text style={styles.errorText}>No attendance records found.</Text>;

        // Width for date columns
        const colWidth = 55;
        const nameColWidth = 160;

        return (
            <ScrollView style={styles.sheetContainer} nestedScrollEnabled={true}>
                <ScrollView
                    horizontal={true}
                    showsHorizontalScrollIndicator={true}
                    style={Platform.OS === 'web' ? { overflowX: 'auto' } : {}}
                >
                    <View>
                        {/* Header Row */}
                        <View style={styles.headerRow}>
                            <View style={[styles.cell, styles.nameCell, styles.headerCell, { width: nameColWidth }]}>
                                <Text style={styles.headerText}>Student</Text>
                            </View>
                            {dates.map((dateObj, index) => {
                                const [dateStr, sessionStr] = dateObj.split('|');
                                return (
                                    <View key={index} style={[styles.cell, styles.dateCell, styles.headerCell, { width: colWidth }]}>
                                        <Text style={styles.headerDateText}>
                                            {/* Format: 2026-02-18 -> 18/02 */}
                                            {dateStr.split('-').slice(1).reverse().join('/')}
                                        </Text>
                                        <Text style={styles.headerSessionText}>
                                            S{sessionStr}
                                        </Text>
                                    </View>
                                )
                            })}

                            <View style={[styles.cell, styles.headerCell, { width: colWidth * 1.5, borderLeftWidth: 2, borderLeftColor: '#f1f5f9' }]}>
                                <Text style={styles.headerText}>Overall %</Text>
                            </View>
                        </View>

                        {/* Data Rows */}
                        {students.map((student, rowIndex) => (
                            <View key={rowIndex} style={styles.row}>
                                <View style={[styles.cell, styles.nameCell, { width: nameColWidth }]}>
                                    <Text style={styles.nameText}>{student.name}</Text>
                                    <Text style={styles.rollText}>{student.roll}</Text>
                                </View>
                                {dates.map((date, colIndex) => {
                                    const status = student.attendance[date] || '-';
                                    let cellBg = 'transparent';
                                    let textColor = COLORS.text;

                                    if (status === 'P') {
                                        cellBg = '#d1fae5'; // Green-100
                                        textColor = '#047857'; // Green-700
                                    } else if (status === 'A') {
                                        cellBg = '#fee2e2'; // Red-100
                                        textColor = '#b91c1c'; // Red-700
                                    } else if (status === 'O') {
                                        cellBg = '#dbeafe'; // Blue-100
                                        textColor = '#1d4ed8'; // Blue-700
                                    }

                                    const hasColor = status === 'P' || status === 'A' || status === 'O';
                                    const bColor = hasColor ? cellBg : '#f1f5f9';

                                    return (
                                        <View key={colIndex} style={[styles.cell, {
                                            width: colWidth,
                                            backgroundColor: cellBg,
                                            borderBottomWidth: 1,
                                            borderBottomColor: bColor,
                                            borderRightWidth: 1,
                                            borderRightColor: bColor
                                        }]}>
                                            <Text style={[styles.statusText, { color: textColor }]}>{status}</Text>
                                        </View>
                                    );
                                })}

                                {/* Percentage Column */}
                                {(() => {
                                    const totalSessions = dates.length;
                                    const presentAndOd = dates.filter(d => student.attendance[d] === 'P' || student.attendance[d] === 'O').length;
                                    const percent = totalSessions > 0 ? ((presentAndOd / totalSessions) * 100).toFixed(1) : 0;
                                    const isWarning = totalSessions > 0 && percent < 75;

                                    return (
                                        <View style={[styles.cell, {
                                            width: colWidth * 1.5,
                                            borderLeftWidth: 2,
                                            borderLeftColor: '#f1f5f9',
                                            backgroundColor: isWarning ? '#fee2e2' : '#fff',
                                            borderBottomWidth: 1,
                                            borderBottomColor: '#f1f5f9',
                                            borderRightWidth: 1,
                                            borderRightColor: '#f1f5f9'
                                        }]}>
                                            <Text style={[styles.statusText, { color: isWarning ? '#b91c1c' : COLORS.text, fontWeight: isWarning ? '800' : '600' }]}>
                                                {totalSessions > 0 ? `${percent}%` : '-'}
                                            </Text>
                                        </View>
                                    );
                                })()}
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </ScrollView>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={GLOBAL_STYLES.title}>{subject}</Text>
                <Text style={GLOBAL_STYLES.subtitle}>Class {classId}</Text>
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab]}
                    onPress={() => setActiveTab('summary')}
                // style={[styles.tab, activeTab === 'summary' && styles.activeTab]} 
                >
                    <Text style={[styles.tabText, activeTab === 'summary' && styles.activeTabText]}>Summary</Text>
                    <View style={[styles.activeUnderline, { backgroundColor: activeTab === 'summary' ? COLORS.accent : 'transparent' }]} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab]}
                    onPress={() => setActiveTab('sheet')}
                >
                    <Text style={[styles.tabText, activeTab === 'sheet' && styles.activeTabText]}>Attendance Sheet</Text>
                    <View style={[styles.activeUnderline, { backgroundColor: activeTab === 'sheet' ? COLORS.accent : 'transparent' }]} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {activeTab === 'summary' ? renderSummary() : renderSheet()}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fdfdfd' },
    header: { padding: 20, paddingBottom: 10, backgroundColor: '#fff' },
    backButton: { marginBottom: 8, padding: 4 },
    backButtonText: { color: COLORS.accent, fontSize: 16, fontWeight: '600' },

    tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
    activeUnderline: { height: 2, backgroundColor: COLORS.accent, width: '60%', marginTop: 4 },
    tabText: { fontSize: 14, fontWeight: '600', color: COLORS.muted },
    activeTabText: { color: COLORS.accent },

    content: { flex: 1, backgroundColor: '#fff' },
    tabContent: { flex: 1 },

    summaryCard: { padding: 24, alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16 },
    summaryTitle: { fontSize: 16, fontWeight: '600', color: COLORS.muted, marginBottom: 16 },
    summaryRow: { flexDirection: 'row', alignItems: 'center' },
    summaryItem: { alignItems: 'center', paddingHorizontal: 20 },
    summaryValue: { fontSize: 32, fontWeight: '800', color: COLORS.text },
    summaryLabel: { fontSize: 12, color: COLORS.muted, marginTop: 4 },
    vertLine: { width: 1, height: 40, backgroundColor: '#e2e8f0' },
    placeholderText: { textAlign: 'center', marginTop: 40, color: COLORS.muted, fontStyle: 'italic' },

    sheetContainer: { flex: 1 },
    headerRow: { flexDirection: 'row', backgroundColor: '#f8fafc' },
    row: { flexDirection: 'row', alignItems: 'stretch' },

    cell: { minHeight: 48, paddingVertical: 8, justifyContent: 'center', alignItems: 'center' },
    nameCell: { paddingHorizontal: 12, alignItems: 'flex-start', justifyContent: 'center', backgroundColor: '#fff', zIndex: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', borderRightWidth: 1, borderRightColor: '#f1f5f9' },
    headerCell: { backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', borderRightWidth: 1, borderRightColor: '#e2e8f0' },

    headerText: { fontWeight: '700', fontSize: 12, color: COLORS.text },
    headerDateText: { fontWeight: '600', fontSize: 11, color: COLORS.text },
    headerSessionText: { fontWeight: '700', fontSize: 10, color: COLORS.muted, marginTop: 2 },

    nameText: { fontWeight: '700', fontSize: 12, color: COLORS.text },
    rollText: { fontSize: 10, color: COLORS.muted },
    statusText: { fontWeight: '800', fontSize: 14 },

    errorText: { textAlign: 'center', marginTop: 20, color: COLORS.accent }
});

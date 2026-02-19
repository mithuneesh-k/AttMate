import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { COLORS, GLOBAL_STYLES } from '../styles/theme';
import api from '../api';

const { width } = Dimensions.get('window');

export default function SubjectDashboard() {
    const route = useRoute();
    const navigation = useNavigation();
    const { classId, subject, subjectId, days, percent } = route.params || {};

    const [activeTab, setActiveTab] = useState('sheet'); // 'summary' or 'sheet'
    const [loading, setLoading] = useState(false);
    const [sheetData, setSheetData] = useState(null);

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
                        <Text style={styles.summaryValue}>{percent}%</Text>
                        <Text style={styles.summaryLabel}>Attendance</Text>
                    </View>
                    <View style={styles.vertLine} />
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>{days}</Text>
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
        const colWidth = 40;
        const nameColWidth = 100;

        return (
            <ScrollView style={styles.sheetContainer} nestedScrollEnabled={true}>
                <ScrollView horizontal={true} showsHorizontalScrollIndicator={true}>
                    <View>
                        {/* Header Row */}
                        <View style={styles.headerRow}>
                            <View style={[styles.cell, styles.nameCell, styles.headerCell, { width: nameColWidth }]}>
                                <Text style={styles.headerText}>Student</Text>
                            </View>
                            {dates.map((date, index) => (
                                <View key={index} style={[styles.cell, styles.dateCell, styles.headerCell, { width: colWidth }]}>
                                    <Text style={styles.headerDateText}>
                                        {/* Format: 2026-02-18 -> 18/02 */}
                                        {date.split('-').slice(1).reverse().join('/')}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* Data Rows */}
                        {students.map((student, rowIndex) => (
                            <View key={rowIndex} style={styles.row}>
                                <View style={[styles.cell, styles.nameCell, { width: nameColWidth }]}>
                                    <Text style={styles.nameText} numberOfLines={1}>{student.name}</Text>
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

                                    return (
                                        <View key={colIndex} style={[styles.cell, { width: colWidth, backgroundColor: cellBg }]}>
                                            <Text style={[styles.statusText, { color: textColor }]}>{status}</Text>
                                        </View>
                                    );
                                })}
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
                    <View style={activeTab === 'summary' ? styles.activeUnderline : {}} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab]}
                    onPress={() => setActiveTab('sheet')}
                >
                    <Text style={[styles.tabText, activeTab === 'sheet' && styles.activeTabText]}>Attendance Sheet</Text>
                    <View style={activeTab === 'sheet' ? styles.activeUnderline : {}} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {activeTab === 'summary' ? renderSummary() : renderSheet()}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { padding: 20, paddingBottom: 10, backgroundColor: '#fff', paddingTop: 60 },
    backButton: { marginBottom: 8, padding: 4 },
    backButtonText: { color: COLORS.accent, fontSize: 16, fontWeight: '600' },

    tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
    activeUnderline: { height: 2, backgroundColor: COLORS.accent, width: '60%', marginTop: 4 },
    tabText: { fontSize: 14, fontWeight: '600', color: COLORS.muted },
    activeTabText: { color: COLORS.accent },

    content: { flex: 1, padding: 16 },
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
    headerRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#f8fafc' },
    row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' },

    cell: { height: 40, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#f1f5f9' },
    nameCell: { paddingHorizontal: 8, alignItems: 'flex-start', backgroundColor: '#fff', zIndex: 10 },
    headerCell: { backgroundColor: '#f8fafc' },

    headerText: { fontWeight: '700', fontSize: 12, color: COLORS.text },
    headerDateText: { fontWeight: '600', fontSize: 10, color: COLORS.muted },

    nameText: { fontWeight: '700', fontSize: 12, color: COLORS.text },
    rollText: { fontSize: 10, color: COLORS.muted },
    statusText: { fontWeight: '800', fontSize: 14 },

    errorText: { textAlign: 'center', marginTop: 20, color: COLORS.accent }
});

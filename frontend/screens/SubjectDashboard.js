import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Platform, Modal, TextInput, Alert } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';

import { COLORS, GLOBAL_STYLES } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import CalendarView from '../components/CalendarView';

const { width } = Dimensions.get('window');

export default function SubjectDashboard() {
    const route = useRoute();
    const navigation = useNavigation();
    const { user } = useAuth();
    const { classId, subject, subjectId, days, percent, initialTab, targetDate } = route.params || {};

    const [activeTab, setActiveTab] = useState(initialTab || 'summary'); // 'summary', 'sheet', 'logs', or 'calendar'
    const [logs, setLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sheetData, setSheetData] = useState(null);
    const [overview, setOverview] = useState({ days: days || '-', percent: percent || '-' });
    const [logModalVisible, setLogModalVisible] = useState(false);
    const [sessionContent, setSessionContent] = useState('');
    const [savingLog, setSavingLog] = useState(false);
    const [selectedDateDetails, setSelectedDateDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [highlightedDate, setHighlightedDate] = useState(targetDate || null);
    const [isEditing, setIsEditing] = useState(false);

    // Performance Optimization: Cache management
    const [lastFetched, setLastFetched] = useState({ sheet: null, logs: null });
    const FETCH_COOLDOWN = 120000; // 2 minutes cooldown for auto-refresh

    useFocusEffect(
        useCallback(() => {
            const fetchData = async () => {
                const now = Date.now();
                const promises = [];

                // 1. Re-fetch overview if stats are missing
                if (!days || !percent) {
                    if (user?.id) {
                        promises.push(
                            api.get(`/teacher/class-stats/${classId}?user_id=${user.id}`)
                                .then(res => {
                                    const subStat = res.data.subjects.find(s => s.id === subjectId);
                                    if (subStat) {
                                        setOverview({ days: subStat.working_days, percent: subStat.attendance });
                                    }
                                })
                                .catch(e => console.error("Failed to fetch subject stats overview:", e))
                        );
                    }
                }

                // 2. Fetch Attendance Sheet (if on sheet or calendar tab and cache is stale)
                const needsSheet = (activeTab === 'sheet' || activeTab === 'calendar');
                const sheetStale = !lastFetched.sheet || (now - lastFetched.sheet > FETCH_COOLDOWN);
                if (needsSheet && sheetStale) {
                    promises.push(fetchAttendanceSheet());
                }

                // 3. Fetch Logs (if on logs or calendar tab and cache is stale)
                const needsLogs = (activeTab === 'logs' || activeTab === 'calendar');
                const logsStale = !lastFetched.logs || (now - lastFetched.logs > FETCH_COOLDOWN);
                if (needsLogs && logsStale) {
                    promises.push(fetchLogs());
                }

                if (promises.length > 0) {
                    await Promise.all(promises);
                }
            };
            fetchData();
        }, [classId, subjectId, days, percent, user, activeTab, lastFetched])
    );


    const fetchAttendanceSheet = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/teacher/attendance-sheet/${classId}/${subjectId}`);
            setSheetData(response.data);
            setLastFetched(prev => ({ ...prev, sheet: Date.now() }));
        } catch (error) {
            console.error("Failed to fetch attendance sheet:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        setLogsLoading(true);
        try {
            const response = await api.get(`/teacher/session-logs/${classId}/${subjectId}`);
            setLogs(response.data);
            setLastFetched(prev => ({ ...prev, logs: Date.now() }));
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLogsLoading(false);
        }
    };

    const toggleAttendance = async (studentId, studentName, date, currentStatus) => {
        if (!isEditing) return; // Only allow toggling in Edit Mode

        // P -> A -> O -> P
        const statusCycle = { 'P': 'A', 'A': 'O', 'O': 'P', '-': 'P' };
        const nextStatus = statusCycle[currentStatus] || 'P';

        // Optimistic Update
        const originalData = { ...sheetData };
        const newStudents = sheetData.students.map(s => {
            if (s.id === studentId) {
                return {
                    ...s,
                    attendance: { ...s.attendance, [date]: nextStatus }
                };
            }
            return s;
        });
        setSheetData({ ...sheetData, students: newStudents });

        try {
            await api.post('/teacher/update-attendance', {
                student_id: studentId,
                class_id: classId,
                subject_id: subjectId,
                date: date.split('|')[0], // Handle both "YYYY-MM-DD" and "YYYY-MM-DD|S1"
                status: nextStatus === 'P' ? 'Present' : (nextStatus === 'A' ? 'Absent' : 'OD')
            });
        } catch (error) {
            console.error("Failed to update attendance:", error);
            Alert.alert("Update Failed", `Could not update attendance for ${studentName}.`);
            setSheetData(originalData); // Rollback
        }
    };

    const handleLogSession = async () => {
        if (!sessionContent.trim()) {
            Alert.alert('Empty Log', 'Please enter what you taught in this session.');
            return;
        }

        setSavingLog(true);
        try {
            await api.post('/teacher/session-logs', {
                date: new Date().toISOString().split('T')[0],
                content: sessionContent,
                class_id: classId,
                subject_id: subjectId,
                faculty_id: user.id
            });
            Alert.alert('Success', 'Session log saved successfully!');
            setSessionContent('');
            setLogModalVisible(false);
        } catch (error) {
            console.error('Failed to save session log:', error);
            Alert.alert('Error', 'Failed to save session log. Please try again.');
        } finally {
            setSavingLog(false);
        }
    };

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

    const markedDates = useMemo(() => {
        const marks = {};

        // Mark dates with logs
        logs.forEach(log => {
            const d = log.date;
            if (!marks[d]) marks[d] = {};
            marks[d].hasLogs = true;
        });

        // Mark dates with attendance from sheetData
        if (sheetData && sheetData.dates) {
            sheetData.dates.forEach(d => {
                const dateKey = d; // Endpoint returns ISO date strings
                if (!marks[dateKey]) marks[dateKey] = {};
                marks[dateKey].hasAttendance = true;

                // Calculate average for the day
                let totalStudents = 0;
                let presentCount = 0;
                sheetData.students.forEach(student => {
                    const status = student.attendance[d];
                    if (status !== '-') {
                        totalStudents++;
                        if (status === 'P' || status === 'O') presentCount++;
                    }
                });

                if (totalStudents > 0) {
                    marks[dateKey].attendancePercent = (presentCount / totalStudents) * 100;
                }
            });
        }

        return marks;
    }, [logs, sheetData]);

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

    const renderLogs = () => (
        <View style={styles.tabContent}>
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
                            <Text style={styles.emptyLogsSubtext}>Logs you add from the summary or chat will appear here.</Text>
                        </View>
                    )}
                </View>
            )}
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
            <ScrollView style={[styles.sheetContainer, { flex: 1 }]} nestedScrollEnabled={true} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={true}>


                <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>Batch Matrix</Text>
                    <TouchableOpacity
                        style={[styles.editButton, isEditing && styles.editButtonActive]}
                        onPress={() => setIsEditing(!isEditing)}
                    >
                        <Text style={[styles.editButtonText, isEditing && styles.editButtonTextActive]}>
                            {isEditing ? '✓ Done' : '✎ Edit'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    horizontal={true}
                    showsHorizontalScrollIndicator={true}
                    contentContainerStyle={{ flexGrow: 1 }}
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
                                    const dateStrOnly = date.split('|')[0];
                                    const isHighlighted = highlightedDate === dateStrOnly;

                                    let cellBg = isHighlighted ? '#f0fdf4' : 'transparent'; // Emerald-50 if highlighted
                                    let textColor = COLORS.text;

                                    if (status === 'P') {
                                        cellBg = isHighlighted ? '#ccfbf1' : '#d1fae5';
                                        textColor = '#047857';
                                    } else if (status === 'A') {
                                        cellBg = isHighlighted ? '#fee2e2' : '#fee2e2';
                                        textColor = '#b91c1c';
                                    } else if (status === 'O') {
                                        cellBg = isHighlighted ? '#dbeafe' : '#dbeafe';
                                        textColor = '#1d4ed8';
                                    }

                                    const bColor = status !== '-' ? cellBg : '#f1f5f9';

                                    return (
                                        <TouchableOpacity
                                            key={colIndex}
                                            style={[styles.cell, {
                                                width: colWidth,
                                                backgroundColor: cellBg,
                                                borderBottomWidth: 1,
                                                borderBottomColor: bColor,
                                                borderRightWidth: 1,
                                                borderRightColor: bColor,
                                                borderLeftWidth: isHighlighted ? 2 : 0,
                                                borderLeftColor: isHighlighted ? COLORS.accent : 'transparent',
                                                borderRightWidth: isHighlighted ? 2 : 1,
                                                borderRightColor: isHighlighted ? COLORS.accent : bColor,
                                                borderWidth: isEditing ? 1 : 0,
                                                borderColor: isEditing ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                                                borderStyle: 'dashed'
                                            }]}
                                            onPress={() => toggleAttendance(student.id, student.name, date, status)}
                                            disabled={!isEditing}
                                            activeOpacity={0.6}
                                        >
                                            <Text style={[styles.statusText, { color: textColor }]}>{status}</Text>
                                        </TouchableOpacity>
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
    const renderCalendar = () => (
        <ScrollView style={styles.tabContent}>
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
                                    <Text style={styles.detailLogText}>{log.content}</Text>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                                        <Text style={styles.detailLogLabel}>Session Log</Text>
                                        <Text style={styles.detailLogTime}>
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.noDataText}>No logs for this date.</Text>
                        )}

                        <Text style={styles.subSectionTitle}>Attendance Summary</Text>
                        {Object.keys(selectedDateDetails.attendance).length > 0 ? (
                            Object.entries(selectedDateDetails.attendance).map(([sub, stats]) => (
                                <TouchableOpacity
                                    key={sub}
                                    style={styles.detailAttCard}
                                    onPress={() => {
                                        setHighlightedDate(selectedDateDetails.date);
                                        setActiveTab('sheet');
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={styles.detailAttSub}>{sub}</Text>
                                        <Text style={{ fontSize: 10, color: COLORS.accent, fontWeight: '700' }}>View Sheet →</Text>
                                    </View>
                                    <View style={styles.attRow}>
                                        <Text style={[styles.attStat, { color: COLORS.accent }]}>P: {stats.Present}</Text>
                                        <Text style={[styles.attStat, { color: COLORS.danger }]}>A: {stats.Absent}</Text>
                                        <Text style={[styles.attStat, { color: COLORS.accentDeep }]}>O: {stats.OD}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))
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
        </ScrollView>
    );

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
                >
                    <Text style={[styles.tabText, activeTab === 'summary' && styles.activeTabText]}>Summary</Text>
                    <View style={[styles.activeUnderline, { backgroundColor: activeTab === 'summary' ? COLORS.accent : 'transparent' }]} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab]}
                    onPress={() => setActiveTab('sheet')}
                >
                    <Text style={[styles.tabText, activeTab === 'sheet' && styles.activeTabText]}>Sheet</Text>
                    <View style={[styles.activeUnderline, { backgroundColor: activeTab === 'sheet' ? COLORS.accent : 'transparent' }]} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab]}
                    onPress={() => setActiveTab('logs')}
                >
                    <Text style={[styles.tabText, activeTab === 'logs' && styles.activeTabText]}>Logs</Text>
                    <View style={[styles.activeUnderline, { backgroundColor: activeTab === 'logs' ? COLORS.accent : 'transparent' }]} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab]}
                    onPress={() => setActiveTab('calendar')}
                >
                    <Text style={[styles.tabText, activeTab === 'calendar' && styles.activeTabText]}>Calendar</Text>
                    <View style={[styles.activeUnderline, { backgroundColor: activeTab === 'calendar' ? COLORS.accent : 'transparent' }]} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {activeTab === 'summary' ? renderSummary() :
                    activeTab === 'sheet' ? renderSheet() :
                        activeTab === 'logs' ? renderLogs() :
                            renderCalendar()}
            </View>

            {/* Session Log Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={logModalVisible}
                onRequestClose={() => setLogModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Log Session Content</Text>
                        <Text style={styles.modalSubtitle}>What did you teach in today's session?</Text>

                        <TextInput
                            style={styles.logInput}
                            placeholder="Example: Introduction to React Native components and state management..."
                            multiline
                            numberOfLines={6}
                            value={sessionContent}
                            onChangeText={setSessionContent}
                            textAlignVertical="top"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.cancelBtn]}
                                onPress={() => setLogModalVisible(false)}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.saveBtn]}
                                onPress={handleLogSession}
                                disabled={savingLog}
                            >
                                {savingLog ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.saveBtnText}>Save Log</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fdfdfd',
    },




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

    logsList: { paddingHorizontal: 20, paddingVertical: 10 },
    logCard: { padding: 20, marginBottom: 16, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9' },
    logHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f8fafc', paddingBottom: 12 },
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

    errorText: { textAlign: 'center', marginTop: 20, color: COLORS.accent },

    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    sheetTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.text,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.accent,
    },
    editButtonActive: {
        backgroundColor: COLORS.accent,
    },
    editButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.accent,
    },
    editButtonTextActive: {
        color: '#fff',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4
    },
    modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
    modalSubtitle: { fontSize: 14, color: COLORS.muted, marginBottom: 20 },
    logInput: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        minHeight: 120,
        marginBottom: 24
    },
    modalButtons: { flexDirection: 'row', gap: 12 },
    modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    cancelBtn: { backgroundColor: '#f1f5f9' },
    saveBtn: { backgroundColor: COLORS.accent },
    cancelBtnText: { color: COLORS.muted, fontWeight: '700' },
    saveBtnText: { color: '#fff', fontWeight: '700' },
    noDataText: { fontSize: 13, color: COLORS.muted, fontStyle: 'italic', marginBottom: 12 },
    emptyDetails: { alignItems: 'center', marginTop: 40, padding: 20 },
    emptyDetailsText: { color: COLORS.muted, fontSize: 14, fontWeight: '600' },

    detailsContainer: { padding: 20, paddingBottom: 100 },
    detailsContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#f1f5f9' },
    detailsTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 20 },
    subSectionTitle: { fontSize: 11, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 10 },

    detailLogCard: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, marginBottom: 8 },
    detailLogText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
    detailLogLabel: { fontSize: 10, color: COLORS.accentDeep, fontWeight: '700' },
    detailLogTime: { fontSize: 10, color: COLORS.muted },

    detailAttCard: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, marginBottom: 8 },
    detailAttSub: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
    attRow: { flexDirection: 'row', gap: 15 },
    attStat: { fontSize: 12, fontWeight: '800' }
});

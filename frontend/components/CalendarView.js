import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS } from '../styles/theme';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarView({ onDateSelect, markedDates = {} }) {
    const today = new Date();
    const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);

    const calendarData = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        // Fill empty slots for previous month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }

        // Fill actual days
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            days.push({
                day: i,
                date: dateStr,
                isToday: dateStr === today.toISOString().split('T')[0],
                marked: markedDates[dateStr] || null
            });
        }

        return days;
    }, [viewDate, markedDates]);

    const changeMonth = (offset) => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
    };

    const handleDatePress = (day) => {
        if (!day) return;
        setSelectedDate(day.date);
        if (onDateSelect) onDateSelect(day.date);
    };

    return (
        <View style={styles.calendarContainer}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
                    <Text style={styles.navBtnText}>❮</Text>
                </TouchableOpacity>
                <Text style={styles.monthTitle}>{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</Text>
                <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
                    <Text style={styles.navBtnText}>❯</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.weekDays}>
                {DAYS.map(day => (
                    <Text key={day} style={styles.weekDayText}>{day}</Text>
                ))}
            </View>

            <View style={styles.daysGrid}>
                {calendarData.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => handleDatePress(item)}
                        disabled={!item}
                        style={[
                            styles.dayCell,
                            item?.date === selectedDate && styles.selectedDay,
                            item?.isToday && !(item?.date === selectedDate) && styles.todayCell
                        ]}
                    >
                        {item && (
                            <>
                                <Text style={[
                                    styles.dayText,
                                    item.date === selectedDate && styles.selectedDayText,
                                    item.isToday && styles.todayText
                                ]}>
                                    {item.day}
                                </Text>
                                <View style={styles.markerRow}>
                                    {item.marked?.hasLogs && <View style={styles.logDot} />}
                                    {item.marked?.hasAttendance && (
                                        <View style={[
                                            styles.attDot,
                                            { backgroundColor: item.marked.attendancePercent >= 75 ? COLORS.accent : COLORS.danger }
                                        ]} />
                                    )}
                                </View>
                            </>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    calendarContainer: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 16,
        marginHorizontal: 16,
        marginTop: 10,
        // Depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 8,
    },
    monthTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.text,
    },
    navBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: COLORS.bgSoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    navBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.muted,
    },
    weekDays: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    weekDayText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.muted,
        width: 40,
        textAlign: 'center',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    todayCell: {
        backgroundColor: COLORS.mint,
    },
    selectedDay: {
        backgroundColor: COLORS.accent,
    },
    dayText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    todayText: {
        color: COLORS.accentDeep,
        fontWeight: '800',
    },
    selectedDayText: {
        color: '#fff',
        fontWeight: '800',
    },
    markerRow: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 6,
        gap: 3,
    },
    logDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.accentDeep,
    },
    attDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
    }
});

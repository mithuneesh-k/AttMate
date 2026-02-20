import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, GLOBAL_STYLES } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import BottomNav from '../components/BottomNav';

export default function TeacherHome() {
    const navigation = useNavigation();
    const { user } = useAuth();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClasses = async () => {
            console.log("TeacherHome: Fetching classes for user:", user);
            if (!user?.id) {
                console.log("TeacherHome: No user ID found");
                return;
            }
            try {
                const response = await api.get(`/teacher/my-classes?user_id=${user.id}`);
                console.log("TeacherHome: API Response:", JSON.stringify(response.data, null, 2));
                setClasses(response.data);
            } catch (error) {
                console.error('TeacherHome: Failed to fetch teacher classes:', error);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchClasses();
    }, [user]);

    const renderItem = ({ item }) => (
        <View style={[GLOBAL_STYLES.card, styles.classCard]}>
            <View style={styles.classInfo}>
                <View style={[styles.avatar, { backgroundColor: COLORS.accentDeep }]}>
                    <Text style={styles.avatarText}>{item.name.split('-')[0]}</Text>
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.className}>{item.name}</Text>
                    <View style={styles.subjectRow}>
                        {item.subjects.map(sub => (
                            <TouchableOpacity
                                key={sub.id}
                                style={styles.subjectPill}
                                onPress={() => navigation.navigate('ClassChat', {
                                    classId: item.id,
                                    className: item.name,
                                    subjectId: sub.id,
                                    subjectName: sub.name
                                })}
                            >
                                <Text style={styles.subjectPillText}>{sub.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={GLOBAL_STYLES.title}>Welcome, {user?.name?.split(' ')[1] || 'Teacher'}</Text>
                <Text style={GLOBAL_STYLES.subtitle}>Manage your class attendance and subjects.</Text>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={COLORS.accent} />
                </View>
            ) : (
                <FlatList
                    data={classes}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}
            <BottomNav />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { padding: 24, paddingBottom: 12 },
    list: { padding: 20, paddingTop: 0 },
    classCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        padding: 16
    },
    classInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    avatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    textContainer: { flex: 1 },
    className: { fontSize: 17, fontWeight: '700', color: COLORS.text },
    subjectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
    subjectPill: { backgroundColor: COLORS.accentSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    subjectPillText: { fontSize: 11, color: COLORS.accentDeep, fontWeight: '700' },
});

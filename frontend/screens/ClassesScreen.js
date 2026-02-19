import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
// import { supabase } from '../services/supabaseClient'; (Disabled for Demo)
import { useNavigation } from '@react-navigation/native';

export default function ClassesScreen() {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();

    useEffect(() => {
        // Mock data for demo purposes
        const mockClasses = [
            { id: '1', class_name: 'Grade 10-A', subject: 'Mathematics' },
            { id: '2', class_name: 'Grade 11-B', subject: 'Physics' },
            { id: '3', class_name: 'Grade 12-C', subject: 'Computer Science' },
        ];

        setTimeout(() => {
            setClasses(mockClasses);
            setLoading(false);
        }, 1000);
    }, []);

    const fetchClasses = async () => {
        // Logic moved to useEffect for demo
    };

    const handleLogout = async () => {
        // Mock logout
        navigation.replace('Login');
    };

    const renderItem = ({ item }) => (
        <View style={styles.classCard}>
            <Text style={styles.className}>{item.class_name}</Text>
            <Text style={styles.subject}>{item.subject}</Text>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#16a34a" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Classes</Text>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={classes}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No classes assigned to you.</Text>
                }
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    logoutBtn: {
        padding: 8,
    },
    logoutText: {
        color: '#ef4444',
        fontWeight: '600',
    },
    listContent: {
        padding: 20,
    },
    classCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    className: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#334155',
        marginBottom: 4,
    },
    subject: {
        fontSize: 14,
        color: '#64748b',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: '#94a3b8',
        fontSize: 16,
    },
});

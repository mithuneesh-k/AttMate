import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ScrollView, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { COLORS, GLOBAL_STYLES } from '../styles/theme';
import api from '../api';

export default function ManageClasses() {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [newClassName, setNewClassName] = useState('');

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await api.get('/admin/classes');
            setClasses(response.data);
        } catch (error) {
            console.error('Failed to fetch classes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClass = async () => {
        if (!newClassName.trim()) return;
        try {
            await api.post('/admin/classes', { name: newClassName });
            setModalVisible(false);
            setNewClassName('');
            fetchClasses(); // Refresh list
            Alert.alert('Success', 'Class created successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to create class');
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={[GLOBAL_STYLES.card, styles.classCard]} activeOpacity={0.8}>
            <View style={styles.classInfo}>
                <View style={styles.classIcon}>
                    <Text style={styles.classIconText}>🏫</Text>
                </View>
                <View>
                    <Text style={styles.className}>{item.name}</Text>
                    <Text style={styles.classMeta}>ID: {item.id}</Text>
                </View>
            </View>
            <View style={styles.chevron}>
                <Text style={styles.chevronText}>→</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTitleArea}>
                    <Text style={GLOBAL_STYLES.title}>Manage Classes</Text>
                    <Text style={GLOBAL_STYLES.subtitle}>Configure class subjects and intake.</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                    <Text style={styles.addBtnText}>+ Add Class</Text>
                </TouchableOpacity>
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

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>New Class</Text>
                                <Text style={styles.modalSubtitle}>Enter details to create a new session.</Text>
                            </View>
                            <TouchableOpacity style={styles.closeBtnArea} onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeBtn}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>Class Identifier</Text>
                            <TextInput
                                style={GLOBAL_STYLES.input}
                                placeholder="e.g., 25CS-C"
                                value={newClassName}
                                onChangeText={setNewClassName}
                            />

                            <Text style={styles.label}>Student Roster (.csv / .xlsx)</Text>
                            <TouchableOpacity style={styles.uploadBox} onPress={() => Alert.alert('Notice', 'CSV upload available via admin web portal.')}>
                                <Text style={styles.uploadIcon}>📄</Text>
                                <Text style={styles.uploadText}>Tap to see instructions</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[GLOBAL_STYLES.btnPrimary, { marginTop: 30 }]}
                                onPress={handleCreateClass}
                            >
                                <Text style={GLOBAL_STYLES.btnText}>Create Class</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingBottom: 12
    },
    headerTitleArea: { flex: 1 },
    addBtn: {
        backgroundColor: COLORS.accentSoft,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)'
    },
    addBtnText: { color: COLORS.accentDeep, fontWeight: '700', fontSize: 13 },
    list: { padding: 20, paddingTop: 0 },
    classCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        padding: 16
    },
    classInfo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    classIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center'
    },
    classIconText: { fontSize: 20 },
    className: { fontWeight: '700', fontSize: 16, color: COLORS.text },
    classMeta: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
    chevronText: { color: COLORS.border, fontSize: 18, fontWeight: '700' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 20
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24
    },
    modalTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
    modalSubtitle: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
    closeBtnArea: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center'
    },
    closeBtn: { color: COLORS.muted, fontWeight: '700', fontSize: 14 },
    label: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 8, marginTop: 20 },
    uploadBox: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#f1f5f9',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fafafa',
    },
    uploadIcon: { fontSize: 28, marginBottom: 8 },
    uploadText: { fontSize: 13, color: COLORS.muted, fontWeight: '500' },
    searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    plusBtn: {
        backgroundColor: COLORS.accent,
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center'
    },
    plusBtnText: { color: '#fff', fontSize: 24, fontWeight: '600' },
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, marginBottom: 10 }
});

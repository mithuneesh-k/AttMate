import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { COLORS, GLOBAL_STYLES } from '../styles/theme';
import api from '../api';

export default function ManageFaculty() {
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        fetchFaculty();
    }, []);

    const fetchFaculty = async () => {
        try {
            const response = await api.get('/admin/faculty');
            setFaculty(response.data);
        } catch (error) {
            console.error('Failed to fetch faculty:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <View style={[GLOBAL_STYLES.card, styles.facultyCard]}>
            <View style={styles.facultyHeader}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                </View>
                <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.dept}>{item.department}</Text>
                </View>
            </View>
            <View style={styles.miniPill}>
                <Text style={styles.miniPillText}>User ID: {item.user_id}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleArea}>
                    <Text style={GLOBAL_STYLES.title}>Manage Faculty</Text>
                    <Text style={GLOBAL_STYLES.subtitle}>Directories and subject assignments.</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                    <Text style={styles.addBtnText}>+ Add Faculty</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={COLORS.accent} />
                </View>
            ) : (
                <FlatList
                    data={faculty}
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
                                <Text style={styles.modalTitle}>New Faculty</Text>
                                <Text style={styles.modalSubtitle}>Register a new professor profile.</Text>
                            </View>
                            <TouchableOpacity style={styles.closeBtnArea} onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeBtn}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput style={GLOBAL_STYLES.input} placeholder="e.g., Prof. Rajesh" />

                            <Text style={styles.label}>Official Email</Text>
                            <TextInput style={GLOBAL_STYLES.input} placeholder="rajesh@college.edu" />

                            <TouchableOpacity
                                style={[GLOBAL_STYLES.btnPrimary, { marginTop: 30 }]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={GLOBAL_STYLES.btnText}>Save Profile</Text>
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
    titleArea: { flex: 1 },
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
    facultyCard: { marginBottom: 16, padding: 16 },
    facultyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.accentDeep,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: '700', color: COLORS.text },
    dept: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
    editBtn: { padding: 6, backgroundColor: '#f1f5f9', borderRadius: 8 },
    editBtnText: { color: COLORS.muted, fontSize: 12, fontWeight: '600' },
    subjectContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    miniPill: {
        backgroundColor: COLORS.mint,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.1)'
    },
    miniPillText: { fontSize: 11, color: COLORS.accentDeep, fontWeight: '600' },

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
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 }
});

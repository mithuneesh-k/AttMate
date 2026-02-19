import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { COLORS, GLOBAL_STYLES } from '../styles/theme';
import api from '../api';

export default function ClassChat() {
    const route = useRoute();
    const navigation = useNavigation();
    const { classId, className, subjectId, subjectName } = route.params || {};
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef();

    // Load chat history when component mounts
    useEffect(() => {
        loadChatHistory();
    }, [classId, subjectId]);

    const loadChatHistory = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/chat/history/${classId}/${subjectId}`);
            setMessages(response.data.messages || []);
        } catch (error) {
            console.error('Failed to load chat history:', error);
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timestamp) => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return '12:00 PM';
        }
    };

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        const tempId = `temp_${Date.now()}`;
        const newMsg = {
            id: tempId,
            text: inputText,
            type: 'teacher',
            timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, newMsg]);
        const messageToSend = inputText;
        setInputText('');

        try {
            const response = await api.post(`/chat/?message=${encodeURIComponent(messageToSend)}&class_id=${classId}&subject_id=${subjectId}`);

            // Update user message with server ID and timestamp
            setMessages(prev => prev.map(msg =>
                msg.id === tempId
                    ? { ...msg, id: response.data.user_message_id, timestamp: response.data.timestamp }
                    : msg
            ));

            // Add system response
            const systemMsg = {
                id: response.data.system_message_id,
                text: response.data.response,
                type: 'system',
                timestamp: response.data.timestamp
            };
            setMessages(prev => [...prev, systemMsg]);

            if (!response.data.response.includes("Could not parse")) {
                setShowConfirm(true);
                setTimeout(() => setShowConfirm(false), 3000);
            }
        } catch (error) {
            // Remove temp message and show error
            setMessages(prev => prev.filter(msg => msg.id !== tempId));
            const errorMsg = {
                id: Date.now(),
                text: 'Error connecting to server. Please try again.',
                type: 'system',
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMsg]);
        }
        scrollRef.current?.scrollToEnd({ animated: true });
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.chatHeader}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{className ? className.charAt(0) : 'C'}</Text>
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.chatClass}>{className || 'Class'}</Text>
                        <Text style={styles.chatSubtitle} numberOfLines={1}>{subjectName || 'Attendance Overview'}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.statsBtn}
                        onPress={() => navigation.navigate('Stats', { classId, className })}
                    >
                        <Text style={styles.statsBtnText}>📊 Stats</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    ref={scrollRef}
                    style={styles.chatArea}
                    contentContainerStyle={styles.chatContent}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
                >
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={COLORS.accent} />
                            <Text style={styles.loadingText}>Loading chat history...</Text>
                        </View>
                    ) : messages.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>👋 Start a conversation!</Text>
                            <Text style={styles.emptySubtext}>Try: "101, 102 absent" or "Mark 103 as OD"</Text>
                        </View>
                    ) : (
                        messages.map(msg => (
                            <View key={msg.id} style={[styles.bubble, msg.type === 'system' ? styles.systemBubble : styles.teacherBubble]}>
                                <Text style={msg.type === 'system' ? styles.systemText : styles.teacherText}>{msg.text}</Text>
                                <Text style={[styles.timeText, msg.type === 'teacher' && { color: 'rgba(255,255,255,0.7)' }]}>
                                    {formatTime(msg.timestamp)}
                                </Text>
                            </View>
                        ))
                    )}
                </ScrollView>

                <View style={styles.footer}>
                    {showConfirm && (
                        <View style={styles.confirmPill}>
                            <Text style={styles.confirmText}>✅ Attendance updated successfully</Text>
                        </View>
                    )}

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="e.g. 133, 155 absent | 144 OD"
                            placeholderTextColor={COLORS.muted}
                            multiline
                        />
                        <TouchableOpacity
                            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                            onPress={sendMessage}
                            disabled={!inputText.trim()}
                        >
                            <Text style={styles.sendBtnText}>➔</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fdfdfd' },
    flex: { flex: 1 },
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.accentDeep, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
    headerInfo: { flex: 1, marginLeft: 12 },
    chatClass: { fontWeight: '800', fontSize: 16, color: COLORS.text },
    chatSubtitle: { fontSize: 11, color: COLORS.muted, marginTop: 1 },
    statsBtn: { backgroundColor: COLORS.accentSoft, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.1)' },
    statsBtnText: { color: COLORS.accentDeep, fontSize: 12, fontWeight: '700' },

    chatArea: { flex: 1, backgroundColor: '#fcfcfc' },
    chatContent: { padding: 20, paddingBottom: 40 },

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: COLORS.muted,
        fontWeight: '500',
    },

    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 13,
        color: COLORS.muted,
        textAlign: 'center',
        paddingHorizontal: 40,
    },

    bubble: { maxWidth: '85%', padding: 14, borderRadius: 20, marginBottom: 12 },
    systemBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#fff',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        // Shadow for bubble
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
    },
    teacherBubble: {
        alignSelf: 'flex-end',
        backgroundColor: COLORS.accent,
        borderBottomRightRadius: 4,
    },
    systemText: { color: COLORS.text, fontSize: 14, lineHeight: 20 },
    teacherText: { color: '#fff', fontSize: 14, lineHeight: 20 },
    timeText: { fontSize: 9, color: COLORS.muted, marginTop: 4, alignSelf: 'flex-end' },

    footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    confirmPill: {
        position: 'absolute',
        top: -40,
        alignSelf: 'center',
        backgroundColor: COLORS.mint,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    confirmText: { color: COLORS.accentDeep, fontSize: 12, fontWeight: '700' },

    inputContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
    input: {
        flex: 1,
        backgroundColor: '#f8fafc',
        borderRadius: 24,
        paddingHorizontal: 18,
        paddingVertical: 12,
        fontSize: 14,
        color: COLORS.text,
        maxHeight: 100,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    sendBtn: {
        backgroundColor: COLORS.accent,
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: { backgroundColor: '#f1f5f9' },
    sendBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' }
});


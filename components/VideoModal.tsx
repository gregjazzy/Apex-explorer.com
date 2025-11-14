// /components/VideoModal.tsx

import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface VideoModalProps {
    visible: boolean;
    onClose: () => void;
    youtubeUrl: string;
}

const VideoModal: React.FC<VideoModalProps> = ({ visible, onClose, youtubeUrl }) => {
    // Extraire l'ID de la vidéo YouTube
    const getYoutubeVideoId = (url: string): string | null => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = getYoutubeVideoId(youtubeUrl);
    const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : null;

    if (!embedUrl) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Bouton fermer */}
                    <TouchableOpacity 
                        style={styles.closeButton}
                        onPress={onClose}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.closeText}>✕</Text>
                    </TouchableOpacity>

                    {/* Vidéo YouTube */}
                    {isWeb ? (
                        <iframe
                            src={embedUrl}
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                borderRadius: 12,
                            }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    ) : (
                        <WebView
                            source={{ uri: embedUrl }}
                            style={styles.webview}
                            allowsFullscreenVideo={true}
                            mediaPlaybackRequiresUserAction={false}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: isWeb ? Math.min(width * 0.8, 800) : width * 0.95,
        height: isWeb ? Math.min(width * 0.8 * 0.5625, 450) : height * 0.5,
        backgroundColor: '#000',
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: -40,
        right: 0,
        width: 36,
        height: 36,
        backgroundColor: '#FFF',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    closeText: {
        fontSize: 20,
        color: '#000',
        fontWeight: '600',
    },
    webview: {
        flex: 1,
        backgroundColor: '#000',
    },
});

export default VideoModal;


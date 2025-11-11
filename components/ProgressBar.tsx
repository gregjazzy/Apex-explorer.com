// /components/ProgressBar.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
    progress: number; // Valeur entre 0 et 1
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
    const percentage = Math.round(progress * 100);
    return (
        <View style={progressStyles.container}>
            <View style={[progressStyles.bar, { width: `${percentage}%` }]} />
            <Text style={progressStyles.text}>{percentage}%</Text>
        </View>
    );
};

const progressStyles = StyleSheet.create({
    container: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
        marginTop: 10,
        marginBottom: 10,
        position: 'relative',
    },
    bar: {
        height: '100%',
        backgroundColor: '#3B82F6',
        borderRadius: 4,
    },
    text: {
        position: 'absolute',
        right: 0,
        top: -20, // Positionnement au-dessus de la barre
        fontSize: 12,
        fontWeight: 'bold',
        color: '#3B82F6',
    }
});

export default ProgressBar;


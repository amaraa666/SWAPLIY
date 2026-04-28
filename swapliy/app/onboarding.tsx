import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function OnboardingScreen() {
    const router = useRouter();

    const handleNext = () => {
        router.replace('/login');
    };

    return (
            <LinearGradient
                colors={['#fff', '#5e5e5e']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 0, y: 1 }}
                style={styles.container}
            >
                <View style={styles.content}>
                    <View style={styles.imageContainer}>
                        <Image
                            style={styles.illustration}
                            source={require('.././assets/images/image3.png')}
                        />
                    </View>

                    <View style={styles.textContainer}>
                        <Text style={styles.mainText}>
                            Swap what you have for
                        </Text>
                        <Text style={styles.SubText}>what you need.</Text>
                    </View>

                    {/* Gradient Button */}
                    <TouchableOpacity style={{ width: '100%' }} onPress={handleNext} activeOpacity={0.8}>
                        <LinearGradient
                            colors={['#1ECE90', '#FFD700']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.button}

                        >
                            <Text style={styles.buttonText}>Next →</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    content: {
        flex: 1,
        width: '100%',
        justifyContent: 'space-between',
        paddingVertical: 40,
        alignItems: 'center',
    },
    topLabel: {
        fontSize: 14,
        color: '#999',
        fontWeight: '500',
        marginTop: 20,
        alignSelf: 'flex-start',
    },
    imageContainer: {
        width: 300,
        height: 420,
    },
    illustration: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    mainText: {
        fontSize: 48,
        fontWeight: '600',
        color: '#333',
    },
    SubText: {
        fontSize: 48,
        fontWeight: '600',
        color: '#fff',
    },
    highlightText: {
        color: '#fff',
        fontWeight: '700',
        textShadowColor: '#1ECE90',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 0,
    },
    button: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
});

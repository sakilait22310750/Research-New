import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const Onboarding3Screen = ({ navigation }) => {
    const handleGetStarted = async () => {
        try {
            // Mark onboarding as viewed so it doesn't show again
            await AsyncStorage.setItem('has_viewed_onboarding', 'true');

            // Navigate to Main tabs
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        } catch (error) {
            console.error('Error saving onboarding status:', error);
            // Fallback navigation even if save fails
            navigation.navigate('Login');
        }
    };

    return (
        <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?q=80&w=1400&auto=format&fit=crop' }}
            style={styles.background}
        >
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.logoText}>TripSense</Text>
                </View>

                {/* Content */}
                <View style={styles.contentContainer}>
                    <Text style={styles.title}>Experience the Beauty of the Wild</Text>
                    <Text style={styles.description}>
                        Whether you seek the calm of the forest or the thrill of the sea, Trava connects you to nature's wonders anytime, anywhere.
                    </Text>

                    {/* Bottom Bar */}
                    <View style={styles.bottomBar}>
                        {/* Progress indicators */}
                        <View style={styles.progressContainer}>
                            <View style={styles.progressDot} />
                            <View style={styles.progressDot} />
                            <View style={[styles.progressDot, styles.activeDot]} />
                        </View>

                        {/* Navigation Buttons */}
                        <View style={styles.navButtonsContainer}>
                            <TouchableOpacity
                                style={styles.prevButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Ionicons name="chevron-back" size={16} color="#ffffff" />
                                <Text style={styles.prevButtonText}>Previous</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.getStartedButton}
                                onPress={handleGetStarted}
                            >
                                <Text style={styles.getStartedButtonText}>Get Started</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    safeArea: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center', // Centered since no Skip button here
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'android' ? 40 : 10,
    },
    logoText: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 1,
    },
    contentContainer: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    title: {
        color: '#ffffff',
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 16,
        lineHeight: 40,
    },
    description: {
        color: '#e2e8f0',
        fontSize: 15,
        lineHeight: 24,
        marginBottom: 40,
    },
    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    progressDot: {
        width: 24,
        height: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderRadius: 2,
    },
    activeDot: {
        backgroundColor: '#ffffff',
    },
    navButtonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    prevButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    prevButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 2,
    },
    getStartedButton: {
        backgroundColor: '#0d9488', // Teal
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 30,
    },
    getStartedButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default Onboarding3Screen;

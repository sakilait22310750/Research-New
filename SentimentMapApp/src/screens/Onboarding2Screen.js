import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Onboarding2Screen = ({ navigation }) => {
    return (
        <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1400&auto=format&fit=crop' }}
            style={styles.background}
        >
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.logoText}>TripSense</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.skipText}>Skip</Text>
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.contentContainer}>
                    <Text style={styles.title}>Travel Made Simple</Text>
                    <Text style={styles.description}>
                        Choose your destination, transportation, and payment method effortlessly. Trava makes planning your perfect getaway fast and worry-free.
                    </Text>

                    {/* Bottom Bar */}
                    <View style={styles.bottomBar}>
                        {/* Progress indicators */}
                        <View style={styles.progressContainer}>
                            <View style={styles.progressDot} />
                            <View style={[styles.progressDot, styles.activeDot]} />
                            <View style={styles.progressDot} />
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
                                style={styles.nextButton}
                                onPress={() => navigation.navigate('Onboarding3')}
                            >
                                <Text style={styles.nextButtonText}>Next</Text>
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
        justifyContent: 'space-between',
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
    skipText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '500',
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
        gap: 20,
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
    nextButton: {
        backgroundColor: '#0d9488', // Teal
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 30,
    },
    nextButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default Onboarding2Screen;

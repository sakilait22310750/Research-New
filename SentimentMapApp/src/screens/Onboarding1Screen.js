import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, SafeAreaView, Platform } from 'react-native';

const Onboarding1Screen = ({ navigation }) => {
    return (
        <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1540206395-68808572332f?q=80&w=1400&auto=format&fit=crop' }}
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
                    <Text style={styles.title}>Your Next Adventure Awaits</Text>
                    <Text style={styles.description}>
                        Discover breathtaking destinations from serene beaches to majestic mountains, all in one app. Book your dream trip in just a few taps with Trava.
                    </Text>

                    {/* Bottom Bar */}
                    <View style={styles.bottomBar}>
                        {/* Progress indicators */}
                        <View style={styles.progressContainer}>
                            <View style={[styles.progressDot, styles.activeDot]} />
                            <View style={styles.progressDot} />
                            <View style={styles.progressDot} />
                        </View>

                        {/* Next Button */}
                        <TouchableOpacity
                            style={styles.nextButton}
                            onPress={() => navigation.navigate('Onboarding2')}
                        >
                            <Text style={styles.nextButtonText}>Next</Text>
                        </TouchableOpacity>
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
        backgroundColor: 'rgba(0,0,0,0.3)', // Dark overlay for text readability
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

export default Onboarding1Screen;

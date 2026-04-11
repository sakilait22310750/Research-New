import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Image,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/apiService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Convert 0-100 percentage to 0-5 star rating
const getSentimentStars = (sentiment) => {
    return Math.min(5, Math.max(0, (sentiment / 100) * 5));
};

const MAPPED_RATINGS = {
    'temple of the sacred tooth relic': 4.3,
    'temple of sacred tooth relic': 4.3,
    'galle fort': 4.7,
    'jaya sri maha bodhi': 4.3,
    'victoria park': 4.3,
    'victoria park of nuwara eliya': 4.3,
    'diyaluma falls': 4.5,
    'negambo beach': 3.9,
    'negombo beach': 3.9,
    'royal botanical garden': 4.7,
    'bentota beach': 4.8,
    'jungle beach': 4.1,
    'hikkaduwa beach': 4.4,
    'mirissa beach': 4.8,
    'nilaveli beach': 4.5,
    'pinnawala elephant orphanage': 3.9,
    'sigiriya': 4.7,
    'sigiriya the anctient rock fortness': 4.7,
    'sigiriya the ancient rock fortress': 4.7,
    'dambulla cave temple': 4.6,
    'horton plains': 4.6,
    'ravana ella falls': 4.2,
    'udawalawe national park': 4.6,
    'minneriya national ark': 4.4,
    'minneriya national park': 4.4,
    'polonnaruwa': 4.4,
};

const getTrueRating = (locationName, fallbackSentiment) => {
    if (!locationName) return getSentimentStars(fallbackSentiment);
    const name = locationName.toLowerCase().trim();

    if (MAPPED_RATINGS[name]) return MAPPED_RATINGS[name];

    for (const [key, rating] of Object.entries(MAPPED_RATINGS)) {
        if (name.includes(key) || key.includes(name)) {
            return rating;
        }
    }

    return getSentimentStars(fallbackSentiment);
};

// Render star icons based on a 0-5 float rating
const StarRating = ({ rating, size = 16, color = '#f59e0b' }) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
    const filledStars = rating - fullStars >= 0.75 ? fullStars + 1 : fullStars;

    for (let i = 0; i < 5; i++) {
        if (i < filledStars) {
            stars.push(<Ionicons key={i} name="star" size={size} color={color} />);
        } else if (i === fullStars && hasHalf) {
            stars.push(<Ionicons key={i} name="star-half" size={size} color={color} />);
        } else {
            stars.push(<Ionicons key={i} name="star-outline" size={size} color={color} />);
        }
    }
    return <View style={{ flexDirection: 'row', alignItems: 'center' }}>{stars}</View>;
};

// Get image source from backend (same approach as original, works on phones)
const getImageSource = (imagePath) => {
    if (!imagePath) return null;
    const correctBaseUrl = apiService.baseUrl.replace('/api', '');
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        const fixedUrl = imagePath
            .replace(/http:\/\/127\.0\.0\.1:\d+/, correctBaseUrl)
            .replace(/http:\/\/localhost:\d+/, correctBaseUrl);
        return { uri: fixedUrl };
    }
    if (imagePath.startsWith('/api/images/')) {
        return { uri: `${correctBaseUrl}${imagePath}` };
    }
    return null;
};

// Build a direct URL to the first local image (0.jpg) for a given location name
const getFirstLocalImage = (locationName) => {
    if (!locationName) return null;
    const correctBaseUrl = apiService.baseUrl.replace('/api', '');
    const encoded = encodeURIComponent(locationName);
    return { uri: `${correctBaseUrl}/api/images/${encoded}/0.jpg` };
};

const RecommendationCard = ({ location, onPress, horizontal = false }) => {
    const [imageError, setImageError] = useState(false);

    const starRating = getTrueRating(location.location, location.overallSentiment);
    const ratingText = starRating.toFixed(1);

    // Always use the first local image (0.jpg) for the location; fall back to
    // backend-provided images only if the local image fails to load.
    const localFirstImage = getFirstLocalImage(location.location);
    const backendFirstImage = location.images && location.images.length > 0
        ? getImageSource(location.images[0])
        : null;
    const imageSource = !imageError ? (localFirstImage || backendFirstImage) : backendFirstImage;

    // ── Horizontal card (home page horizontal scroll) ─────────────
    if (horizontal) {
        return (
            <Pressable onPress={onPress} style={styles.horizontalCardContainer}>
                <View style={styles.card}>
                    <View style={styles.horizontalImageContainer}>
                        {imageSource ? (
                            <Image
                                source={imageSource}
                                style={styles.horizontalImage}
                                resizeMode="cover"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <View style={[styles.horizontalImage, styles.imagePlaceholder]}>
                                <Ionicons name="image-outline" size={40} color="#9ca3af" />
                            </View>
                        )}
                    </View>

                    {/* Location name + stars below image */}
                    <View style={styles.horizontalCardBottom}>
                        <Text style={styles.horizontalLocationName} numberOfLines={1}>
                            {location.location}
                        </Text>
                        <View style={styles.horizontalStarRow}>
                            <StarRating rating={starRating} size={13} />
                            <Text style={styles.ratingText}>{ratingText}</Text>
                        </View>
                    </View>
                </View>
            </Pressable>
        );
    }

    // ── Vertical card layout (Recommendations screen) ─────────────
    return (
        <Pressable onPress={onPress} style={styles.cardContainer}>
            <View style={styles.card}>

                {/* Top: Location name + favourite icon */}
                <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.locationName} numberOfLines={1}>
                            {location.location}
                        </Text>
                        <Text style={styles.locationSubtitle}>Sri Lanka • Attraction</Text>
                    </View>
                    <View style={styles.favouriteButton}>
                        <Ionicons name="heart-outline" size={18} color="#0c2340" />
                    </View>
                </View>

                {/* Large image — no overlay */}
                <View style={styles.imageContainer}>
                    {imageSource ? (
                        <Image
                            source={imageSource}
                            style={styles.locationImage}
                            resizeMode="cover"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <View style={[styles.locationImage, styles.imagePlaceholder]}>
                            <Ionicons name="image-outline" size={48} color="#9ca3af" />
                            <Text style={styles.placeholderText}>{location.location}</Text>
                        </View>
                    )}
                </View>

                {/* Bottom row: star rating */}
                <View style={styles.cardFooter}>
                    <StarRating rating={starRating} size={16} />
                    <Text style={styles.starRatingText}>{ratingText} reviews</Text>
                </View>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    // Shared card base
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
    },

    // ── Vertical card ────────────────────────────────────────────
    cardContainer: {
        marginBottom: 18,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    headerLeft: {
        flex: 1,
        marginRight: 10,
    },
    locationName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0c2340',
        marginBottom: 3,
    },
    locationSubtitle: {
        fontSize: 13,
        color: '#6b7280',
    },
    favouriteButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageContainer: {
        width: '100%',
        height: 200,
    },
    locationImage: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        backgroundColor: '#e5e7eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 13,
        color: '#9ca3af',
        marginTop: 6,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    starRatingText: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '500',
    },

    // ── Horizontal card (home page) ───────────────────────────────
    horizontalCardContainer: {
        width: SCREEN_WIDTH * 0.65,
        marginRight: 14,
    },
    horizontalImageContainer: {
        width: '100%',
        height: 160,
    },
    horizontalImage: {
        width: '100%',
        height: '100%',
    },
    horizontalCardBottom: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 4,
    },
    horizontalLocationName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0c2340',
        marginBottom: 4,
    },
    horizontalStarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    ratingText: {
        fontSize: 12,
        color: '#6b7280',
    },
});

export default RecommendationCard;


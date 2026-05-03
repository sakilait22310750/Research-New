import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
  FlatList,
  Dimensions,
  PanResponder,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, Hotel } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { getPlaceholderImage } from '@/utils/imageUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HotelDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const token = useAuthStore((state) => state.token);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [hotelDetails, setHotelDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<Array<{url: string; index: number}>>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const carouselRef = useRef<FlatList>(null);
  const thumbnailScrollRef = useRef<ScrollView>(null);

  // Handle swipe gestures on main image
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (images.length <= 1) return;
        
        const swipeThreshold = 50;
        if (gestureState.dx > swipeThreshold && currentImageIndex > 0) {
          // Swipe right - go to previous image
          setCurrentImageIndex(currentImageIndex - 1);
        } else if (gestureState.dx < -swipeThreshold && currentImageIndex < images.length - 1) {
          // Swipe left - go to next image
          setCurrentImageIndex(currentImageIndex + 1);
        }
      },
    })
  ).current;

  // Scroll thumbnail to active image
  useEffect(() => {
    if (thumbnailScrollRef.current && images.length > 1) {
      const thumbnailWidth = 80 + 8; // thumbnail width + margin
      const scrollPosition = Math.max(0, (currentImageIndex * thumbnailWidth) - (SCREEN_WIDTH / 2) + (thumbnailWidth / 2));
      thumbnailScrollRef.current.scrollTo({
        x: scrollPosition,
        animated: true,
      });
    }
  }, [currentImageIndex, images.length]);

  useEffect(() => {
    const loadHotel = async () => {
      if (!id) {
        setError('Hotel ID is missing');
        setLoading(false);
        return;
      }

      const hotelId = Array.isArray(id) ? id[0] : id;

      try {
        setLoading(true);
        // Try to get hotel details directly first
        try {
          const details = await api.getHotelDetails(hotelId, token || undefined);
          // Store full hotel details (including reviews)
          setHotelDetails(details);
          // Convert the details to Hotel format
          setHotel({
            id: details.id,
            hotel_id: details.hotel_id,
            name: details.name,
            location: details.location,
            rating: details.rating,
            total_reviews: details.total_reviews,
          });
        } catch (detailsError) {
          // Fallback to search if direct lookup fails
          const results = await api.searchHotels(hotelId.toString(), token || undefined);
          const foundHotel = results.find((h) => h.hotel_id?.toString() === hotelId.toString() || h.id === hotelId);
          
          if (foundHotel) {
            setHotel(foundHotel);
          } else {
            setError('Hotel not found');
          }
        }
      } catch (err) {
        console.error('Error loading hotel:', err);
        setError('Failed to load hotel details');
      } finally {
        setLoading(false);
      }
    };

    loadHotel();
  }, [id, token]);

  // Load all images from backend - filtered by hotel_id, no duplicates
  useEffect(() => {
    if (!hotel) return;

    const loadImages = async () => {
      setImagesLoading(true);
      try {
        const hotelId = hotel.hotel_id || hotel.id;
        console.log('Loading images for hotel ID:', hotelId);
        
        // Try to get all images for THIS specific hotel
        const imageList = await api.getHotelImages(hotelId);
        console.log('Received images:', imageList?.length || 0, imageList);
        
        if (imageList && imageList.length > 0) {
          // Remove duplicates by URL and filter to ensure we only have images for this hotel
          const seenUrls = new Set<string>();
          const uniqueImages = [];
          
          for (let idx = 0; idx < imageList.length; idx++) {
            const img = imageList[idx];
            const imageUrl = img.url || img;
            
            // Skip if we've seen this URL before or if it's not for this hotel
            if (!seenUrls.has(imageUrl) && imageUrl.includes(`hotel-images/${hotelId}`)) {
              seenUrls.add(imageUrl);
              uniqueImages.push({
                url: imageUrl,
                index: uniqueImages.length,
                hotelId: hotelId,
              });
            }
          }
          
          console.log('Unique images after filtering:', uniqueImages.length);
          
          if (uniqueImages.length > 0) {
            setImages(uniqueImages);
            setCurrentImageIndex(0);
          } else {
            // Fallback to single image
            const fallbackUrl = hotel.image_url || getPlaceholderImage();
            setImages([{ url: fallbackUrl, index: 0, hotelId: hotelId }]);
          }
        } else {
          // Fallback to single image if no images found
          const fallbackUrl = hotel.image_url || getPlaceholderImage();
          setImages([{ url: fallbackUrl, index: 0, hotelId: hotelId }]);
        }
      } catch (error) {
        console.error('Error loading images:', error);
        // Fallback to placeholder or single image
        const fallbackUrl = hotel.image_url || getPlaceholderImage();
        setImages([{ url: fallbackUrl, index: 0, hotelId: hotel.hotel_id || hotel.id }]);
      } finally {
        setImagesLoading(false);
      }
    };

    loadImages();
  }, [hotel]);

  const handleBookNow = () => {
    if (!hotel) return;
    router.push({
      pathname: '/booking/details',
      params: { hotelId: hotel.hotel_id || hotel.id },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading hotel details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !hotel) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text style={styles.errorText}>{error || 'Hotel not found'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        {/* Header Section with Badges and Tags */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <View style={styles.geniusBadge}>
              <Text style={styles.geniusText}>Genius</Text>
            </View>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= Math.floor(hotel.rating) ? 'star' : 'star-outline'}
                  size={16}
                  color="#f59e0b"
                />
              ))}
            </View>
          </View>
          <View style={styles.tagsRow}>
            <View style={styles.tag}>
              <Ionicons name="water" size={14} color="#2563eb" />
              <Text style={styles.tagText}>Beachfront</Text>
            </View>
            <View style={styles.tag}>
              <Ionicons name="beach" size={14} color="#2563eb" />
              <Text style={styles.tagText}>Private Beach</Text>
            </View>
          </View>
        </View>

        {/* Hotel Name and Address */}
        <View style={styles.hotelHeader}>
          <Text style={styles.hotelName}>{hotel.name}</Text>
          <View style={styles.addressRow}>
            <Ionicons name="location" size={16} color="#2563eb" />
            <Text style={styles.address}>{hotel.location}</Text>
            <TouchableOpacity>
              <Text style={styles.mapLink}>Great location - show map</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Image Display */}
        <View style={styles.mainImageContainer} {...panResponder.panHandlers}>
          {imagesLoading ? (
            <View style={styles.imageLoadingContainer}>
              <ActivityIndicator size="large" color="#10b981" />
            </View>
          ) : images.length > 0 ? (
            <>
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: images[currentImageIndex]?.url }}
                  style={styles.mainImage}
                  resizeMode="cover"
                  defaultSource={{ uri: getPlaceholderImage() }}
                  onError={() => {
                    console.error('Failed to load main image:', images[currentImageIndex]?.url);
                  }}
                />
              </View>
              {images.length > 1 && (
                <View style={styles.mainImageOverlay}>
                  <View style={styles.imageCounter}>
                    <Text style={styles.imageCounterText}>
                      {currentImageIndex + 1} / {images.length}
                    </Text>
                  </View>
                </View>
              )}
            </>
          ) : (
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: getPlaceholderImage() }}
                style={styles.mainImage}
                resizeMode="cover"
              />
            </View>
          )}
        </View>

        {/* Thumbnail Gallery */}
        {images.length > 1 && !imagesLoading && (
          <View style={styles.thumbnailContainer}>
            <ScrollView
              ref={thumbnailScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailScrollContent}
            >
              {images.map((image, index) => (
                <TouchableOpacity
                  key={`thumb-${image.index || index}-${index}`}
                  onPress={() => {
                    setCurrentImageIndex(index);
                  }}
                  style={[
                    styles.thumbnailWrapper,
                    index === currentImageIndex && styles.thumbnailWrapperActive,
                  ]}
                >
                  <Image
                    source={{ uri: image.url }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                    defaultSource={{ uri: getPlaceholderImage() }}
                    onError={() => {
                      console.error('Failed to load thumbnail:', image.url);
                    }}
                  />
                  {index === currentImageIndex && (
                    <View style={styles.thumbnailOverlay} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Hotel Details Section - Below Images */}
        <View style={styles.contentSection}>
          <Text style={styles.description}>
            {hotel.name} is tucked away amid beautiful sea views. Located in {hotel.location}, 
            this beach property features an outdoor swimming pool, spa and spacious guestrooms 
            fitted with free Wi-Fi access. The property offers large windows which offer ample 
            natural light, beautifully decorated rooms with modern amenities for a comfortable stay.
          </Text>
        </View>

        <View style={styles.content}>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              <View style={styles.amenityItem}>
                <Ionicons name="wifi" size={20} color="#10b981" />
                <Text style={styles.amenityLabel}>Free WiFi</Text>
              </View>
              <View style={styles.amenityItem}>
                <Ionicons name="restaurant" size={20} color="#10b981" />
                <Text style={styles.amenityLabel}>Restaurant</Text>
              </View>
              <View style={styles.amenityItem}>
                <Ionicons name="water" size={20} color="#10b981" />
                <Text style={styles.amenityLabel}>Pool</Text>
              </View>
              <View style={styles.amenityItem}>
                <Ionicons name="fitness" size={20} color="#10b981" />
                <Text style={styles.amenityLabel}>Gym</Text>
              </View>
              <View style={styles.amenityItem}>
                <Ionicons name="car" size={20} color="#10b981" />
                <Text style={styles.amenityLabel}>Parking</Text>
              </View>
              <View style={styles.amenityItem}>
                <Ionicons name="airplane" size={20} color="#10b981" />
                <Text style={styles.amenityLabel}>Airport Shuttle</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            <View style={styles.pricingCard}>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Starting from</Text>
                <Text style={styles.pricingValue}>$85</Text>
              </View>
              <Text style={styles.pricingSubtext}>per night</Text>
            </View>
          </View>

          {/* Reviews Section */}
          {hotelDetails?.reviews && hotelDetails.reviews.length > 0 && (
            <View style={styles.section}>
              <View style={styles.reviewsHeader}>
                <Text style={styles.sectionTitle}>Reviews</Text>
                <Text style={styles.reviewsCount}>
                  {hotelDetails.total_reviews || hotelDetails.reviews.length} reviews
                </Text>
              </View>
              
              {/* Review Summary */}
              {hotelDetails.positive_reviews !== undefined && (
                <View style={styles.reviewSummary}>
                  <View style={styles.reviewSummaryItem}>
                    <Ionicons name="thumbs-up" size={16} color="#10b981" />
                    <Text style={styles.reviewSummaryText}>
                      {hotelDetails.positive_reviews} Positive
                    </Text>
                  </View>
                  <View style={styles.reviewSummaryItem}>
                    <Ionicons name="thumbs-down" size={16} color="#ef4444" />
                    <Text style={styles.reviewSummaryText}>
                      {hotelDetails.negative_reviews} Negative
                    </Text>
                  </View>
                  <View style={styles.reviewSummaryItem}>
                    <Ionicons name="remove-circle" size={16} color="#6b7280" />
                    <Text style={styles.reviewSummaryText}>
                      {hotelDetails.neutral_reviews} Neutral
                    </Text>
                  </View>
                </View>
              )}

              {/* Reviews List */}
              <View style={styles.reviewsList}>
                {(showAllReviews ? hotelDetails.reviews : hotelDetails.reviews.slice(0, 3)).map((review: any, index: number) => (
                  <View key={index} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewHeaderLeft}>
                        <View style={styles.reviewAvatar}>
                          <Ionicons name="person" size={20} color="#6b7280" />
                        </View>
                        <View style={styles.reviewInfo}>
                          <Text style={styles.reviewAuthor}>
                            {review.user_name || 'Anonymous Guest'}
                          </Text>
                          <View style={styles.reviewMeta}>
                            <View style={styles.reviewStars}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Ionicons
                                  key={star}
                                  name={star <= (review.rating || 5) ? 'star' : 'star-outline'}
                                  size={12}
                                  color="#f59e0b"
                                />
                              ))}
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.reviewText}>
                      {review.review_text || review.text || 'No review text available'}
                    </Text>
                  </View>
                ))}
              </View>
              
              {/* Show More/Less Button */}
              {hotelDetails.reviews.length > 3 && (
                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={() => setShowAllReviews(!showAllReviews)}
                >
                  <Text style={styles.showMoreButtonText}>
                    {showAllReviews 
                      ? `Show Less Reviews` 
                      : `Show All Reviews (${hotelDetails.reviews.length})`}
                  </Text>
                  <Ionicons 
                    name={showAllReviews ? 'chevron-up' : 'chevron-down'} 
                    size={18} 
                    color="#10b981" 
                  />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Contact & Info Section */}
          {(hotelDetails?.google_maps_url || hotelDetails?.website || hotelDetails?.phone) && (
            <View style={[styles.section, styles.contactSection]}>
              <Text style={styles.sectionTitle}>Contact & Info</Text>

              {hotelDetails?.google_maps_url && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => Linking.openURL(hotelDetails.google_maps_url)}
                >
                  <Ionicons name="map-outline" size={22} color="#2563eb" />
                  <Text style={styles.contactLink}>Open in Google Maps</Text>
                </TouchableOpacity>
              )}

              {hotelDetails?.website && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => Linking.openURL(
                    hotelDetails.website.startsWith('http')
                      ? hotelDetails.website
                      : `https://${hotelDetails.website}`
                  )}
                >
                  <Ionicons name="globe-outline" size={22} color="#2563eb" />
                  <Text style={styles.contactLink} numberOfLines={1}>
                    {hotelDetails.website.replace(/^https?:\/\//, '')}
                  </Text>
                </TouchableOpacity>
              )}

              {hotelDetails?.phone && (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => Linking.openURL(`tel:${hotelDetails.phone}`)}
                >
                  <Ionicons name="call-outline" size={22} color="#2563eb" />
                  <Text style={styles.contactLink}>{hotelDetails.phone}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>


      <View style={styles.footer}>
        <View style={styles.priceFooter}>
          <Text style={styles.priceLabel}>From</Text>
          <Text style={styles.priceAmount}>$85</Text>
          <Text style={styles.priceUnit}>/night</Text>
        </View>
        <TouchableOpacity style={styles.bookButton} onPress={handleBookNow}>
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  geniusBadge: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  geniusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 6,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2563eb',
  },
  hotelHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  address: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  mapLink: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  mainImageContainer: {
    width: '100%',
    aspectRatio: 3 / 2,
    backgroundColor: '#f3f4f6',
    position: 'relative',
    overflow: 'hidden',
  },
  imageLoadingContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
  },
  mainImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    alignItems: 'flex-end',
  },
  imageCounter: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  thumbnailContainer: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 4,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  thumbnailScrollContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  thumbnailWrapper: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  thumbnailWrapperActive: {
    borderColor: '#10b981',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
  },
  thumbnailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  contentSection: {
    padding: 20,
    paddingTop: 24,
    backgroundColor: '#fff',
    width: '100%',
  },
  content: {
    padding: 20,
    backgroundColor: '#fff',
  },
  hotelName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 0,
    marginTop: 0,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '48%',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  amenityLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  pricingCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  pricingLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  pricingValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10b981',
  },
  pricingSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    // Shadow properties for native platforms
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    // boxShadow for web (react-native-web)
    boxShadow: '0px -2px 8px 0px rgba(0, 0, 0, 0.1)',
  },
  priceFooter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  priceUnit: {
    fontSize: 14,
    color: '#6b7280',
  },
  bookButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewsCount: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  reviewSummary: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  reviewSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewSummaryText: {
    fontSize: 13,
    color: '#6b7280',
  },
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  reviewHeader: {
    marginBottom: 12,
  },
  reviewHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewInfo: {
    flex: 1,
  },
  reviewAuthor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  emotionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  emotionBadgeJoy: {
    backgroundColor: '#d1fae5',
  },
  emotionBadgeSad: {
    backgroundColor: '#fee2e2',
  },
  emotionBadgeAnger: {
    backgroundColor: '#fee2e2',
  },
  emotionText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },
  reviewText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  sentimentBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  sentimentFill: {
    height: '100%',
    borderRadius: 2,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  showMoreButtonText: {
    fontSize: 15,
    color: '#10b981',
    fontWeight: '600',
  },
  contactSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  contactLink: {
    fontSize: 15,
    color: '#2563eb',
    fontWeight: '500',
    flex: 1,
  },
});



















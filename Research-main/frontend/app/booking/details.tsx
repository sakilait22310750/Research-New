import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function BookingDetailsScreen() {
  const router = useRouter();
  const { hotelId } = useLocalSearchParams();
  const [checkIn, setCheckIn] = useState(new Date());
  const [checkOut, setCheckOut] = useState(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);

  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const ratePerNight = 85;
  const totalAmount = ratePerNight * nights * rooms;

  const handleNext = () => {
    router.push({
      pathname: '/booking/guest-info',
      params: {
        hotelId,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        guests,
        rooms,
        total: totalAmount,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
            <Text style={styles.backText}>Back to Recommendations</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressStep}>
            <View style={[styles.progressCircle, styles.progressCircleActive]}>
              <Text style={styles.progressNumberActive}>1</Text>
            </View>
            <Text style={[styles.progressLabel, styles.progressLabelActive]}>
              Booking Details
            </Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={styles.progressCircle}>
              <Text style={styles.progressNumber}>2</Text>
            </View>
            <Text style={styles.progressLabel}>Guest Information</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={styles.progressCircle}>
              <Text style={styles.progressNumber}>3</Text>
            </View>
            <Text style={styles.progressLabel}>Confirmation</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Hotel Details */}
          <View style={styles.hotelCard}>
            <View style={styles.hotelImage}>
              <Ionicons name="bed" size={40} color="#10b981" />
            </View>
            <Text style={styles.hotelName}>Heritage Villa Kandy</Text>
            <View style={styles.hotelLocation}>
              <Ionicons name="location-outline" size={16} color="#6b7280" />
              <Text style={styles.locationText}>Kandy, Sri Lanka</Text>
            </View>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= 4 ? 'star' : 'star-outline'}
                  size={16}
                  color="#f59e0b"
                />
              ))}
              <Text style={styles.ratingText}>4.6</Text>
            </View>

            <View style={styles.amenitiesRow}>
              <View style={styles.amenityTag}>
                <Ionicons name="leaf" size={14} color="#10b981" />
                <Text style={styles.amenityText}>Garden</Text>
              </View>
              <View style={styles.amenityTag}>
                <Ionicons name="wifi" size={14} color="#10b981" />
                <Text style={styles.amenityText}>WiFi</Text>
              </View>
              <View style={styles.amenityTag}>
                <Ionicons name="restaurant" size={14} color="#10b981" />
                <Text style={styles.amenityText}>Restaurant</Text>
              </View>
            </View>

            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Booking Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Rate per night</Text>
                <Text style={styles.summaryValue}>${ratePerNight}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Number of nights</Text>
                <Text style={styles.summaryValue}>{nights}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Number of rooms</Text>
                <Text style={styles.summaryValue}>{rooms}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.summaryTotalLabel}>Total Amount</Text>
                <Text style={styles.summaryTotalValue}>${totalAmount}</Text>
              </View>
            </View>
          </View>

          {/* Booking Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Select Your Dates & Rooms</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Check-in Date</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowCheckInPicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#10b981" />
                <Text style={styles.inputText}>{checkIn.toLocaleDateString()}</Text>
              </TouchableOpacity>
              {showCheckInPicker && (
                <DateTimePicker
                  value={checkIn}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowCheckInPicker(Platform.OS === 'ios');
                    if (date) setCheckIn(date);
                  }}
                  minimumDate={new Date()}
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Check-out Date</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowCheckOutPicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#10b981" />
                <Text style={styles.inputText}>{checkOut.toLocaleDateString()}</Text>
              </TouchableOpacity>
              {showCheckOutPicker && (
                <DateTimePicker
                  value={checkOut}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowCheckOutPicker(Platform.OS === 'ios');
                    if (date) setCheckOut(date);
                  }}
                  minimumDate={checkIn}
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Number of Guests</Text>
              <View style={styles.counterRow}>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => guests > 1 && setGuests(guests - 1)}
                >
                  <Ionicons name="remove" size={20} color="#10b981" />
                </TouchableOpacity>
                <Text style={styles.counterText}>{guests} Guests</Text>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => setGuests(guests + 1)}
                >
                  <Ionicons name="add" size={20} color="#10b981" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Number of Rooms</Text>
              <View style={styles.counterRow}>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => rooms > 1 && setRooms(rooms - 1)}
                >
                  <Ionicons name="remove" size={20} color="#10b981" />
                </TouchableOpacity>
                <Text style={styles.counterText}>{rooms} Rooms</Text>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => setRooms(rooms + 1)}
                >
                  <Ionicons name="add" size={20} color="#10b981" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next Step</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  progressStep: {
    alignItems: 'center',
  },
  progressCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressCircleActive: {
    backgroundColor: '#10b981',
  },
  progressNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
  },
  progressNumberActive: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  progressLabel: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    maxWidth: 80,
  },
  progressLabelActive: {
    color: '#10b981',
    fontWeight: '600',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginBottom: 32,
  },
  content: {
    padding: 20,
  },
  hotelCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  hotelImage: {
    height: 150,
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  hotelName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  hotelLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#6b7280',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 4,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  amenityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#d1fae5',
    borderRadius: 12,
  },
  amenityText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  summary: {
    marginTop: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  summaryTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  nextButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});

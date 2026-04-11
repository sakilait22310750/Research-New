import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const BookingDetailsScreen = ({ route, navigation }) => {
  const { hotelId, hotelName, location, nightlyRate = 85 } = route.params || {};

  const [checkIn, setCheckIn] = useState(new Date());
  const [checkOut, setCheckOut] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  );
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);

  const nights = Math.max(
    1,
    Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    )
  );
  const totalAmount = nightlyRate * nights * rooms;

  const handleNext = () => {
    navigation.navigate('BookingGuestInfo', {
      hotelId,
      hotelName,
      location,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      guests,
      rooms,
      total: totalAmount,
      nightlyRate,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
            <Text style={styles.backText}>Back to hotel</Text>
          </TouchableOpacity>
        </View>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressStep}>
            <View style={[styles.progressCircle, styles.progressCircleActive]}>
              <Text style={styles.progressNumberActive}>1</Text>
            </View>
            <Text style={[styles.progressLabel, styles.progressLabelActive]}>
              Booking details
            </Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={styles.progressCircle}>
              <Text style={styles.progressNumber}>2</Text>
            </View>
            <Text style={styles.progressLabel}>Guest information</Text>
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
          <View style={styles.hotelCard}>
            <View style={styles.hotelImage}>
              <Ionicons name="bed" size={40} color="#10b981" />
            </View>
            <Text style={styles.hotelName}>{hotelName || 'Selected hotel'}</Text>
            <View style={styles.hotelLocation}>
              <Ionicons name="location-outline" size={16} color="#6b7280" />
              <Text style={styles.locationText}>{location}</Text>
            </View>

            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Booking summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Rate per night</Text>
                <Text style={styles.summaryValue}>${nightlyRate}</Text>
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
                <Text style={styles.summaryTotalLabel}>Total amount</Text>
                <Text style={styles.summaryTotalValue}>${totalAmount}</Text>
              </View>
            </View>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Select your dates & rooms</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Check-in date</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowCheckInPicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#10b981" />
                <Text style={styles.inputText}>
                  {checkIn.toLocaleDateString()}
                </Text>
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
              <Text style={styles.label}>Check-out date</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowCheckOutPicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#10b981" />
                <Text style={styles.inputText}>
                  {checkOut.toLocaleDateString()}
                </Text>
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
              <Text style={styles.label}>Number of guests</Text>
              <View style={styles.counterRow}>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => guests > 1 && setGuests(guests - 1)}
                >
                  <Ionicons name="remove" size={20} color="#10b981" />
                </TouchableOpacity>
                <Text style={styles.counterText}>{guests} guests</Text>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => setGuests(guests + 1)}
                >
                  <Ionicons name="add" size={20} color="#10b981" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Number of rooms</Text>
              <View style={styles.counterRow}>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => rooms > 1 && setRooms(rooms - 1)}
                >
                  <Ionicons name="remove" size={20} color="#10b981" />
                </TouchableOpacity>
                <Text style={styles.counterText}>{rooms} rooms</Text>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => setRooms(rooms + 1)}
                >
                  <Ionicons name="add" size={20} color="#10b981" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next step</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

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
    maxWidth: 90,
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
  summary: {
    marginTop: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
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
    paddingTop: 8,
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

export default BookingDetailsScreen;


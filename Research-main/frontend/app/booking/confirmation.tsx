import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ConfirmationScreen() {
  const router = useRouter();
  const {
    hotelId,
    checkIn,
    checkOut,
    guests,
    rooms,
    total,
    firstName,
    lastName,
    email,
    phone,
  } = useLocalSearchParams();

  const checkInDate = new Date(checkIn as string);
  const checkOutDate = new Date(checkOut as string);
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

  const handleConfirm = () => {
    Alert.alert(
      'Reservation Confirmed!',
      'This is a demo system. No actual payment has been processed.',
      [
        {
          text: 'OK',
          onPress: () => router.push('/(tabs)'),
        },
      ]
    );
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
            <View style={[styles.progressCircle, styles.progressCircleCompleted]}>
              <Ionicons name="checkmark" size={20} color="#fff" />
            </View>
            <Text style={[styles.progressLabel, styles.progressLabelActive]}>
              Booking Details
            </Text>
          </View>
          <View style={[styles.progressLine, styles.progressLineActive]} />
          <View style={styles.progressStep}>
            <View style={[styles.progressCircle, styles.progressCircleCompleted]}>
              <Ionicons name="checkmark" size={20} color="#fff" />
            </View>
            <Text style={[styles.progressLabel, styles.progressLabelActive]}>
              Guest Information
            </Text>
          </View>
          <View style={[styles.progressLine, styles.progressLineActive]} />
          <View style={styles.progressStep}>
            <View style={[styles.progressCircle, styles.progressCircleActive]}>
              <Text style={styles.progressNumberActive}>3</Text>
            </View>
            <Text style={[styles.progressLabel, styles.progressLabelActive]}>
              Confirmation
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Hotel Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.hotelImage}>
              <Ionicons name="bed" size={40} color="#10b981" />
            </View>
            <Text style={styles.hotelName}>Heritage Villa Kandy</Text>
            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>Booking Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Rate per night</Text>
                <Text style={styles.summaryValue}>$85</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Number of nights</Text>
                <Text style={styles.summaryValue}>{nights}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Number of rooms</Text>
                <Text style={styles.summaryValue}>{rooms}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                <Text style={styles.summaryTotalLabel}>Total Amount</Text>
                <Text style={styles.summaryTotalValue}>${total}</Text>
              </View>
            </View>
          </View>

          {/* Confirmation Details */}
          <View style={styles.detailsCard}>
            <Text style={styles.cardTitle}>Confirm Your Reservation</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reservation Summary</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Guest name</Text>
                <Text style={styles.detailValue}>
                  {firstName} {lastName}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{phone}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Check-out date</Text>
                <Text style={styles.detailValue}>{checkOutDate.toLocaleDateString()}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{email}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Check-in date</Text>
                <Text style={styles.detailValue}>{checkInDate.toLocaleDateString()}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Guests & Rooms</Text>
                <Text style={styles.detailValue}>
                  {guests} guests, {rooms} rooms
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Information</Text>
              <View style={styles.demoNotice}>
                <Ionicons name="information-circle" size={20} color="#10b981" />
                <Text style={styles.demoText}>
                  This is a demo reservation system. No actual payment will be processed.
                </Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Total Amount</Text>
                <Text style={styles.paymentValue}>${total}</Text>
              </View>
              <Text style={styles.paymentSubtext}>
                ({nights} nights × {rooms} rooms × $85)
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.previousButton}
                onPress={() => router.back()}
              >
                <Text style={styles.previousButtonText}>Previous</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmButtonText}>Confirm Reservation</Text>
              </TouchableOpacity>
            </View>
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
  progressCircleCompleted: {
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
  progressLineActive: {
    backgroundColor: '#10b981',
  },
  content: {
    padding: 20,
  },
  summaryCard: {
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
    height: 120,
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
    marginBottom: 16,
  },
  summarySection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  sectionTitle: {
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
  summaryTotalRow: {
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
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    textAlign: 'right',
    maxWidth: '60%',
  },
  demoNotice: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    marginBottom: 16,
  },
  demoText: {
    flex: 1,
    fontSize: 13,
    color: '#10b981',
    lineHeight: 18,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  paymentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  paymentValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
  },
  paymentSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  previousButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10b981',
    alignItems: 'center',
  },
  previousButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

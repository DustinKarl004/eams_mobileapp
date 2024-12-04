import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../firebase_config';
import { doc, getDoc } from 'firebase/firestore';

const ViewApplicantInformation = () => {
  const navigation = useNavigation();
  const [applicantInfo, setApplicantInfo] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email);
        fetchApplicantData(user.email);
      } else {
        navigation.navigate('Login');
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchApplicantData = async (email) => {
    try {
      setIsLoading(true);
      const freshmenDocRef = doc(db, 'freshmen_applicant_form', email);
      const transfereeDocRef = doc(db, 'transferee_applicant_form', email);
      
      const [freshmenDocSnap, transfereeDocSnap] = await Promise.all([
        getDoc(freshmenDocRef),
        getDoc(transfereeDocRef)
      ]);

      if (freshmenDocSnap.exists()) {
        const data = freshmenDocSnap.data().applicant_info || {};
        setApplicantInfo({
          ...data,
          suffix: data.suffix || 'N/A'
        });
      } else if (transfereeDocSnap.exists()) {
        const data = transfereeDocSnap.data().applicant_info || {};
        setApplicantInfo({
          ...data,
          suffix: data.suffix || 'N/A'
        });
      } else {
        console.log('No applicant data found');
      }
    } catch (error) {
      console.error('Error fetching applicant data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderField = (label, value) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}:</Text>
      <Text style={styles.fieldValue}>{value || 'N/A'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <LinearGradient
          colors={['#004b23', '#004b23']}
          style={styles.header}
        >
          <Image source={require('../Picture/cdm_logo.png')} style={styles.logo} />
        </LinearGradient>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#004b23" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.formContainer}>
              <View style={styles.subHeader}>
                <Text style={styles.subHeaderText}>Applicant Information</Text>
              </View>

              {renderField('Last Name', applicantInfo.last_name)}
              {renderField('First Name', applicantInfo.first_name)}
              {renderField('Middle Name', applicantInfo.middle_name)}
              {renderField('Suffix', applicantInfo.suffix)}
              {renderField('LRN', applicantInfo.lrn)}
              {renderField('Sex', applicantInfo.sex)}
              {renderField('Date of Birth', applicantInfo.dob)}
              {renderField('Place of Birth', applicantInfo.place_of_birth)}
            </View>
          </ScrollView>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => navigation.navigate('ViewAddressAndCN')}
          >
            <LinearGradient
              colors={['#004b23', '#003b1c']}
              style={styles.gradient}
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    marginTop: 30,
    marginRight: 10,
    width: 70,
    height: 70,
    resizeMode: 'contain',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  formContainer: {
    marginTop: 10,
    marginBottom: 20,
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  subHeader: {
    backgroundColor: '#FFFF00',
    padding: 15,
    alignItems: 'center',
    marginBottom: 30,
  },
  subHeaderText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#004b23',
  },
  fieldContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#004b23',
    marginBottom: 5,
  },
  fieldValue: {
    fontSize: 18,
    color: '#333333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  nextButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default ViewApplicantInformation;

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../firebase_config';
import { doc, getDoc } from 'firebase/firestore';

const ViewGuardianInfo = () => {
  const navigation = useNavigation();
  const [guardianInfo, setGuardianInfo] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email);
        fetchGuardianData(user.email);
      } else {
        navigation.navigate('Login');
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchGuardianData = async (email) => {
    try {
      setIsLoading(true);
      const freshmenDocRef = doc(db, 'freshmen_applicant_form', email);
      const transfereeDocRef = doc(db, 'transferee_applicant_form', email);
      
      const [freshmenDocSnap, transfereeDocSnap] = await Promise.all([
        getDoc(freshmenDocRef),
        getDoc(transfereeDocRef)
      ]);

      if (freshmenDocSnap.exists()) {
        const data = freshmenDocSnap.data();
        const guardianData = data.guardian_info || {};
        setGuardianInfo({
          ...guardianData,
          guardian_suffix: guardianData.guardian_suffix || 'N/A'
        });
      } else if (transfereeDocSnap.exists()) {
        const data = transfereeDocSnap.data();
        const guardianData = data.guardian_info || {};
        setGuardianInfo({
          ...guardianData,
          guardian_suffix: guardianData.guardian_suffix || 'N/A'
        });
      } else {
        console.log('No such document!');
      }
    } catch (error) {
      console.error('Error fetching existing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextPress = () => {
    navigation.navigate('ViewEducation');
  };

  const InfoField = ({ label, value, icon }) => (
    <View style={styles.infoField}>
      <View style={styles.labelContainer}>
        <Ionicons name={icon} size={24} color="#004b23" style={styles.inputIcon} />
        <Text style={styles.inputLabel}>{label}</Text>
      </View>
      <Text style={styles.fieldValue}>{value || 'Not specified'}</Text>
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
                <Text style={styles.subHeaderText}>Guardian Information</Text>
              </View>

              <InfoField label="Guardian's Last Name" value={guardianInfo?.guardian_last_name} icon="person-outline" />
              <InfoField label="Guardian's First Name" value={guardianInfo?.guardian_first_name} icon="person-outline" />
              <InfoField label="Guardian's Middle Name" value={guardianInfo?.guardian_middle_name} icon="person-outline" />
              <InfoField label="Guardian's Suffix" value={guardianInfo?.guardian_suffix} icon="person-outline" />
              <InfoField 
                label="Is guardian residing on the same home address?" 
                value={guardianInfo?.is_guardian_residing_on_same_home_address} 
                icon="home-outline" 
              />
            </View>
          </ScrollView>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNextPress}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  infoField: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#004b23',
  },
  fieldValue: {
    fontSize: 16,
    color: '#333333',
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

export default ViewGuardianInfo;

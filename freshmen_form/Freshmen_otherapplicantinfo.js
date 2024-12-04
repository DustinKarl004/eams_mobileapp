import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { RadioButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../firebase_config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const FreshmenOtherApplicantInfo = () => {
  const navigation = useNavigation();
  const [citizenship, setCitizenship] = useState('');
  const [otherCitizenship, setOtherCitizenship] = useState('');
  const [gender, setGender] = useState('');
  const [otherGender, setOtherGender] = useState('');
  const [religion, setReligion] = useState('');
  const [otherReligion, setOtherReligion] = useState('');
  const [civilStatus, setCivilStatus] = useState('');
  const [otherCivilStatus, setOtherCivilStatus] = useState('');
  const [isPressed, setIsPressed] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email);
        fetchExistingData(user.email);
      } else {
        navigation.navigate('Login');
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchExistingData = async (email) => {
    try {
      const docRef = doc(db, 'freshmen_applicant_form', email);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const otherApplicantInfo = data.other_applicant_info || {};
        // Handle citizenship
        if (otherApplicantInfo.citizenship && otherApplicantInfo.citizenship !== 'Filipino') {
          setCitizenship('Other');
          setOtherCitizenship(otherApplicantInfo.citizenship);
        } else {
          setCitizenship(otherApplicantInfo.citizenship || '');
        }
        
        // Handle gender
        if (otherApplicantInfo.gender && !['Male', 'Female', 'Trans-Gender', 'Non-Binary', 'Prefer not to say'].includes(otherApplicantInfo.gender)) {
          setGender('Other');
          setOtherGender(otherApplicantInfo.gender);
        } else {
          setGender(otherApplicantInfo.gender || '');
        }
        
        // Handle religion
        if (otherApplicantInfo.religion && !['Roman Catholic', 'Christian', 'Islam', 'Inglesia ni Cristo', 'Prefer not to say'].includes(otherApplicantInfo.religion)) {
          setReligion('Other');
          setOtherReligion(otherApplicantInfo.religion);
        } else {
          setReligion(otherApplicantInfo.religion || '');
        }
        
        // Handle civil status
        if (otherApplicantInfo.civil_status && !['Single', 'Married', 'Widowed', 'Separated', 'Divorced', 'Common Law Partner'].includes(otherApplicantInfo.civil_status)) {
          setCivilStatus('Other');
          setOtherCivilStatus(otherApplicantInfo.civil_status);
        } else {
          setCivilStatus(otherApplicantInfo.civil_status || '');
        }
      }
    } catch (error) {
      console.error('Error fetching existing data:', error);
    }
  };

  const handleNextPress = async () => {
    const applicantData = {
      other_applicant_info: {
      citizenship: citizenship === 'Other' ? otherCitizenship : citizenship,
      gender: gender === 'Other' ? otherGender : gender,
      religion: religion === 'Other' ? otherReligion : religion,
      civil_status: civilStatus === 'Other' ? otherCivilStatus : civilStatus,
      }
    };

    try {
      setIsLoading(true);
      await setDoc(doc(db, 'freshmen_applicant_form', userEmail), applicantData, { merge: true });
      console.log('Other applicant information saved successfully');
      navigation.navigate('FreshmenSectorAndWorkStatus');
    } catch (error) {
      console.error('Error saving other applicant information:', error);
      alert('Failed to save information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = (citizenship && (citizenship !== 'Other' || otherCitizenship)) &&
                      (gender && (gender !== 'Other' || otherGender)) &&
                      (religion && (religion !== 'Other' || otherReligion)) &&
                      (civilStatus && (civilStatus !== 'Other' || otherCivilStatus));

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <LinearGradient
          colors={['#004b23', '#003d1c']}
          style={styles.header}
        >
          <Image source={require('../Picture/cdm_logo.png')} style={styles.logo} />
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            <View style={styles.subHeader}>
              <Text style={styles.subHeaderText}>Other Applicant Information</Text>
            </View>

            {/* Citizenship */}
            <RadioGroup
              label="Citizenship"
              options={['Filipino', 'Other']}
              selectedValue={citizenship}
              onSelect={setCitizenship}
              icon="flag-outline"
            />
            {citizenship === 'Other' && (
              <InputField
                label="Other Citizenship"
                placeholder="Enter Citizenship"
                value={otherCitizenship}
                onChangeText={setOtherCitizenship}
                icon="flag-outline"
              />
            )}

            {/* Gender */}
            <RadioGroup
              label="Gender"
              options={['Male', 'Female', 'Trans-Gender', 'Non-Binary', 'Prefer not to say', 'Other']}
              selectedValue={gender}
              onSelect={setGender}
              icon="person-outline"
            />
            {gender === 'Other' && (
              <InputField
                label="Other Gender"
                placeholder="Enter Gender"
                value={otherGender}
                onChangeText={setOtherGender}
                icon="person-outline"
              />
            )}

            {/* Religion */}
            <RadioGroup
              label="Religion"
              options={['Roman Catholic', 'Christian', 'Islam', 'Inglesia ni Cristo', 'Prefer not to say', 'Other']}
              selectedValue={religion}
              onSelect={setReligion}
              icon="book-outline"
            />
            {religion === 'Other' && (
              <InputField
                label="Other Religion"
                placeholder="Enter Religion"
                value={otherReligion}
                onChangeText={setOtherReligion}
                icon="book-outline"
              />
            )}

            {/* Civil Status */}
            <RadioGroup
              label="Civil Status"
              options={['Single', 'Married', 'Widowed', 'Separated', 'Divorced', 'Common Law Partner', 'Other']}
              selectedValue={civilStatus}
              onSelect={setCivilStatus}
              icon="heart-outline"
            />
            {civilStatus === 'Other' && (
              <InputField
                label="Other Civil Status"
                placeholder="Enter Civil Status"
                value={otherCivilStatus}
                onChangeText={setOtherCivilStatus}
                icon="heart-outline"
              />
            )}
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.nextButton, !isFormValid && styles.disabledButton]}
            onPress={handleNextPress}
            disabled={!isFormValid}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
          >
            <LinearGradient
              colors={isFormValid ? (isPressed ? ['#003d1c', '#004b23'] : ['#004b23', '#003d1c']) : ['#cccccc', '#b3b3b3']}
              style={styles.gradient}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.nextButtonText}>Next</Text>
                  <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#004b23" />
        </View>
      )}
    </SafeAreaView>
  );
};

// InputField Component
const InputField = ({ label, placeholder, value, onChangeText, icon }) => (
  <View style={styles.inputBox}>
    <View style={styles.labelContainer}>
      <Ionicons name={icon} size={24} color="#004b23" style={styles.inputIcon} />
      <Text style={styles.inputLabel}>
        {label}<Text style={styles.requiredAsterisk}>*</Text>
      </Text>
    </View>
    <TextInput
      style={styles.textInput}
      placeholder={placeholder}
      placeholderTextColor="#7A7A7A"
      value={value}
      onChangeText={onChangeText}
    />
  </View>
);

// RadioGroup Component
const RadioGroup = ({ label, options, selectedValue, onSelect, icon }) => (
  <View style={styles.radioGroup}>
    <View style={styles.labelContainer}>
      <Ionicons name={icon} size={24} color="#004b23" style={styles.inputIcon} />
      <Text style={styles.radioLabel}>{label}<Text style={styles.requiredAsterisk}>*</Text></Text>
    </View>
    {options.map(option => (
      <View key={option} style={styles.radioItem}>
        <RadioButton
          value={option}
          status={selectedValue === option ? 'checked' : 'unchecked'}
          onPress={() => onSelect(option)}
          color="#004b23"
        />
        <TouchableOpacity onPress={() => onSelect(option)}>
          <Text style={styles.radioOptionText}>{option}</Text>
        </TouchableOpacity>
      </View>
    ))}
  </View>
);

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
  inputBox: {
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
    fontSize: 18,
    fontWeight: '600',
    color: '#004b23',
  },
  requiredAsterisk: {
    color: '#FF0000',
    fontWeight: 'bold',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#004b23',
    borderRadius: 5,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: '#333333',
  },
  radioGroup: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  radioLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#004b23',
    marginBottom: 8,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioOptionText: {
    fontSize: 16,
    color: '#333333',
    marginLeft: 8,
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
  disabledButton: {
    opacity: 0.5,
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FreshmenOtherApplicantInfo;

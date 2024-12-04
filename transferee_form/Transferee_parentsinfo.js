import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Alert, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../firebase_config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const TransfereeParentsInfo = () => {
  const navigation = useNavigation();
  const [fatherLastName, setFatherLastName] = useState('');
  const [fatherFirstName, setFatherFirstName] = useState('');
  const [fatherMiddleName, setFatherMiddleName] = useState('');
  const [fatherSuffix, setFatherSuffix] = useState('');
  const [fatherAge, setFatherAge] = useState('');
  const [fatherOccupation, setFatherOccupation] = useState('');
  const [motherMaidenLastName, setMotherMaidenLastName] = useState('');
  const [motherFirstName, setMotherFirstName] = useState('');
  const [motherMaidenMiddleName, setMotherMaidenMiddleName] = useState('');
  const [motherAge, setMotherAge] = useState('');
  const [motherOccupation, setMotherOccupation] = useState('');
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
      const docRef = doc(db, 'transferee_applicant_form', email);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const parentsData = data.parents_info || {};
        setFatherLastName(parentsData.father_last_name || '');
        setFatherFirstName(parentsData.father_first_name || '');
        setFatherMiddleName(parentsData.father_middle_name || '');
        setFatherSuffix(parentsData.father_suffix || '');
        setFatherAge(parentsData.father_age || '');
        setFatherOccupation(parentsData.father_occupation || '');
        setMotherMaidenLastName(parentsData.mother_maiden_last_name || '');
        setMotherFirstName(parentsData.mother_first_name || '');
        setMotherMaidenMiddleName(parentsData.mother_maiden_middle_name || '');
        setMotherAge(parentsData.mother_age || '');
        setMotherOccupation(parentsData.mother_occupation || '');
      }
    } catch (error) {
      console.error('Error fetching existing data:', error);
    }
  };

  const isFormValid = () => {
    return (
      fatherLastName.trim() !== '' &&
      fatherFirstName.trim() !== '' &&
      fatherMiddleName.trim() !== '' &&
      fatherAge.trim() !== '' &&
      fatherOccupation.trim() !== '' &&
      motherMaidenLastName.trim() !== '' &&
      motherFirstName.trim() !== '' &&
      motherMaidenMiddleName.trim() !== '' &&
      motherAge.trim() !== '' &&
      motherOccupation.trim() !== ''
    );
  };

  const handleNextPress = async () => {
    if (!isFormValid()) {
      Alert.alert('Incomplete Form', 'Please fill in all required fields.');
      return;
    }

    const applicantData = {
      parents_info: {
        father_last_name: fatherLastName,
        father_first_name: fatherFirstName,
        father_middle_name: fatherMiddleName || 'N/A',
        father_suffix: fatherSuffix || '',
        father_age: fatherAge,
        father_occupation: fatherOccupation,
        mother_maiden_last_name: motherMaidenLastName,
        mother_first_name: motherFirstName,
        mother_maiden_middle_name: motherMaidenMiddleName || 'N/A',
        mother_age: motherAge,
        mother_occupation: motherOccupation
      }
    };

    try {
      setIsLoading(true);
      await setDoc(doc(db, 'transferee_applicant_form', userEmail), applicantData, { merge: true });
      console.log('Parents information saved successfully');
      setIsLoading(false);
      navigation.navigate('TransfereeIncomeAndBeneficiary');
    } catch (error) {
      console.error('Error saving parents information:', error);
      Alert.alert('Error', 'Failed to save parents information. Please try again.');
      setIsLoading(false);
    }
  };

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
              <Text style={styles.subHeaderText}>Parents Information</Text>
            </View>

            <InputField
              label="Father's Last Name"
              placeholder="Enter Father's Last Name"
              value={fatherLastName}
              onChangeText={setFatherLastName}
              icon="person-outline"
            />
            <InputField
              label="Father's First Name"
              placeholder="Enter Father's First Name"
              value={fatherFirstName}
              onChangeText={setFatherFirstName}
              icon="person-outline"
            />
            <InputField
              label="Father's Middle Name"
              placeholder="Enter Father's Middle Name"
              value={fatherMiddleName}
              onChangeText={setFatherMiddleName}
              description="Type N/A if you do not have a middle name"
              icon="person-outline"
            />
            <InputField
              label="Father's Suffix"
              placeholder="Enter Father's Suffix (Optional)"
              value={fatherSuffix}
              onChangeText={setFatherSuffix}
              description="e.g., Jr., Sr., III (Leave blank if none)"
              icon="person-outline"
              required={false}
            />
            <InputField
              label="Father's Age"
              placeholder="Enter Father's Age"
              value={fatherAge}
              onChangeText={setFatherAge}
              keyboardType="numeric"
              icon="calendar-outline"
            />
            <InputField
              label="Father's Occupation"
              placeholder="Enter Father's Occupation"
              value={fatherOccupation}
              onChangeText={setFatherOccupation}
              icon="briefcase-outline"
            />
            <InputField
              label="Mother's Maiden Last Name"
              placeholder="Enter Mother's Maiden Last Name"
              value={motherMaidenLastName}
              onChangeText={setMotherMaidenLastName}
              icon="person-outline"
            />
            <InputField
              label="Mother's First Name"
              placeholder="Enter Mother's First Name"
              value={motherFirstName}
              onChangeText={setMotherFirstName}
              icon="person-outline"
            />
            <InputField
              label="Mother's Maiden Middle Name"
              placeholder="Enter Mother's Maiden Middle Name"
              value={motherMaidenMiddleName}
              onChangeText={setMotherMaidenMiddleName}
              description="Type N/A if you do not have a middle name"
              icon="person-outline"
            />
            <InputField
              label="Mother's Age"
              placeholder="Enter Mother's Age"
              value={motherAge}
              onChangeText={setMotherAge}
              keyboardType="numeric"
              icon="calendar-outline"
            />
            <InputField
              label="Mother's Occupation"
              placeholder="Enter Mother's Occupation"
              value={motherOccupation}
              onChangeText={setMotherOccupation}
              icon="briefcase-outline"
            />
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.nextButton, !isFormValid() && styles.disabledButton]}
            onPress={handleNextPress}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            disabled={!isFormValid()}
          >
            <LinearGradient
              colors={isPressed ? ['#003d1c', '#004b23'] : ['#004b23', '#003d1c']}
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

const InputField = ({ label, placeholder, value, onChangeText, keyboardType, maxLength, description, icon, required = true }) => (
  <View style={styles.inputBox}>
    <View style={styles.labelContainer}>
      <Ionicons name={icon} size={24} color="#004b23" style={styles.inputIcon} />
      <Text style={styles.inputLabel}>{label}{required && <Text style={styles.requiredAsterisk}>*</Text>}</Text>
    </View>
    {description && <Text style={styles.inputDescription}>{description}</Text>}
    <TextInput
      style={styles.textInput}
      placeholder={placeholder}
      placeholderTextColor="#7A7A7A"
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      maxLength={maxLength}
    />
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
  inputDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
    fontStyle: 'italic',
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

export default TransfereeParentsInfo;

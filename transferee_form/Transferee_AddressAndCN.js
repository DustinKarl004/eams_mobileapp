import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Image, ActivityIndicator, Modal } from 'react-native';
import { RadioButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../firebase_config';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const TransfereeAddressAndCN = () => {
  const navigation = useNavigation();
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [barangay, setBarangay] = useState('');
  const [otherBarangay, setOtherBarangay] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [otherMunicipality, setOtherMunicipality] = useState('');
  const [province, setProvince] = useState('');
  const [otherProvince, setOtherProvince] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [isPressed, setIsPressed] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

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
        const address_and_cn = data.address_and_cn || {};
        setAddressLine1(address_and_cn.address_line_1 || '');
        setAddressLine2(address_and_cn.address_line_2 || '');
        setContactNumber(address_and_cn.contact_number || '');

        // Handle barangay
        if (address_and_cn.barangay && !['San Jose', 'Burgos', 'Geronimo', 'Macabud', 'Mascap', 'San Isidro', 'San Rafael', 'Balite', 'Manggahan', 'Rosario', 'Puray'].includes(address_and_cn.barangay)) {
          setBarangay('Other');
          setOtherBarangay(address_and_cn.barangay);
        } else {
          setBarangay(address_and_cn.barangay || '');
        }

        // Handle municipality
        if (address_and_cn.municipality && address_and_cn.municipality !== 'Montalban') {
          setMunicipality('Other');
          setOtherMunicipality(address_and_cn.municipality);
        } else {
          setMunicipality(address_and_cn.municipality || '');
        }

        // Handle province
        if (address_and_cn.province && address_and_cn.province !== 'Rizal') {
          setProvince('Other');
          setOtherProvince(address_and_cn.province);
        } else {
          setProvince(address_and_cn.province || '');
        }
      }
    } catch (error) {
      console.error('Error fetching existing data:', error);
    }
  };

  const showAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleNextPress = async () => {
    if (!contactNumber.match(/^\d{11}$/)) {
      showAlert('Invalid Contact Number', 'Please enter a valid 11-digit mobile number.');
      return;
    }
  
    try {
      setIsLoading(true);
      
      // Check if the contact number already exists in both freshmen and transferee forms
      const freshmenRef = collection(db, "freshmen_applicant_form");
      const transfereeRef = collection(db, "transferee_applicant_form");
      
      const freshmenQuery = query(freshmenRef, where("address_and_cn.contact_number", "==", contactNumber));
      const transfereeQuery = query(transfereeRef, where("address_and_cn.contact_number", "==", contactNumber));
      
      const [freshmenSnapshot, transfereeSnapshot] = await Promise.all([
        getDocs(freshmenQuery),
        getDocs(transfereeQuery)
      ]);
      
      if (!freshmenSnapshot.empty || !transfereeSnapshot.empty) {
        const existingUser = freshmenSnapshot.docs[0] || transfereeSnapshot.docs[0];
        if (existingUser.id !== userEmail) {
          showAlert('Registration Failed', 'This contact number is already registered.');
          setIsLoading(false);
          return;
        }
      }

      const applicantData = {
        address_and_cn: {
          address_line_1: addressLine1,
          address_line_2: addressLine2,
          barangay: barangay === 'Other' ? otherBarangay : barangay,
          municipality: municipality === 'Other' ? otherMunicipality : municipality,
          province: province === 'Other' ? otherProvince : province,
          contact_number: contactNumber,
        }
      };
  
      await setDoc(doc(db, 'transferee_applicant_form', userEmail), applicantData, { merge: true });
      console.log('Address and contact information saved successfully');
      navigation.navigate('TransfereeProofofResidency');
    } catch (error) {
      console.error('Error saving address and contact information:', error);
      showAlert('Error', 'Failed to save information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = addressLine1 && addressLine2 && 
    (barangay && (barangay !== 'Other' || otherBarangay)) && 
    (municipality && (municipality !== 'Other' || otherMunicipality)) && 
    (province && (province !== 'Other' || otherProvince)) && 
    contactNumber;

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
              <Text style={styles.subHeaderText}>Address and Contact Number</Text>
            </View>

            {/* Address Line 1 */}
            <InputField
              label="Address Line 1"
              placeholder="Enter Address Line 1"
              value={addressLine1}
              onChangeText={setAddressLine1}
              description="House number, Unit, or Lot"
              icon="home-outline"
            />

            {/* Address Line 2 */}
            <InputField
              label="Address Line 2"
              placeholder="Enter Address Line 2"
              value={addressLine2}
              onChangeText={setAddressLine2}
              description="Street name, Phase & Block, Village, Building, Floor Number, or Subdivision"
              icon="business-outline"
            />

            {/* Barangay */}
            <RadioGroup
              label="Barangay"
              options={['San Jose', 'Burgos', 'Geronimo', 'Macabud', 'Mascap', 'San Isidro', 'San Rafael', 'Balite', 'Manggahan', 'Rosario', 'Puray', 'Other']}
              selectedValue={barangay}
              onSelect={setBarangay}
              icon="location-outline"
            />
            {barangay === 'Other' && (
              <InputField
                label="Other Barangay"
                placeholder="Enter Barangay"
                value={otherBarangay}
                onChangeText={setOtherBarangay}
                icon="location-outline"
              />
            )}

            {/* Municipality or City */}
            <RadioGroup
              label="Municipality or City"
              options={['Montalban', 'Other']}
              selectedValue={municipality}
              onSelect={setMunicipality}
              icon="business-outline"
            />
            {municipality === 'Other' && (
              <InputField
                label="Other Municipality or City"
                placeholder="Enter Municipality or City"
                value={otherMunicipality}
                onChangeText={setOtherMunicipality}
                icon="business-outline"
              />
            )}

            {/* Province */}
            <RadioGroup
              label="Province"
              options={['Rizal', 'Other']}
              selectedValue={province}
              onSelect={setProvince}
              icon="map-outline"
            />
            {province === 'Other' && (
              <InputField
                label="Other Province"
                placeholder="Enter Province"
                value={otherProvince}
                onChangeText={setOtherProvince}
                icon="map-outline"
              />
            )}

            {/* Contact Number */}
            <InputField
              label="Contact Number"
              placeholder="Enter Contact Number"
              value={contactNumber}
              onChangeText={(text) => {
                if (text.length <= 11) {
                  setContactNumber(text);
                }
              }}
              keyboardType="numeric"
              icon="call-outline"
              description="Please enter a valid 11-digit mobile number"
              maxLength={11}
            />
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.nextButton, !isFormValid && styles.disabledButton]}
            onPress={handleNextPress}
            disabled={!isFormValid || isLoading}
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

      <Modal
        animationType="fade"
        transparent={true}
        visible={alertVisible}
        onRequestClose={() => setAlertVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <MaterialIcons 
              name="error"
              size={50} 
              color="#FFFFFF" 
              style={styles.modalIcon}
            />
            <Text style={styles.modalTitle}>{alertTitle}</Text>
            <Text style={styles.modalText}>{alertMessage}</Text>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setAlertVisible(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#004b23" />
        </View>
      )}
    </SafeAreaView>
  );
};

// InputField Component
const InputField = ({ label, placeholder, value, onChangeText, description, keyboardType, icon, maxLength }) => (
  <View style={styles.inputBox}>
    <View style={styles.labelContainer}>
      <Ionicons name={icon} size={24} color="#004b23" style={styles.inputIcon} />
      <Text style={styles.inputLabel}>
        {label}<Text style={styles.requiredAsterisk}>*</Text>
      </Text>
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
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: '#FF3B30',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalIcon: {
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  modalText: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  modalButton: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    minWidth: 100,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  modalButtonText: {
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
    color: '#FF3B30',
  },
});

export default TransfereeAddressAndCN;

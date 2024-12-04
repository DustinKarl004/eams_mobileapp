import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, FlatList, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../firebase_config';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const FreshmenApplicantInformation = () => {
  const navigation = useNavigation();
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [suffix, setSuffix] = useState(''); // Added suffix state
  const [lrn, setLrn] = useState('');
  const [dob, setDob] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [modalVisibleSex, setModalVisibleSex] = useState(false);
  const [sexOptions] = useState(['Select Gender', 'Male', 'Female']);
  const [sex, setSex] = useState('Select Gender');
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
      const docRef = doc(db, 'freshmen_applicant_form', email);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const applicantInfo = data.applicant_info || {};
        setLastName(applicantInfo.last_name || '');
        setFirstName(applicantInfo.first_name || '');
        setMiddleName(applicantInfo.middle_name || '');
        setSuffix(applicantInfo.suffix || ''); // Added suffix fetch
        setLrn(applicantInfo.lrn || '');
        setDob(applicantInfo.dob || '');
        setPlaceOfBirth(applicantInfo.place_of_birth || '');
        setSex(applicantInfo.sex || 'Select Gender');
      }
    } catch (error) {
      console.error('Error fetching existing data:', error);
    }
  };

  const isFormValid = () => {
    return (
      lastName.trim() !== '' &&
      firstName.trim() !== '' &&
      middleName.trim() !== '' &&
      lrn.trim().length === 12 &&
      dob.trim() !== '' &&
      placeOfBirth.trim() !== '' &&
      sex !== 'Select Gender'
    );
  };

  const showAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleNextPress = async () => {
    if (!dob.match(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/)) {
      showAlert('Invalid Date', 'Please enter a valid date in YYYY-MM-DD format.');
      return;
    }

    if (lrn.trim().length !== 12) {
      showAlert('Invalid LRN', 'LRN must be exactly 12 digits.');
      return;
    }
  
    const formattedDob = dob;
  
    try {
      setIsLoading(true);
      
      // Check if the combined name already exists in both freshmen and transferee forms
      const freshmenRef = collection(db, "freshmen_applicant_form");
      const transfereeRef = collection(db, "transferee_applicant_form");
      
      const freshmenQuery = query(freshmenRef, 
        where("applicant_info.last_name", "==", lastName),
        where("applicant_info.first_name", "==", firstName),
        where("applicant_info.middle_name", "==", middleName)
      );
      const transfereeQuery = query(transfereeRef, 
        where("applicant_info.last_name", "==", lastName),
        where("applicant_info.first_name", "==", firstName),
        where("applicant_info.middle_name", "==", middleName)
      );
      
      const [freshmenSnapshot, transfereeSnapshot] = await Promise.all([
        getDocs(freshmenQuery),
        getDocs(transfereeQuery)
      ]);
      
      if (!freshmenSnapshot.empty || !transfereeSnapshot.empty) {
        const existingUser = freshmenSnapshot.docs[0] || transfereeSnapshot.docs[0];
        if (existingUser.id !== userEmail) {
          showAlert('Registration Failed', 'A user with this combination of first name, last name, and middle name already exists.');
          setIsLoading(false);
          return;
        }
      }

      // Check if LRN already exists in both freshmen and transferee forms
      const freshmenLrnQuery = query(freshmenRef, where("applicant_info.lrn", "==", lrn));
      const transfereeLrnQuery = query(transfereeRef, where("applicant_info.lrn", "==", lrn));
      
      const [freshmenLrnSnapshot, transfereeLrnSnapshot] = await Promise.all([
        getDocs(freshmenLrnQuery),
        getDocs(transfereeLrnQuery)
      ]);
      
      if (!freshmenLrnSnapshot.empty || !transfereeLrnSnapshot.empty) {
        const existingLrnUser = freshmenLrnSnapshot.docs[0] || transfereeLrnSnapshot.docs[0];
        if (existingLrnUser.id !== userEmail) {
          showAlert('Registration Failed', 'This LRN is already registered.');
          setIsLoading(false);
          return;
        }
      }

      const applicantData = {
        applicant_info: {
          last_name: lastName,
          first_name: firstName,
          middle_name: middleName || 'N/A',
          suffix: suffix || '', // Added suffix to save
          lrn: lrn,
          dob: formattedDob,
          place_of_birth: placeOfBirth,
          sex: sex !== 'Select Gender' ? sex : '',
        }
      };
  
      await setDoc(doc(db, 'freshmen_applicant_form', userEmail), applicantData, { merge: true });
      console.log('Applicant information saved successfully');
      setIsLoading(false);
      navigation.navigate('FreshmenAddressAndCN');
    } catch (error) {
      console.error('Error saving applicant information:', error);
      showAlert('Error', 'Failed to save applicant information. Please try again.');
      setIsLoading(false);
    }
  };

  const handleDateChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = '';
  
    if (cleaned.length <= 4) {
      formatted = cleaned;
    } else if (cleaned.length <= 6) {
      formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    } else if (cleaned.length <= 8) {
      formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6)}`;
    } else {
      formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
    }
  
    setDob(formatted);
  };

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

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            <View style={styles.subHeader}>
              <Text style={styles.subHeaderText}>Applicant Information</Text>
            </View>

            <InputField
              label="Last Name"
              placeholder="Enter Last Name"
              value={lastName}
              onChangeText={setLastName}
              icon="person-outline"
            />
            <InputField
              label="First Name"
              placeholder="Enter First Name"
              value={firstName}
              onChangeText={setFirstName}
              icon="person-outline"
            />
            <InputField
              label="Middle Name"
              placeholder="Enter Middle Name"
              value={middleName}
              onChangeText={setMiddleName}
              description="Type N/A if you do not have a middle name"
              icon="person-outline"
            />
            <InputField
              label="Suffix"
              placeholder="Enter Suffix (Optional)"
              value={suffix}
              onChangeText={setSuffix}
              description="e.g., Jr., Sr., III (Leave blank if none)"
              icon="person-outline"
              required={false}
            />
            <InputField
              label="LRN (Learner Reference Number)"
              placeholder="Enter LRN"
              value={lrn}
              onChangeText={setLrn}
              keyboardType="numeric"
              maxLength={12}
              icon="card-outline"
              description="LRN must be exactly 12 digits"
            />
            <SelectBox
              label="Sex"
              value={sex}
              onPress={() => setModalVisibleSex(true)}
              placeholder="Select Gender"
              icon="male-female-outline"
            />
            <InputField
              label="Date of Birth"
              placeholder="YYYY-MM-DD"
              value={dob}
              onChangeText={handleDateChange}
              maxLength={10}
              keyboardType="numeric"
              icon="calendar-outline"
            />
            <InputField
              label="Place of Birth"
              placeholder="Enter Place of Birth"
              value={placeOfBirth}
              onChangeText={setPlaceOfBirth}
              icon="location-outline"
            />
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.nextButton, !isFormValid() && styles.disabledButton]}
            onPress={handleNextPress}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            disabled={!isFormValid() || isLoading}
          >
            <LinearGradient
              colors={isPressed ? ['#003b1c', '#004b23'] : ['#004b23', '#003b1c']}
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
        visible={modalVisibleSex}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisibleSex(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Gender</Text>
            <FlatList
              data={sexOptions}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => { setSex(item); setModalVisibleSex(false); }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisibleSex(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

const SelectBox = ({ label, value, onPress, placeholder, icon }) => (
  <View style={styles.selectBox}>
    <View style={styles.labelContainer}>
      <Ionicons name={icon} size={24} color="#004b23" style={styles.inputIcon} />
      <Text style={styles.selectLabel}>{label}<Text style={styles.requiredAsterisk}>*</Text></Text>
    </View>
    <TouchableOpacity style={styles.selectButton} onPress={onPress}>
      <Text style={[styles.selectButtonText, !value && styles.placeholderText]}>
        {value || placeholder}
      </Text>
      <Ionicons name="chevron-down-outline" size={24} color="#004b23" />
    </TouchableOpacity>
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
    height: '15%',
    minHeight: 120,
    maxHeight: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    marginTop: '8%',
    width: '20%',
    height: '60%',
    resizeMode: 'contain',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: '20%',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  formContainer: {
    marginTop: '3%',
    marginBottom: '5%',
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
    padding: '4%',
    alignItems: 'center',
    marginBottom: '8%',
  },
  subHeaderText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#004b23',
  },
  inputBox: {
    marginBottom: '5%',
    paddingHorizontal: '5%',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '2%',
  },
  inputIcon: {
    marginRight: '3%',
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#004b23',
  },
  inputDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: '2%',
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
    paddingVertical: '2%',
    paddingHorizontal: '3%',
    color: '#333333',
  },
  selectBox: {
    marginBottom: '5%',
    paddingHorizontal: '5%',
  },
  selectLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#004b23',
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#004b23',
    borderRadius: 5,
    paddingVertical: '2%',
    paddingHorizontal: '3%',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#333333',
  },
  placeholderText: {
    color: '#7A7A7A',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: '5%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#004b23',
    marginBottom: '5%',
    textAlign: 'center',
  },
  modalItem: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: '4%',
    marginBottom: '3%',
  },
  modalItemText: {
    fontSize: 18,
    color: '#333333',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#004b23',
    borderRadius: 10,
    padding: '4%',
    alignItems: 'center',
    marginTop: '3%',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: '4%',
    paddingVertical: '5%',
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
    paddingVertical: '3%',
    paddingHorizontal: '5%',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: '2%',
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
    margin: '5%',
    backgroundColor: '#FF3B30',
    borderRadius: 20,
    padding: '8%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalIcon: {
    marginBottom: '4%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: '4%',
    textAlign: 'center',
    color: '#FFFFFF',
  },
  modalText: {
    marginBottom: '5%',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  modalButton: {
    borderRadius: 20,
    padding: '3%',
    elevation: 2,
    minWidth: '30%',
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

export default FreshmenApplicantInformation;

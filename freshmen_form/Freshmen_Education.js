import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Alert, Image, ActivityIndicator, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../firebase_config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const FreshmenEducation = () => {
  const navigation = useNavigation();
  const [userEmail, setUserEmail] = useState('');
  const [isPressed, setIsPressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [elementaryNameOfSchool, setElementaryNameOfSchool] = useState('');
  const [elementaryAddressOfSchool, setElementaryAddressOfSchool] = useState('');
  const [elementaryYearGraduated, setElementaryYearGraduated] = useState('');
  const [elementaryHonorsReceived, setElementaryHonorsReceived] = useState('');
  const [showElementaryYearPicker, setShowElementaryYearPicker] = useState(false);
  const [showElementaryHonorsPicker, setShowElementaryHonorsPicker] = useState(false);

  const [juniorHighNameOfSchool, setJuniorHighNameOfSchool] = useState('');
  const [juniorHighAddressOfSchool, setJuniorHighAddressOfSchool] = useState('');
  const [juniorHighYearGraduated, setJuniorHighYearGraduated] = useState('');
  const [juniorHighHonorsReceived, setJuniorHighHonorsReceived] = useState('');
  const [showJuniorHighYearPicker, setShowJuniorHighYearPicker] = useState(false);
  const [showJuniorHighHonorsPicker, setShowJuniorHighHonorsPicker] = useState(false);

  const [seniorHighNameOfSchool, setSeniorHighNameOfSchool] = useState('');
  const [seniorHighAddressOfSchool, setSeniorHighAddressOfSchool] = useState('');
  const [seniorHighYearGraduated, setSeniorHighYearGraduated] = useState('');
  const [seniorHighHonorsReceived, setSeniorHighHonorsReceived] = useState('');
  const [showSeniorHighYearPicker, setShowSeniorHighYearPicker] = useState(false);
  const [showSeniorHighHonorsPicker, setShowSeniorHighHonorsPicker] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 30}, (_, i) => (currentYear - i).toString());

  const honorsOptions = [
    'Valedictorian',
    'With Highest Honors',
    'With High Honors', 
    'With Honors',
    'None'
  ];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email);
        fetchEducationData(user.email);
      } else {
        navigation.navigate('Login');
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchEducationData = async (email) => {
    try {
      const docRef = doc(db, 'freshmen_applicant_form', email);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const educationData = data.education || {};
        setElementaryNameOfSchool(educationData.elementary_name || '');
        setElementaryAddressOfSchool(educationData.elementary_address || '');
        setElementaryYearGraduated(educationData.elementary_year || '');
        setElementaryHonorsReceived(educationData.elementary_honors || '');
        setJuniorHighNameOfSchool(educationData.junior_high_name || '');
        setJuniorHighAddressOfSchool(educationData.junior_high_address || '');
        setJuniorHighYearGraduated(educationData.junior_high_year || '');
        setJuniorHighHonorsReceived(educationData.junior_high_honors || '');
        setSeniorHighNameOfSchool(educationData.senior_high_name || '');
        setSeniorHighAddressOfSchool(educationData.senior_high_address || '');
        setSeniorHighYearGraduated(educationData.senior_high_year || '');
        setSeniorHighHonorsReceived(educationData.senior_high_honors || '');
      }
    } catch (error) {
      console.error('Error fetching education data:', error);
    }
  };

  const isFormValid = () => {
    return (
      elementaryNameOfSchool.trim() !== '' &&
      elementaryAddressOfSchool.trim() !== '' &&
      elementaryYearGraduated.trim() !== '' &&
      elementaryHonorsReceived.trim() !== '' &&
      juniorHighNameOfSchool.trim() !== '' &&
      juniorHighAddressOfSchool.trim() !== '' &&
      juniorHighYearGraduated.trim() !== '' &&
      juniorHighHonorsReceived.trim() !== '' &&
      seniorHighNameOfSchool.trim() !== '' &&
      seniorHighAddressOfSchool.trim() !== '' &&
      seniorHighYearGraduated.trim() !== '' &&
      seniorHighHonorsReceived.trim() !== ''
    );
  };

  const handleNextPress = async () => {
    if (!isFormValid()) {
      Alert.alert('Missing Information', 'Please fill in all required fields before proceeding.');
      return;
    }
    
    const applicantData = {
      education: {
      elementary_name: elementaryNameOfSchool,
      elementary_address: elementaryAddressOfSchool,
      elementary_year: elementaryYearGraduated,
      elementary_honors: elementaryHonorsReceived,
      junior_high_name: juniorHighNameOfSchool,
      junior_high_address: juniorHighAddressOfSchool,
      junior_high_year: juniorHighYearGraduated,
      junior_high_honors: juniorHighHonorsReceived,
      senior_high_name: seniorHighNameOfSchool,
      senior_high_address: seniorHighAddressOfSchool,
      senior_high_year: seniorHighYearGraduated,
      senior_high_honors: seniorHighHonorsReceived
      }
    };

    try {
      setIsLoading(true);
      await setDoc(doc(db, 'freshmen_applicant_form', userEmail), applicantData, { merge: true });
      console.log('Education information saved successfully');
      setIsLoading(false);
      navigation.navigate('FreshmenProofOfEligibility');
    } catch (error) {
      console.error('Error saving education information:', error);
      Alert.alert('Error', 'Failed to save education information. Please try again.');
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
              <Text style={styles.subHeaderText}>Education</Text>
            </View>

            {/* Elementary Education */}
            <View style={styles.educationSection}>
              <Text style={styles.sectionTitle}>Elementary Education</Text>
              <InputField
                label="Name of School"
                placeholder="Enter Name of School"
                value={elementaryNameOfSchool}
                onChangeText={setElementaryNameOfSchool}
                icon="school-outline"
              />
              <InputField
                label="Address of School"
                placeholder="Enter Address of School"
                value={elementaryAddressOfSchool}
                onChangeText={setElementaryAddressOfSchool}
                icon="location-outline"
              />
              <SelectBox
                label="Year Graduated"
                value={elementaryYearGraduated || "Select Year Graduated"}
                onPress={() => setShowElementaryYearPicker(true)}
                icon="calendar-outline"
              />
              <SelectBox
                label="Honors Received"
                value={elementaryHonorsReceived || "Select Honors Received"}
                onPress={() => setShowElementaryHonorsPicker(true)}
                icon="trophy-outline"
              />
            </View>

            {/* Junior High Education */}
            <View style={styles.educationSection}>
              <Text style={styles.sectionTitle}>Junior High Education</Text>
              <InputField
                label="Name of School"
                placeholder="Enter Name of School"
                value={juniorHighNameOfSchool}
                onChangeText={setJuniorHighNameOfSchool}
                icon="school-outline"
              />
              <InputField
                label="Address of School"
                placeholder="Enter Address of School"
                value={juniorHighAddressOfSchool}
                onChangeText={setJuniorHighAddressOfSchool}
                icon="location-outline"
              />
              <SelectBox
                label="Year Graduated"
                value={juniorHighYearGraduated || "Select Year Graduated"}
                onPress={() => setShowJuniorHighYearPicker(true)}
                icon="calendar-outline"
              />
              <SelectBox
                label="Honors Received"
                value={juniorHighHonorsReceived || "Select Honors Received"}
                onPress={() => setShowJuniorHighHonorsPicker(true)}
                icon="trophy-outline"
              />
            </View>

            {/* Senior High Education */}
            <View style={styles.educationSection}>
              <Text style={styles.sectionTitle}>Senior High Education</Text>
              <InputField
                label="Name of School"
                placeholder="Enter Name of School"
                value={seniorHighNameOfSchool}
                onChangeText={setSeniorHighNameOfSchool}
                icon="school-outline"
              />
              <InputField
                label="Address of School"
                placeholder="Enter Address of School"
                value={seniorHighAddressOfSchool}
                onChangeText={setSeniorHighAddressOfSchool}
                icon="location-outline"
              />
              <SelectBox
                label="Year Graduated"
                value={seniorHighYearGraduated || "Select Year Graduated"}
                onPress={() => setShowSeniorHighYearPicker(true)}
                icon="calendar-outline"
              />
              <SelectBox
                label="Honors Received"
                value={seniorHighHonorsReceived || "Select Honors Received"}
                onPress={() => setShowSeniorHighHonorsPicker(true)}
                icon="trophy-outline"
              />
            </View>
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

      {/* Year Picker Modals */}
      <Modal
        visible={showElementaryYearPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Year Graduated</Text>
            <ScrollView>
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.modalOption,
                    year === elementaryYearGraduated && styles.selectedModalOption
                  ]}
                  onPress={() => {
                    setElementaryYearGraduated(year);
                    setShowElementaryYearPicker(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    year === elementaryYearGraduated && styles.selectedModalOptionText,
                    {color: year === elementaryYearGraduated ? '#004b23' : '#333333'}
                  ]}>{year}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowElementaryYearPicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showJuniorHighYearPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Year Graduated</Text>
            <ScrollView>
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.modalOption,
                    year === juniorHighYearGraduated && styles.selectedModalOption
                  ]}
                  onPress={() => {
                    setJuniorHighYearGraduated(year);
                    setShowJuniorHighYearPicker(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    year === juniorHighYearGraduated && styles.selectedModalOptionText,
                    {color: year === juniorHighYearGraduated ? '#004b23' : '#333333'}
                  ]}>{year}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowJuniorHighYearPicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showSeniorHighYearPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Year Graduated</Text>
            <ScrollView>
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.modalOption,
                    year === seniorHighYearGraduated && styles.selectedModalOption
                  ]}
                  onPress={() => {
                    setSeniorHighYearGraduated(year);
                    setShowSeniorHighYearPicker(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    year === seniorHighYearGraduated && styles.selectedModalOptionText,
                    {color: year === seniorHighYearGraduated ? '#004b23' : '#333333'}
                  ]}>{year}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowSeniorHighYearPicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Honors Picker Modals */}
      <Modal
        visible={showElementaryHonorsPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Honors Received</Text>
            <ScrollView>
              {honorsOptions.map((honor) => (
                <TouchableOpacity
                  key={honor}
                  style={[
                    styles.modalOption,
                    honor === elementaryHonorsReceived && styles.selectedModalOption
                  ]}
                  onPress={() => {
                    setElementaryHonorsReceived(honor);
                    setShowElementaryHonorsPicker(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    honor === elementaryHonorsReceived && styles.selectedModalOptionText,
                    {color: honor === elementaryHonorsReceived ? '#004b23' : '#333333'}
                  ]}>{honor}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowElementaryHonorsPicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showJuniorHighHonorsPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Honors Received</Text>
            <ScrollView>
              {honorsOptions.map((honor) => (
                <TouchableOpacity
                  key={honor}
                  style={[
                    styles.modalOption,
                    honor === juniorHighHonorsReceived && styles.selectedModalOption
                  ]}
                  onPress={() => {
                    setJuniorHighHonorsReceived(honor);
                    setShowJuniorHighHonorsPicker(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    honor === juniorHighHonorsReceived && styles.selectedModalOptionText,
                    {color: honor === juniorHighHonorsReceived ? '#004b23' : '#333333'}
                  ]}>{honor}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowJuniorHighHonorsPicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showSeniorHighHonorsPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Honors Received</Text>
            <ScrollView>
              {honorsOptions.map((honor) => (
                <TouchableOpacity
                  key={honor}
                  style={[
                    styles.modalOption,
                    honor === seniorHighHonorsReceived && styles.selectedModalOption
                  ]}
                  onPress={() => {
                    setSeniorHighHonorsReceived(honor);
                    setShowSeniorHighHonorsPicker(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    honor === seniorHighHonorsReceived && styles.selectedModalOptionText,
                    {color: honor === seniorHighHonorsReceived ? '#004b23' : '#333333'}
                  ]}>{honor}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowSeniorHighHonorsPicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
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

const InputField = ({ label, placeholder, value, onChangeText, keyboardType, maxLength, description, icon }) => (
  <View style={styles.inputBox}>
    <View style={styles.labelContainer}>
      <Ionicons name={icon} size={24} color="#004b23" style={styles.inputIcon} />
      <Text style={styles.inputLabel}>{label}<Text style={styles.requiredAsterisk}>*</Text></Text>
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

const SelectBox = ({ label, value, onPress, icon }) => (
  <View style={styles.inputBox}>
    <View style={styles.labelContainer}>
      <Ionicons name={icon} size={24} color="#004b23" style={styles.inputIcon} />
      <Text style={styles.inputLabel}>{label}<Text style={styles.requiredAsterisk}>*</Text></Text>
    </View>
    <TouchableOpacity style={styles.selectButton} onPress={onPress}>
      <Text style={[styles.selectButtonText, value.includes('Select') && styles.placeholderText]}>
        {value}
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
  educationSection: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#004b23',
    marginBottom: 15,
  },
  inputBox: {
    marginBottom: 20,
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
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#004b23',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  selectButtonText: {
    fontSize: 16,
    color: '#333333',
  },
  placeholderText: {
    color: '#7A7A7A',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#004b23',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalOption: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  selectedModalOption: {
    backgroundColor: '#e6f3ed',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333333',
  },
  selectedModalOptionText: {
    color: '#004b23',
    fontWeight: 'bold',
  },
  modalCloseButton: {
    marginTop: 15,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: '#004b23',
    fontWeight: '600',
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

export default FreshmenEducation;

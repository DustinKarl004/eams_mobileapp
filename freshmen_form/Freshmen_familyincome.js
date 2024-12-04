import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { RadioButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../firebase_config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const FreshmenIncomeAndBeneficiary = () => {
  const navigation = useNavigation();
  const [familyMonthlyIncome, setFamilyMonthlyIncome] = useState('');
  const [modalVisible4Ps, setModalVisible4Ps] = useState(false);
  const [FourPsBeneficiary, setFourPsBeneficiary] = useState('');
  const [FourPsOption] = useState(['Yes', 'No']);

  const [modalVisibleListahan, setModalVisibleListahan] = useState(false);
  const [Listahan, setListahan] = useState('');
  const [ListahanOption] = useState(['Yes', 'No']);

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
        const familyIncomeData = data.family_income || {};
        setFamilyMonthlyIncome(familyIncomeData.family_monthly_income || '');
        setFourPsBeneficiary(familyIncomeData.four_ps_beneficiary || '');
        setListahan(familyIncomeData.listahan || '');
      }
    } catch (error) {
      console.error('Error fetching existing data:', error);
    }
  };

  const isFormValid = () => {
    return familyMonthlyIncome && FourPsBeneficiary && Listahan;
  };

  const handleNextPress = async () => {
    if (!isFormValid()) {
      alert('Please fill in all fields.');
      return;
    }

    const applicantData = {
      family_income: {
      family_monthly_income: familyMonthlyIncome,
      four_ps_beneficiary: FourPsBeneficiary,
      listahan: Listahan
      }
    };

    try {
      setIsLoading(true);
      await setDoc(doc(db, 'freshmen_applicant_form', userEmail), applicantData, { merge: true });
      console.log('Family Income and Beneficiary information saved successfully');
      setIsLoading(false);
      navigation.navigate('FreshmenGuardianInfo');
    } catch (error) {
      console.error('Error saving family income and beneficiary information:', error);
      alert('Failed to save family income and beneficiary information. Please try again.');
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
          colors={['#004b23', '#004b23']}
          style={styles.header}
        >
          <Image source={require('../Picture/cdm_logo.png')} style={styles.logo} />
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            <View style={styles.subHeader}>
              <Text style={styles.subHeaderText}>Family Income and Beneficiary</Text>
            </View>

            <RadioGroup
              label="Family Monthly Income"
              options={['Below ₱,5000', '₱5,001 - ₱10,000', '₱10,001 - ₱15,000', '₱15,001 - ₱20,000', '₱20,001 - ₱25,000', '₱25,001 and ABOVE']}
              selectedValue={familyMonthlyIncome}
              onSelect={setFamilyMonthlyIncome}
              icon="cash-outline"
            />

            <SelectBox
              label="Is your family a beneficiary of 4Ps?"
              value={FourPsBeneficiary}
              onPress={() => setModalVisible4Ps(true)}
              placeholder="Select 4Ps Beneficiary"
              icon="people-outline"
            />

            <SelectBox
              label="Is your family censused or interviewed for Listahan?"
              value={Listahan}
              onPress={() => setModalVisibleListahan(true)}
              placeholder="Select Listahan"
              icon="list-outline"
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
        visible={modalVisible4Ps}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible4Ps(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select 4Ps Beneficiary</Text>
            <FlatList
              data={FourPsOption}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => { setFourPsBeneficiary(item); setModalVisible4Ps(false); }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible4Ps(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalVisibleListahan}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisibleListahan(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Listahan</Text>
            <FlatList
              data={ListahanOption}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => { setListahan(item); setModalVisibleListahan(false); }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisibleListahan(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
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

const SelectBox = ({ label, value, onPress, placeholder, icon }) => (
  <View style={styles.selectBox}>
    <View style={styles.labelContainer}>
      <Ionicons name={icon} size={24} color="#004b23" style={styles.inputIcon} />
      <Text style={styles.selectLabel}>{label}<Text style={styles.requiredAsterisk}>*</Text></Text>
    </View>
    <TouchableOpacity style={styles.selectButton} onPress={onPress}>
      <Text style={[styles.selectButtonText, value === placeholder && styles.placeholderText]}>
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
  radioGroup: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  selectBox: {
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
  radioLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#004b23',
  },
  selectLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#004b23',
  },
  requiredAsterisk: {
    color: '#FF0000',
    fontWeight: 'bold',
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioOptionText: {
    fontSize: 16,
    color: '#004b23',
    marginLeft: 8,
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
    padding: 20,
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
    marginBottom: 20,
    textAlign: 'center',
  },
  modalItem: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  modalItemText: {
    fontSize: 18,
    color: '#333333',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#004b23',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
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

export default FreshmenIncomeAndBeneficiary;

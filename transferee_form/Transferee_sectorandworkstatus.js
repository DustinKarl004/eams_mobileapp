import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Image, ActivityIndicator, TextInput, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../firebase_config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const TransfereeSectorAndWorkStatus = () => {
  const navigation = useNavigation();
  const [modalVisibleSector, setModalVisibleSector] = useState(false);
  const [sector, setSector] = useState('Select Sector');
  const [sectorOptions] = useState(['Select Sector', 'Government Employee', 'Business Owner / Entrepreneur', 'Non-Profit / NGO', 'Freelance / Self-Employed', 'Unemployed', 'Other']);
  const [otherSector, setOtherSector] = useState('');
  const [showOtherSectorInput, setShowOtherSectorInput] = useState(false);

  const [modalVisibleWorkStatus, setModalVisibleWorkStatus] = useState(false);
  const [workStatus, setWorkStatus] = useState('Select Work Status');
  const [workStatusOptions] = useState(['Select Work Status', 'Employed', 'Unemployed', 'Self-employed', 'Student']);

  const [isPressed, setIsPressed] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;

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
        const sector_and_work_status = data.sector_and_work_status || {};
        setSector(sector_and_work_status.sector || 'Select Sector');
        setWorkStatus(sector_and_work_status.work_status || 'Select Work Status');
        if (sector_and_work_status.sector === 'Other') {
          setOtherSector(sector_and_work_status.otherSector || '');
          setShowOtherSectorInput(true);
        }
      }
    } catch (error) {
      console.error('Error fetching existing data:', error);
    }
  };

  const isFormValid = () => {
    if (sector === 'Other') {
      return sector !== 'Select Sector' && workStatus !== 'Select Work Status' && otherSector.trim() !== '';
    }
    return sector !== 'Select Sector' && workStatus !== 'Select Work Status';
  };

  const handleNextPress = async () => {
    if (!isFormValid()) {
      alert('Please fill in all required fields.');
      return;
    }

    const applicantData = {
      sector_and_work_status: {
        sector: sector,
        work_status: workStatus,
        ...(sector === 'Other' && { otherSector: otherSector })
      }
    };

    try {
      setIsLoading(true);
      await setDoc(doc(db, 'transferee_applicant_form', userEmail), applicantData, { merge: true });
      console.log('Sector and Work Status information saved successfully');
      setIsLoading(false);
      navigation.navigate('TransfereeParentsInfo');
    } catch (error) {
      console.error('Error saving sector and work status information:', error);
      alert('Failed to save sector and work status information. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSectorSelect = (selectedSector) => {
    setSector(selectedSector);
    setShowOtherSectorInput(selectedSector === 'Other');
    if (selectedSector !== 'Other') {
      setOtherSector('');
    }
    setModalVisibleSector(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <LinearGradient
          colors={['#004b23', '#004b23']}
          style={[styles.header, { height: windowHeight * 0.15 }]}
        >
          <Image source={require('../Picture/cdm_logo.png')} style={[styles.logo, { width: windowWidth * 0.18, height: windowWidth * 0.18 }]} />
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.formContainer, { width: windowWidth * 0.9 }]}>
            <View style={styles.subHeader}>
              <Text style={styles.subHeaderText}>Sector and Work Status</Text>
            </View>

            <SelectBox
              label="Please Select the sector that best describes your current status"
              value={sector}
              onPress={() => setModalVisibleSector(true)}
              placeholder="Select Sector"
              icon="business-outline"
            />

            {showOtherSectorInput && (
              <View style={styles.otherSectorContainer}>
                <Text style={styles.otherSectorLabel}>Please specify your sector:</Text>
                <TextInput
                  style={styles.otherSectorInput}
                  value={otherSector}
                  onChangeText={setOtherSector}
                  placeholder="Enter your sector"
                  placeholderTextColor="#7A7A7A"
                />
              </View>
            )}

            <SelectBox
              label="Please Select your current work status"
              value={workStatus}
              onPress={() => setModalVisibleWorkStatus(true)}
              placeholder="Select Work Status"
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
        visible={modalVisibleSector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisibleSector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { width: windowWidth * 0.85 }]}>
            <Text style={styles.modalTitle}>Select Sector</Text>
            <FlatList
              data={sectorOptions}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleSectorSelect(item)}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisibleSector(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalVisibleWorkStatus}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisibleWorkStatus(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { width: windowWidth * 0.85 }]}>
            <Text style={styles.modalTitle}>Select Work Status</Text>
            <FlatList
              data={workStatusOptions}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => { setWorkStatus(item); setModalVisibleWorkStatus(false); }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisibleWorkStatus(false)}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    marginTop: 30,
    marginRight: 10,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  otherSectorContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  otherSectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#004b23',
    marginBottom: 5,
  },
  otherSectorInput: {
    borderWidth: 1,
    borderColor: '#004b23',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333333',
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
  selectLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#004b23',
  },
  requiredAsterisk: {
    color: '#FF0000',
    fontWeight: 'bold',
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

export default TransfereeSectorAndWorkStatus;

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Alert, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RadioButton, Checkbox } from 'react-native-paper';
import { auth, db } from '../firebase_config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const FreshmenCourse = () => {
  const navigation = useNavigation();
  const [firstChoice, setFirstChoice] = useState('');
  const [secondChoice, setSecondChoice] = useState('');
  const [thirdChoice, setThirdChoice] = useState('');
  const [certify, setCertify] = useState(false);
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
        const courseData = data.course || {};
        setFirstChoice(courseData.first_choice || '');
        setSecondChoice(courseData.second_choice || '');
        setThirdChoice(courseData.third_choice || '');
        setCertify(courseData.certified || false);
      }
    } catch (error) {
      console.error('Error fetching existing data:', error);
    }
  };

  const handleSubmit = async () => {
    if (!firstChoice || !secondChoice || !thirdChoice || !certify) {
      Alert.alert('Error', 'Please fill in all required fields and certify the information.');
      return;
    }

    const applicantData = {
      course: {
        first_choice: firstChoice,
        second_choice: secondChoice,
        third_choice: thirdChoice,
        certified: certify
      }
    };

    try {
      setIsLoading(true);
      await setDoc(doc(db, 'freshmen_applicant_form', userEmail), applicantData, { merge: true });
      console.log('Course selection information saved successfully');
      setIsLoading(false);
      navigation.navigate('FreshmenCaptureImage');
    } catch (error) {
      console.error('Error saving course selection information:', error);
      Alert.alert('Submission Failed', 'An error occurred while submitting the form. Please try again.');
      setIsLoading(false);
    }
  };

  const courses = [
    { code: 'BSCPE', name: 'Bachelor of Science in Computer Engineering' },
    { code: 'BSIT', name: 'Bachelor of Science in Information Technology' },
    { code: 'BSE', name: 'Bachelor of Science in Entrepreneurship' },
    { code: 'BSBA', name: 'Bachelor of Science in Business Administration Major in Human Resources Management' },
    { code: 'BEED', name: 'Bachelor of Elementary Education Generalist' },
    { code: 'BSED', name: 'Bachelor of Secondary Education Major in Science' },
    { code: 'BECED', name: 'Bachelor of Early Childhood Education' },
    { code: 'BTLED', name: 'Bachelor of Technology and Livelihood Education Major in Information Communication Technology' }
  ];

  const isDisabled = (courseCode, choice) => {
    if (choice === 'second') {
      return courseCode === firstChoice;
    } else if (choice === 'third') {
      return courseCode === firstChoice || courseCode === secondChoice;
    }
    return false;
  };

  const handleChoiceChange = (choice, value) => {
    if (choice === 'first') {
      if (secondChoice === value) setSecondChoice('');
      if (thirdChoice === value) setThirdChoice('');
      setFirstChoice(value);
    } else if (choice === 'second') {
      if (firstChoice === value) setFirstChoice('');
      if (thirdChoice === value) setThirdChoice('');
      setSecondChoice(value);
    } else if (choice === 'third') {
      if (firstChoice === value) setFirstChoice('');
      if (secondChoice === value) setSecondChoice('');
      setThirdChoice(value);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <LinearGradient
          colors={['#006400', '#004d00']}
          style={styles.header}
        >
          <Image source={require('../Picture/cdm_logo.png')} style={styles.logo} />
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            <View style={styles.subHeader}>
              <Text style={styles.subHeaderText}>Course Selection</Text>
            </View>

            <View style={styles.boxContainer}>
              <View style={styles.titleContainer}>
                <Ionicons name="school-outline" size={24} color="#004b23" />
                <Text style={styles.boxTitle}>PROGRAMS/COURSES BEING OFFERED<Text style={styles.requiredAsterisk}>*</Text></Text>
              </View>
              
              {courses.map((course, index) => (
                <Text key={index} style={styles.courseName}>
                  {index + 1}. {course.code} - {course.name}
                </Text>
              ))}

              <View style={styles.choiceHeader}>
                <Text style={styles.choiceHeaderText}>Course</Text>
                <Text style={styles.choiceHeaderText}>First Choice</Text>
                <Text style={styles.choiceHeaderText}>Second Choice</Text>
                <Text style={styles.choiceHeaderText}>Third Choice</Text>
              </View>

              {courses.map((course, index) => (
                <View key={index} style={styles.courseRow}>
                  <Text style={styles.courseCode}>{course.code}</Text>
                  <View style={styles.radioButtonColumn}>
                    <RadioButton
                      value={course.code}
                      status={firstChoice === course.code ? 'checked' : 'unchecked'}
                      onPress={() => handleChoiceChange('first', course.code)}
                      color="#004b23"
                    />
                  </View>
                  <View style={styles.radioButtonColumn}>
                    <RadioButton
                      value={course.code}
                      status={secondChoice === course.code ? 'checked' : 'unchecked'}
                      onPress={() => handleChoiceChange('second', course.code)}
                      color="#004b23"
                      disabled={isDisabled(course.code, 'second')}
                    />
                  </View>
                  <View style={styles.radioButtonColumn}>
                    <RadioButton
                      value={course.code}
                      status={thirdChoice === course.code ? 'checked' : 'unchecked'}
                      onPress={() => handleChoiceChange('third', course.code)}
                      color="#004b23"
                      disabled={isDisabled(course.code, 'third')}
                    />
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.boxContainer}>
              <View style={styles.titleContainer}>
                <Ionicons name="checkmark-circle-outline" size={24} color="#004b23" />
                <Text style={styles.certifyText}>
                  I hereby certify that all the facts and information stated on this form are true and correct
                </Text>
              </View>
              <View style={styles.checkboxContainer}>
                <Checkbox
                  status={certify ? 'checked' : 'unchecked'}
                  onPress={() => setCertify(!certify)}
                  color="#004b23"
                />
                <Text style={styles.checkboxLabel}>I certify<Text style={styles.requiredAsterisk}>*</Text></Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.nextButton, (!firstChoice || !secondChoice || !thirdChoice || !certify) && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={!firstChoice || !secondChoice || !thirdChoice || !certify}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
          >
            <LinearGradient
              colors={['#004b23', '#004b23']}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
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
    paddingBottom: 100,
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
    color: '#006400',
  },
  boxContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  boxTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#004b23',
  },
  choiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 5,
    marginTop: 20,
  },
  choiceHeaderText: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#004b23',
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  courseCode: {
    flex: 1,
    marginLeft: 15,
    fontWeight: 'bold',
    color: '#333333',
  },
  radioButtonColumn: {
    flex: 1,
    alignItems: 'center',
  },
  courseName: {
    marginBottom: 5,
    fontSize: 14,
    color: '#333333',
  },
  certifyText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333333',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  checkboxLabel: {
    marginLeft: 8,
    color: '#333333',
  },
  requiredAsterisk: {
    color: 'red',
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

export default FreshmenCourse;

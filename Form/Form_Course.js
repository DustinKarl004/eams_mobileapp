import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../firebase_config';
import { doc, getDoc } from 'firebase/firestore';

const ViewCourse = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [courseInfo, setCourseInfo] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchExistingData(user.email);
      } else {
        navigation.navigate('Login');
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchExistingData = async (email) => {
    try {
      setIsLoading(true);
      const freshmenDocRef = doc(db, 'freshmen_applicant_form', email);
      const transfereeDocRef = doc(db, 'transferee_applicant_form', email);
      
      const freshmenDocSnap = await getDoc(freshmenDocRef);
      const transfereeDocSnap = await getDoc(transfereeDocRef);

      if (freshmenDocSnap.exists()) {
        const data = freshmenDocSnap.data();
        setCourseInfo(data.course || {});
      } else if (transfereeDocSnap.exists()) {
        const data = transfereeDocSnap.data();
        setCourseInfo(data.course || {});
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
    navigation.navigate('ViewCaptureImage');
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
                <Text style={styles.subHeaderText}>Course Selection</Text>
              </View>

              <View style={styles.boxContainer}>
                <View style={styles.titleContainer}>
                  <Ionicons name="school-outline" size={24} color="#004b23" />
                  <Text style={styles.boxTitle}>PROGRAMS/COURSES BEING OFFERED</Text>
                </View>
                
                {courses.map((course, index) => (
                  <Text key={index} style={styles.courseName}>
                    {index + 1}. {course.code} - {course.name}
                  </Text>
                ))}

                <View style={styles.choiceContainer}>
                  <Text style={styles.choiceLabel}>First Choice:</Text>
                  <Text style={styles.choiceValue}>{courseInfo?.first_choice || 'Not specified'}</Text>
                </View>

                <View style={styles.choiceContainer}>
                  <Text style={styles.choiceLabel}>Second Choice:</Text>
                  <Text style={styles.choiceValue}>{courseInfo?.second_choice || 'Not specified'}</Text>
                </View>

                <View style={styles.choiceContainer}>
                  <Text style={styles.choiceLabel}>Third Choice:</Text>
                  <Text style={styles.choiceValue}>{courseInfo?.third_choice || 'Not specified'}</Text>
                </View>

                <View style={styles.certifyContainer}>
                  <Ionicons name="checkmark-circle-outline" size={24} color="#004b23" />
                  <Text style={styles.certifyText}>
                    Information certified: {courseInfo?.certified ? 'Yes' : 'No'}
                  </Text>
                </View>
              </View>
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
  courseName: {
    marginBottom: 5,
    fontSize: 14,
    color: '#333333',
  },
  choiceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 5,
  },
  choiceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#004b23',
  },
  choiceValue: {
    fontSize: 16,
    color: '#333333',
  },
  certifyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  certifyText: {
    fontSize: 16,
    marginLeft: 10,
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

export default ViewCourse;

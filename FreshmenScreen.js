import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, SafeAreaView, Image, Animated } from 'react-native';
import { Checkbox } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from './firebase_config';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';

const FreshmenScreen = () => {
  const navigation = useNavigation();
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isPressed, setIsPressed] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingCollections, setIsCheckingCollections] = useState(false);
  const [isFreshmen, setIsFreshmen] = useState(false);
  const [isTransferee, setIsTransferee] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setEmail(user.email);
        checkApplicationStatus(user.email);
      } else {
        setError('No user is signed in.');
      }
    });

    return () => unsubscribe();
  }, []);

  const checkApplicationStatus = async (userEmail) => {
    setLoading(true);
    setIsCheckingCollections(true);
    setProgress(0);
    setLoadingText('Checking application status...');
    
    try {
      const freshmenDocRef = doc(db, 'freshmen_applicant_form', userEmail);
      const freshmenDocSnap = await getDoc(freshmenDocRef);

      setProgress(0.3);
      setLoadingText('Verifying documents...');
      await new Promise(resolve => setTimeout(resolve, 500));

      if (freshmenDocSnap.exists()) {
        const freshmenData = freshmenDocSnap.data();
        const freshmenComplete = checkFreshmenDataCompletion(freshmenData);

        setProgress(0.6);
        setLoadingText('Processing data...');
        await new Promise(resolve => setTimeout(resolve, 500));

        if (freshmenComplete) {
          setIsFreshmen(true);
          setIsComplete(true);
          setCanProceed(true);
          setError(
            <View style={[styles.enhancedStatusContainer, { backgroundColor: '#004b23' }]}>
              <View style={styles.statusIconContainer}>
                <Ionicons name="checkmark-circle" size={40} color="#FFFFFF" />
              </View>
              <Text style={[styles.enhancedStatusText, { color: '#FFFFFF' }]}>
                You have successfully submitted your freshmen application.
              </Text>
            </View>
          );
        } else {
          setIsFreshmen(true);
          setIsComplete(false);
          setCanProceed(true);
          setError(
            <View style={[styles.enhancedStatusContainer, { backgroundColor: '#dc3545' }]}>
              <View style={styles.statusIconContainer}>
                <Ionicons name="time" size={40} color="#FFFFFF" />
              </View>
              <Text style={[styles.enhancedStatusText, { color: '#FFFFFF' }]}>
                Your freshmen application is incomplete. Please proceed to complete it.
              </Text>
            </View>
          );
        }
      } else {
        const transfereeDocRef = doc(db, 'transferee_applicant_form', userEmail);
        const transfereeDocSnap = await getDoc(transfereeDocRef);
    
        setProgress(0.6);
        setLoadingText('Processing data...');
        await new Promise(resolve => setTimeout(resolve, 500));

        if (transfereeDocSnap.exists()) {
          const transfereeData = transfereeDocSnap.data();
          const transfereeComplete = checkTransfereeDataCompletion(transfereeData);
    
          if (transfereeComplete) {
            setIsTransferee(true);
            setIsComplete(true);
            setCanProceed(false);
            setError(
              <View style={[styles.enhancedStatusContainer, { backgroundColor: '#004b23' }]}>
                <View style={styles.statusIconContainer}>
                  <Ionicons name="checkmark-circle" size={40} color="#FFFFFF" />
                </View>
                <Text style={[styles.enhancedStatusText, { color: '#FFFFFF' }]}>
                  You have successfully submitted your transferee application.
                </Text>
              </View>
            );
          } else {
            setIsTransferee(true);
            setIsComplete(false);
            setCanProceed(false);
            setError(
              <View style={[styles.enhancedStatusContainer, { backgroundColor: '#dc3545' }]}>
                <View style={styles.statusIconContainer}>
                <Ionicons name="time" size={40} color="#FFFFFF" />
                </View>
                <Text style={[styles.enhancedStatusText, { color: '#FFFFFF' }]}>
                  You have an incomplete transferee application. Please proceed to complete it.
                </Text>
              </View>
            );
          }
        } else {
          setCanProceed(true);
          setError(
            <View style={[styles.enhancedStatusContainer, { backgroundColor: '#ffc107' }]}>
              <View style={styles.statusIconContainer}>
                <Ionicons name="information-circle" size={40} color="#000000" />
              </View>
              <Text style={[styles.enhancedStatusText, { color: '#000000' }]}>
                You can now start your freshmen application process.
              </Text>
            </View>
          );
        }
      }

      setProgress(1);
      setLoadingText('Complete!');
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error('Failed to check application status:', error);
      setError(
        <View style={styles.enhancedStatusContainer}>
          <View style={styles.statusIconContainer}>
            <Ionicons name="warning" size={40} color="#dc3545" />
          </View>
          <Text style={styles.enhancedStatusText}>
            An error occurred while checking your application status.
          </Text>
        </View>
      );
    } finally {
      setLoading(false);
      setIsCheckingCollections(false);
    }
  };
  
  const checkFreshmenDataCompletion = (data) => {
    return data?.applicant_info && 
           data?.address_and_cn && 
           data?.proof_of_residency && 
           data?.other_applicant_info &&           
           data?.sector_and_work_status && 
           data?.parents_info && 
           data?.family_income && 
           data?.guardian_info && 
           data?.education && 
           data?.proof_of_eligibility && 
           data?.family_info && 
           data?.course && 
           data?.captured_image
  };

  const checkTransfereeDataCompletion = (data) => {
    return data?.applicant_info && 
           data?.address_and_cn && 
           data?.proof_of_residency && 
           data?.other_applicant_info &&           
           data?.sector_and_work_status && 
           data?.parents_info && 
           data?.family_income && 
           data?.guardian_info && 
           data?.education && 
           data?.proof_of_eligibility && 
           data?.family_info && 
           data?.course && 
           data?.captured_image
  };

  const renderItems = [
    {
      key: '0',
      component: (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Ionicons name="chevron-back" size={28} color="#007AFF" />
            <Text style={styles.backButtonText}>Home</Text>
          </TouchableOpacity>
          <Image 
            source={require('./Picture/cdm_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      ),
    },
    {
      key: '1',
      component: (
        <View style={styles.welcomeCard}>
          <Text style={styles.title}>Welcome to CDM!</Text>
          <Text style={styles.welcomeText}>
            Thank you for your interest in joining the CDM community! We are excited to welcome you to Colegio de Montalban soon, where your future begins.
          </Text>
          <View style={styles.emailContainer}>
            <Text style={styles.emailLabel}>Your registered email:</Text>
            <Text style={styles.email}>{email}</Text>
          </View>
          {error}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#004b23" />
              <Text style={styles.loadingText}>{loadingText}</Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
              </View>
            </View>
          )}
        </View>
      ),
    },
    {
      key: '2',
      component: (
        <View style={styles.noticeCard}>
          <View style={styles.noticeHeader}>
            <Ionicons name="warning" size={24} color="#8B0000" />
            <Text style={styles.noticeTitle}>IMPORTANT NOTICE</Text>
          </View>
          <Text style={styles.noticeText}>
            Please note that answering this form or meeting the minimum requirements does not guarantee admission. CDM reserves the right to consider additional factors such as available slots, resources, and the overall applicant pool. Admission is only given to applicants from Montalban, Rizal.
          </Text>
        </View>
      ),
    },
    {
      key: '3',
      component: (
        <View style={styles.privacyCard}>
          <View style={styles.privacyHeader}>
            <Ionicons name="shield-checkmark" size={24} color="#004b23" />
            <Text style={styles.privacyTitle}>Data Privacy Notice</Text>
          </View>
          <Text style={styles.privacyText}>
            In accordance with Republic Act No. 10173 (Data Privacy Act of 2012), we are committed to protecting your personal information. By submitting this form, you acknowledge that:
          </Text>
          <View style={styles.privacyPoints}>
            <Text style={styles.bulletPoint}>• Your personal information will be collected and processed solely for admission purposes</Text>
            <Text style={styles.bulletPoint}>• Your data will be stored securely and accessed only by authorized personnel</Text>
            <Text style={styles.bulletPoint}>• You have the right to access, correct, and request deletion of your information</Text>
            <Text style={styles.bulletPoint}>• CDM implements strict security measures to protect your data from unauthorized access</Text>
          </View>
          <View style={styles.consentContainer}>
            <Text style={styles.consentText}>
              By checking below, you agree to let CDM collect and process your personal information as stated above.
            </Text>
            <View style={styles.checkboxContainer}>
              <Checkbox
                status={checked ? 'checked' : 'unchecked'}
                onPress={() => {
                  setChecked(!checked);
                  setIsCheckingCollections(true);
                  setTimeout(() => setIsCheckingCollections(false), 1000);
                }}
                color="#004b23"
              />
              <Text style={styles.checkboxLabel}>
                <Text style={styles.requiredAsterisk}>*</Text> I have read and agree to CDM's Data Privacy Notice and consent to the processing of my personal information.
              </Text>
            </View>
          </View>
        </View>
      ),
    },
  ];

  const handleNextPress = async () => {
    if (checked && canProceed) {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        navigation.navigate('FreshmenApplicantInformation');
      } catch (error) {
        console.error('Error navigating to ApplicantInformation:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#F5F7F5', '#E8F0E8']}
        style={styles.gradient}
      >
        <FlatList
          data={renderItems}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => item.component}
          contentContainerStyle={styles.contentContainer}
          ListFooterComponent={
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  (!checked || !canProceed || isCheckingCollections) && styles.disabledButton
                ]}
                onPress={handleNextPress}
                disabled={!checked || !canProceed || isLoading || isCheckingCollections}
                onPressIn={() => setIsPressed(true)}
                onPressOut={() => setIsPressed(false)}
              >
                <LinearGradient
                  colors={checked && canProceed && !isCheckingCollections 
                    ? (isPressed ? ['#003b1c', '#004b23'] : ['#004b23', '#003b1c']) 
                    : ['#cccccc', '#b3b3b3']}
                  style={styles.buttonGradient}
                >
                  {isLoading || isCheckingCollections ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.nextButtonText}>
                        {isFreshmen && isComplete ? 'Done' : 'Next'}
                      </Text>
                      <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
        />
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
      flex: 1,
    },
    gradient: {
      flex: 1,
    },
    contentContainer: {
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center', 
      justifyContent: 'space-between',
      marginTop: 40,
      marginBottom: 24,
      paddingHorizontal: 8,
    },
    logo: {
      width: 120,
      height: 48,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
    },
    backButtonText: {
      color: '#007AFF',
      fontSize: 17,
      fontWeight: '600',
      marginLeft: 6,
    },
    welcomeCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 24,
      marginBottom: 20,
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.27,
      shadowRadius: 4.65,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: '#004b23',
      textAlign: 'center',
      marginBottom: 20,
      letterSpacing: 0.5,
    },
    welcomeText: {
      fontSize: 16,
      color: '#333',
      lineHeight: 26,
      textAlign: 'justify',
      marginBottom: 24,
    },
    emailContainer: {
      backgroundColor: '#F8F9FA',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#E9ECEF',
    },
    emailLabel: {
      fontSize: 15,
      color: '#495057',
      marginBottom: 6,
    },
    email: {
      fontSize: 17,
      color: '#007AFF',
      fontWeight: '600',
    },
    loadingContainer: {
      alignItems: 'center',
      marginTop: 20,
      padding: 16,
      backgroundColor: '#F8F9FA',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E9ECEF',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: '#004b23',
      fontWeight: '600',
    },
    progressBarContainer: {
      width: '100%',
      height: 6,
      backgroundColor: '#E9ECEF',
      borderRadius: 3,
      marginTop: 12,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: '#004b23',
      borderRadius: 3,
    },
    enhancedStatusContainer: {
      alignItems: 'center',
      padding: 20,
      borderRadius: 12,
      marginTop: 12,
    },
    statusIconContainer: {
      marginBottom: 12,
    },
    enhancedStatusText: {
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    noticeCard: {
      backgroundColor: '#FFF8F8',
      borderRadius: 20,
      padding: 24,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: '#FFE5E5',
      elevation: 4,
      shadowColor: '#FF0000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
    },
    noticeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    noticeTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: '#8B0000',
      marginLeft: 10,
      letterSpacing: 0.5,
    },
    noticeText: {
      fontSize: 15,
      color: '#4A4A4A',
      lineHeight: 24,
      textAlign: 'justify',
    },
    privacyCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 24,
      marginBottom: 20,
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.27,
      shadowRadius: 4.65,
    },
    privacyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    privacyTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: '#004b23',
      marginLeft: 12,
      letterSpacing: 0.5,
    },
    privacyText: {
      fontSize: 16,
      color: '#333',
      lineHeight: 24,
      marginBottom: 16,
      textAlign: 'justify',
    },
    privacyPoints: {
      backgroundColor: '#F8F9FA',
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
    },
    bulletPoint: {
      fontSize: 15,
      color: '#4A4A4A',
      lineHeight: 24,
      marginBottom: 8,
      paddingLeft: 8,
    },
    consentContainer: {
      backgroundColor: '#F0F8F1',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#C8E6C9',
    },
    consentText: {
      fontSize: 15,
      color: '#333',
      lineHeight: 22,
      marginBottom: 16,
      textAlign: 'justify',
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: '#FFFFFF',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E9ECEF',
    },
    checkboxLabel: {
      flex: 1,
      marginLeft: 14,
      fontSize: 15,
      color: '#333',
      lineHeight: 22,
    },
    requiredAsterisk: {
      color: '#FF3B30',
      fontWeight: '700',
    },
    buttonContainer: {
      marginTop: 28,
      marginBottom: 36,
      paddingHorizontal: 20,
    },
    nextButton: {
      borderRadius: 30,
      overflow: 'hidden',
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.27,
      shadowRadius: 4.65,
    },
    buttonGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 18,
      paddingHorizontal: 28,
    },
    nextButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '700',
      marginRight: 10,
      letterSpacing: 0.5,
    },
    disabledButton: {
      opacity: 0.6,
    },
    errorText: {
      fontSize: 15,
      color: '#FF3B30',
      textAlign: 'center',
      marginTop: 10,
      fontWeight: '600',
    },
  });

export default FreshmenScreen;
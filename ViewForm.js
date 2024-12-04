import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Platform, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from './firebase_config';
import { doc, getDoc } from 'firebase/firestore';

const ViewForm = ({ navigation }) => {
  const [isFormComplete, setIsFormComplete] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email);
        checkFormCompletion(user.email);
      } else {
        navigation.navigate('Login');
      }
    });

    return () => unsubscribe();
  }, []);

  const checkFormCompletion = async (email) => {
    const requiredFields = [
      'applicant_info',
      'address_and_cn',
      'proof_of_residency',
      'other_applicant_info',
      'sector_and_work_status',
      'parents_info',
      'family_income',
      'guardian_info',
      'education',
      'proof_of_eligibility',
      'family_info',
      'course',
      'captured_image'
    ];

    try {
      const freshmenDocRef = doc(db, 'freshmen_applicant_form', email);
      const transfereeDocRef = doc(db, 'transferee_applicant_form', email);
      
      const freshmenDocSnap = await getDoc(freshmenDocRef);
      const transfereeDocSnap = await getDoc(transfereeDocRef);

      let isComplete = false;

      if (freshmenDocSnap.exists()) {
        const freshmenData = freshmenDocSnap.data();
        isComplete = requiredFields.every(field => freshmenData[field]);
      }

      if (!isComplete && transfereeDocSnap.exists()) {
        const transfereeData = transfereeDocSnap.data();
        isComplete = requiredFields.every(field => transfereeData[field]);
      }

      setIsFormComplete(isComplete);
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking form completion:', error);
      Alert.alert('Error', 'An error occurred while checking your form completion status.');
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#004b23', '#004b23']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.header}
      >
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>View Form</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Image source={require('./Picture/cdm_logo.png')} style={styles.logo} />
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.title}>CDM Application Portal</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.statusContainer}>
            <Text style={styles.statusTitle}>Application Status</Text>
            <View style={[styles.statusIndicator, isFormComplete ? styles.statusComplete : styles.statusIncomplete]}>
              <Text style={styles.statusText}>
                {isFormComplete ? 'Complete' : 'Incomplete'}
              </Text>
            </View>
          </View>

          {isFormComplete ? (
            <View style={styles.actionContainer}>
              <Text style={styles.successMessage}>
                Your application is complete! You can now view your details.
              </Text>
              <TouchableOpacity 
                style={styles.viewButton}
                onPress={() => navigation.navigate('ViewApplicantInformation')}
              >
                <Ionicons name="document-text-outline" size={24} color="white" style={styles.buttonIcon} />
                <Text style={styles.viewButtonText}>View Application Details</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionContainer}>
              <Text style={styles.warningMessage}>
                Please complete all required fields in your application form before proceeding.
              </Text>
              <TouchableOpacity 
                style={[styles.viewButton, styles.disabledButton]}
                disabled={true}
              >
                <Ionicons name="lock-closed-outline" size={24} color="#666666" style={styles.buttonIcon} />
                <Text style={[styles.viewButtonText, styles.disabledButtonText]}>View Application Details</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="home-outline" size={24} color="#004b23" />
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem} 
        >
          <Ionicons name="document-text" size={24} color="#004b23" />
          <Text style={styles.tabLabel}>View Form</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => navigation.navigate('UploadDocuments')}
        >
          <Ionicons name="cloud-upload-outline" size={24} color="#004b23" />
          <Text style={styles.tabLabel}>Upload</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => navigation.navigate('ProfileScreen')}
        >
          <Ionicons name="person-outline" size={24} color="#004b23" />
          <Text style={styles.tabLabel}>Profile</Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#004b23" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F4F0',
  },
  header: {
    height: Platform.OS === 'ios' ? 100 : 90,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 15,
  },
  welcomeText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#004b23',
    textAlign: 'center',
    marginBottom: 5,
  },
  divider: {
    height: 2,
    backgroundColor: '#E0E0E0',
    marginVertical: 20,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  statusIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusComplete: {
    backgroundColor: '#4CAF50',
  },
  statusIncomplete: {
    backgroundColor: '#FF6B6B',
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  successMessage: {
    color: '#4CAF50',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  warningMessage: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  viewButton: {
    backgroundColor: '#004b23',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    width: '100%',
  },
  buttonIcon: {
    marginRight: 10,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  disabledButtonText: {
    color: '#666666',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 12,
    color: '#004b23',
    marginTop: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ViewForm;

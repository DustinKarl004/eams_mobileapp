import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Alert, SafeAreaView, KeyboardAvoidingView, Platform, Modal, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { auth, db, storage } from '../firebase_config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';

const FreshmenProofOfEligibility = () => {
  const navigation = useNavigation();
  const [selectedFiles, setSelectedFiles] = useState([]);
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
        const proofOfEligibilityData = data.proof_of_eligibility || {};
        if (proofOfEligibilityData.file_urls_fetch && proofOfEligibilityData.file_urls_fetch.length > 0) {
          setSelectedFiles(proofOfEligibilityData.file_urls_fetch);
        }
      }
    } catch (error) {
      console.error('Error fetching existing data:', error);
    }
  };

  const handleFileSelect = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsMultipleSelection: true,
      });

      if (!result.canceled) {
        setSelectedFiles(prevFiles => [...prevFiles, ...result.assets]);
      } else {
        console.log('User cancelled image picker');
      }
    } catch (error) {
      console.error('Error selecting files:', error);
      Alert.alert('Error', 'An error occurred while selecting files.');
    }
  };

  const handleNextPress = async () => {
    if (selectedFiles.length === 0) {
      Alert.alert('Missing Files', 'Please select at least one file for proof of eligibility.');
      return;
    }

    try {
      setIsLoading(true);
      // Delete existing files
      const storageRef = ref(storage, `uploads/freshmen_proof_of_eligibility/${userEmail}`);
      const existingFiles = await listAll(storageRef);
      await Promise.all(existingFiles.items.map(fileRef => deleteObject(fileRef)));

      // Upload new files
      const uploadedFiles = await Promise.all(selectedFiles.map(uploadFile));

      const applicantData = {
        proof_of_eligibility: {
          files_count: selectedFiles.length,
          file_urls: uploadedFiles.map(file => file.downloadURL),
          file_urls_fetch: uploadedFiles.map(file => ({
          uri: file.uri,
          type: file.type,
          name: file.name
        })),
      }
      };

      await setDoc(doc(db, 'freshmen_applicant_form', userEmail), applicantData, { merge: true });
      console.log('Proof of Eligibility information saved successfully');
      setIsLoading(false);
      navigation.navigate('FreshmenFamilyInformation');
    } catch (error) {
      console.error('Error saving proof of eligibility information:', error);
      Alert.alert(
        'Submission Failed', 
        'An error occurred while submitting the form. Please remove all selected images and choose files again.',
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedFiles([]);
            }
          }
        ]
      );
      setIsLoading(false);
    }
  };

  const uploadFile = async (file) => {
    try {
      const response = await fetch(file.uri);
      const blob = await response.blob();
    
    const fileName = file.uri.split('/').pop();
    const fileExtension = fileName.split('.').pop().toLowerCase();
  
    let mimeType = 'application/octet-stream'; // default MIME type
    if (fileExtension === 'png') mimeType = 'image/png';
    else if (fileExtension === 'jpg' || fileExtension === 'jpeg') mimeType = 'image/jpeg';
  
    const storageRef = ref(storage, `uploads/freshmen_proof_of_eligibility/${userEmail}/${fileName}`);
    
    const metadata = {
      contentType: mimeType,
    };
  
    await uploadBytes(storageRef, blob, metadata);
    const downloadURL = await getDownloadURL(storageRef);
    return { uri: file.uri, name: fileName, type: mimeType, downloadURL };
  } catch (error) {
    console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const renderItem = ({ item }) => {
    if (item.key === 'content') {
      return (
        <View style={styles.formContainer}>
          <View style={styles.subHeader}>
            <Text style={styles.subHeaderText}>Proof of Eligibility</Text>
          </View>

          <View style={styles.inputBox}>
            <View style={styles.labelContainer}>
              <Ionicons name="document-outline" size={24} color="#004b23" style={styles.inputIcon} />
              <Text style={styles.inputLabel}>
                PROOF OF ELIGIBILITY FOR ENROLLMENT IN COLLEGE<Text style={styles.requiredAsterisk}>*</Text>
              </Text>
            </View>
            
            <Text style={styles.inputDescription}>Graduated in Senior High or ALS</Text>

            <View style={styles.bulletList}>
              <BulletItem text="Diploma" />
              <BulletItem text="Certificate of Graduate" />
            </View>

            <Text style={styles.inputDescription}>Currently Enrolled in Senior High</Text>

            <View style={styles.bulletList}>
              <BulletItem text="Certificate of Enrollment" />
              <BulletItem text="Registration Form" />
              <BulletItem text="School ID" />
              <BulletItem text="1st Semester Report Card" />
            </View>

            <Text style={styles.inputDescription}>Note: Signed or certified by school authority</Text>

            <View style={styles.warningContainer}>
              <Ionicons name="alert-circle-outline" size={24} color="#FFA500" style={styles.warningIcon} />
              <Text style={styles.warningText}>
                If submission fails, please remove all selected images and choose files again.
              </Text>
            </View>
          
            <TouchableOpacity style={styles.selectButton} onPress={handleFileSelect}>
              <Text style={styles.selectButtonText}>
                {selectedFiles.length > 0 ? 'Add Another Image' : 'Choose Files'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.filesContainer}>
              <FlatList
                data={selectedFiles}
                renderItem={({ item, index }) => (
                  <View style={styles.fileItem}>
                    <Image source={{ uri: item.uri }} style={styles.imagePreview} />
                    <Text style={styles.fileName}>{item.name || item.uri.split('/').pop()}</Text>
                    <TouchableOpacity onPress={() => handleRemoveFile(index)} style={styles.removeButton}>
                      <Ionicons name="close-circle" size={24} color="#FF6347" />
                    </TouchableOpacity>
                  </View>
                )}
                keyExtractor={(item, index) => index.toString()}
              />
            </View>
          </View>
        </View>
      );
    }
    return null;
  };

  const isFormValid = selectedFiles.length > 0;

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

        <FlatList
          data={[{ key: 'content' }]}
          renderItem={renderItem}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.scrollContent}
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.nextButton, !isFormValid && styles.disabledButton]}
            onPress={handleNextPress}
            disabled={!isFormValid}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
          >
            <LinearGradient
              colors={isFormValid ? (isPressed ? ['#003b1c', '#004b23'] : ['#004b23', '#003b1c']) : ['#cccccc', '#b3b3b3']}
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

const BulletItem = ({ text }) => (
  <View style={styles.bulletItem}>
    <MaterialCommunityIcons name="checkbox-blank-circle" size={8} color="#004b23" style={styles.bulletIcon} />
    <Text style={styles.bulletText}>{text}</Text>
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
    fontSize: 15,
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
  bulletList: {
    marginBottom: 16,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bulletIcon: {
    marginRight: 8,
  },
  bulletText: {
    fontSize: 16,
    color: '#004b23',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  warningIcon: {
    marginRight: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#FF6F00',
  },
  selectButton: {
    backgroundColor: '#004b23',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  selectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  filesContainer: {
    marginTop: 20,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
  },
  imagePreview: {
    width: 50,
    height: 50,
    marginRight: 10,
    borderRadius: 5,
  },
  fileName: {
    fontSize: 14,
    color: '#004b23',
    flex: 1,
  },
  removeButton: {
    padding: 5,
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

export default FreshmenProofOfEligibility;

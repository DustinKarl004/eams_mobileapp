import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Alert, SafeAreaView, KeyboardAvoidingView, Platform, Modal, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { auth, db, storage } from '../firebase_config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';

const FreshmenProofofResidency = () => {
  const navigation = useNavigation();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isPressed, setIsPressed] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [documentType, setDocumentType] = useState('');
  const [documentTypeOptions] = useState(['Parents Valid ID', 'PSA', 'Barangay Clearance', 'Utility Bill']);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagesConfirmed, setImagesConfirmed] = useState(false);

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
        const proof_of_residency = data.proof_of_residency || {};
        if (proof_of_residency.file_urls_fetch && proof_of_residency.file_urls_fetch.length > 0) {
          setSelectedFiles(proof_of_residency.file_urls_fetch);
        }
        if (proof_of_residency.document_type) {
          setDocumentType(proof_of_residency.document_type);
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
        const newImages = result.assets;
        for (let image of newImages) {
          setSelectedImage(image);
          setConfirmationModalVisible(true);
          // Wait for user confirmation before proceeding to next image
          await new Promise(resolve => {
            const unsubscribe = setInterval(() => {
              if (!confirmationModalVisible) {
                clearInterval(unsubscribe);
                resolve();
              }
            }, 100);
          });
        }
      }
    } catch (error) {
      console.error('Error selecting files:', error);
      Alert.alert('Error', 'An error occurred while selecting files.');
    }
  };

  const handleConfirmImage = () => {
    if (selectedImage) {
      setSelectedFiles(prevFiles => [...prevFiles, selectedImage]);
    }
    setConfirmationModalVisible(false);
    setSelectedImage(null);
  };

  const handleRejectImage = () => {
    setConfirmationModalVisible(false);
    setSelectedImage(null);
    Alert.alert('Image Rejected', 'Please select a clearer image with good quality.');
  };

  const handleConfirmAllImages = () => {
    if (selectedFiles.length > 0) {
      setImagesConfirmed(true);
      Alert.alert('Images Confirmed', 'All selected images have been confirmed as good quality.');
    }
  };

  const handleNextPress = async () => {
    if (!imagesConfirmed) {
      Alert.alert('Confirmation Required', 'Please confirm that all images are of good quality before proceeding.');
      return;
    }

    if (selectedFiles.length === 0 || !documentType) {
      Alert.alert('Missing Information', 'Please select a document type and at least one file for proof of residency.');
      return;
    }

    try {
      setIsLoading(true);
      // Delete existing files
      const storageRef = ref(storage, `uploads/freshmen_proof_of_residency/${userEmail}`);
      const existingFiles = await listAll(storageRef);
      await Promise.all(existingFiles.items.map(fileRef => deleteObject(fileRef)));

      // Upload new files
      const uploadedFiles = await Promise.all(selectedFiles.map(uploadFile));

      const applicantData = {
        proof_of_residency: {
          files_count: selectedFiles.length,
          file_urls: uploadedFiles.map(file => file.downloadURL),
          file_urls_fetch: uploadedFiles.map(file => ({
            uri: file.uri,
            name: file.name,
            type: file.type
          })),
          document_type: documentType,
        }
      };

      await setDoc(doc(db, 'freshmen_applicant_form', userEmail), applicantData, { merge: true });
      console.log('Proof of Residency information saved successfully');
      setIsLoading(false);
      navigation.navigate('FreshmenOtherApplicantInfo');
    } catch (error) {
      console.error('Error saving proof of residency information:', error);
      Alert.alert(
        'Submission Failed', 
        'An error occurred while submitting the form. Please remove all selected images and choose files again.',
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedFiles([]);
              setDocumentType('');
              setImagesConfirmed(false);
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
    
      let mimeType = 'application/octet-stream';
      if (fileExtension === 'png') mimeType = 'image/png';
      else if (fileExtension === 'jpg' || fileExtension === 'jpeg') mimeType = 'image/jpeg';
    
      const storageRef = ref(storage, `uploads/freshmen_proof_of_residency/${userEmail}/${fileName}`);
      
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

  const isFormValid = selectedFiles.length > 0 && documentType !== '' && imagesConfirmed;

  const handleRemoveFile = (index) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setImagesConfirmed(false);
  };

  const renderItem = ({ item }) => {
    if (item.key === 'content') {
      return (
        <View style={styles.formContainer}>
          <View style={styles.subHeader}>
            <Text style={styles.subHeaderText}>Proof of Residency</Text>
          </View>

          <View style={styles.inputBox}>
            <View style={styles.labelContainer}>
              <Ionicons name="document-outline" size={24} color="#004b23" style={styles.inputIcon} />
              <Text style={styles.inputLabel}>
                Select one from the following documents<Text style={styles.requiredAsterisk}>*</Text>
              </Text>
            </View>
            
            <Text style={styles.inputDescription}>
              Note: The document must reflect the full address and the name must reflect self, parent, or legal guardian.
            </Text>

            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>Important Instructions:</Text>
              <Text style={styles.instructionText}>1. Ensure all text in the document is clearly readable</Text>
              <Text style={styles.instructionText}>2. Make sure the entire document is visible in the frame</Text>
              <Text style={styles.instructionText}>3. Avoid blurry or dark images</Text>
              <Text style={styles.instructionText}>4. File must be in JPG, JPEG, or PNG format</Text>
            </View>

            <TouchableOpacity style={styles.selectButton} onPress={() => setModalVisible(true)}>
              <Text style={[styles.selectButtonText, !documentType && styles.placeholderText]}>
                {documentType || 'Select Document Type'}
              </Text>
              <Ionicons name="chevron-down-outline" size={24} color="#004b23" />
            </TouchableOpacity>
            
            <View style={styles.warningContainer}>
              <Ionicons name="alert-circle-outline" size={24} color="#FFA500" style={styles.warningIcon} />
              <Text style={styles.warningText}>
                If submission fails, please remove all selected images and choose files again.
              </Text>
            </View>

            <TouchableOpacity style={styles.uploadButton} onPress={handleFileSelect}>
              <Text style={styles.uploadButtonText}>
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

            {selectedFiles.length > 0 && !imagesConfirmed && (
              <TouchableOpacity 
                style={styles.confirmImagesButton} 
                onPress={handleConfirmAllImages}
              >
                <Text style={styles.confirmImagesText}>Confirm Image Quality</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }
    return null;
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

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Document Type</Text>
            <FlatList
              data={documentTypeOptions}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  onPress={() => { setDocumentType(item); setModalVisible(false); }} 
                  style={styles.modalItem}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={confirmationModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setConfirmationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.imageConfirmationModal}>
            <Text style={styles.modalTitle}>Confirm Image Quality</Text>
            {selectedImage && (
              <Image 
                source={{ uri: selectedImage.uri }} 
                style={styles.previewImage}
                resizeMode="contain"
              />
            )}
            <Text style={styles.confirmationText}>
              Is this image clear and readable?
            </Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.acceptButton]}
                onPress={handleConfirmImage}
              >
                <Text style={styles.confirmButtonText}>Yes, Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.rejectButton]}
                onPress={handleRejectImage}
              >
                <Text style={styles.confirmButtonText}>No, Reject</Text>
              </TouchableOpacity>
            </View>
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
  instructionsContainer: {
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#004b23',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
    paddingLeft: 15,
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
    marginBottom: 10,
  },
  selectButtonText: {
    fontSize: 16,
    color: '#333333',
  },
  placeholderText: {
    color: '#7A7A7A',
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
  uploadButton: {
    backgroundColor: '#004b23',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadButtonText: {
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
  imageConfirmationModal: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 300,
    marginVertical: 20,
    borderRadius: 10,
  },
  confirmationText: {
    fontSize: 18,
    color: '#333333',
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  confirmButton: {
    padding: 15,
    borderRadius: 8,
    width: '45%',
  },
  acceptButton: {
    backgroundColor: '#004b23',
  },
  rejectButton: {
    backgroundColor: '#FF6347',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmImagesButton: {
    backgroundColor: '#FFA500',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  confirmImagesText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FreshmenProofofResidency;

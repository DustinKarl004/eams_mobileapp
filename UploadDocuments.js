import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Modal, Alert, Animated, Easing, Image, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db, storage } from './firebase_config';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';

const UploadDocuments = ({ navigation }) => {
  const [userEmail, setUserEmail] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploadEnabled, setIsUploadEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPressed, setIsPressed] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [userType, setUserType] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email);
        checkUserEligibility(user.email);
        fetchExistingData(user.email);
      } else {
        navigation.navigate('Login');
      }
    });

    return () => unsubscribe();
  }, []);

  const checkUserEligibility = async (email) => {
    try {
      const freshmenCollections = ['freshmen_approved_applicants', 'freshmen_examinees', 'freshmen_examinees_result'];
      const transfereeCollections = ['transferee_approved_applicants', 'transferee_examinees', 'transferee_examinees_result'];
      
      const freshmenEligibilityChecks = await Promise.all(freshmenCollections.map(async (collectionName) => {
        const q = query(collection(db, collectionName), where("email", "==", email));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
      }));
      
      const transfereeEligibilityChecks = await Promise.all(transfereeCollections.map(async (collectionName) => {
        const q = query(collection(db, collectionName), where("email", "==", email));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
      }));
      
      const isFreshmenEligible = freshmenEligibilityChecks.every(check => check);
      const isTransfereeEligible = transfereeEligibilityChecks.every(check => check);
      
      setIsUploadEnabled(isFreshmenEligible || isTransfereeEligible);
      setUserType(isFreshmenEligible ? 'freshmen' : (isTransfereeEligible ? 'transferee' : ''));
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking user eligibility:', error);
      setIsLoading(false);
    }
  };

  const fetchExistingData = async (email) => {
    try {
      const freshmenDocRef = doc(db, 'freshmen_stepfour_upload_documents', email);
      const transfereeDocRef = doc(db, 'transferee_stepfour_upload_documents', email);
      
      const freshmenDocSnap = await getDoc(freshmenDocRef);
      const transfereeDocSnap = await getDoc(transfereeDocRef);
      
      if (freshmenDocSnap.exists()) {
        const data = freshmenDocSnap.data();
        if (data.file_urls_fetch && data.file_urls_fetch.length > 0) {
          setSelectedFiles(data.file_urls_fetch);
          setIsUploaded(true);
          setUserType('freshmen');
        }
      } else if (transfereeDocSnap.exists()) {
        const data = transfereeDocSnap.data();
        if (data.file_urls_fetch && data.file_urls_fetch.length > 0) {
          setSelectedFiles(data.file_urls_fetch);
          setIsUploaded(true);
          setUserType('transferee');
        }
      }
    } catch (error) {
      console.error('Error fetching existing data:', error);
    }
  };

  const handleFileSelect = async () => {
    if (!isUploadEnabled) {
      Alert.alert('Upload Disabled', 'You are not eligible to upload documents at this time.');
      return;
    }

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

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      Alert.alert('Missing Files', 'Please select at least one file to upload.');
      return;
    }

    try {
      setIsLoading(true);
      setIsUploading(true);
      // Delete existing files
      const storageRef = ref(storage, `uploads/${userType}_stepfour_upload_documents/${userEmail}`);
      const existingFiles = await listAll(storageRef);
      await Promise.all(existingFiles.items.map(fileRef => deleteObject(fileRef)));

      // Upload new files
      const uploadedFiles = await Promise.all(selectedFiles.map(uploadFile));

      const applicantData = {
        files_count: selectedFiles.length,
        file_urls: uploadedFiles.map(file => file.downloadUrl),
        file_urls_fetch: uploadedFiles.map(file => ({
          uri: file.uri,
          type: file.type,
          name: file.name
        })),
      };

      await setDoc(doc(db, `${userType}_stepfour_upload_documents`, userEmail), applicantData, { merge: true });
      console.log('Documents uploaded successfully');
      setSuccessModalVisible(true);
      setIsLoading(false);
      setIsUploaded(true);
      setIsUploading(false);
    } catch (error) {
      console.error('Error uploading documents:', error);
      Alert.alert('Upload Failed', 'An error occurred while uploading the documents. Please try again.');
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setCancelModalVisible(true);
  };

  const confirmCancel = () => {
    setSelectedFiles([]);
    setIsUploaded(false);
    setCancelModalVisible(false);
  };

  const uploadFile = async (file) => {
    const response = await fetch(file.uri);
    const blob = await response.blob();
  
    const fileName = file.uri.split('/').pop();
    const fileExtension = fileName.split('.').pop();
  
    let mimeType = 'image/jpeg'; // default MIME type
    if (fileExtension === 'png') mimeType = 'image/png';
    else if (fileExtension === 'jpg') mimeType = 'image/jpeg';
    else if (fileExtension === 'jpeg') mimeType = 'image/jpeg';
  
    const storageRef = ref(storage, `uploads/${userType}_stepfour_upload_documents/${userEmail}/${fileName}`);
    
    const metadata = {
      contentType: mimeType,
    };
  
    await uploadBytes(storageRef, blob, metadata);
    const downloadUrl = await getDownloadURL(storageRef);
    return { uri: file.uri, name: fileName, type: mimeType, downloadUrl };
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const renderItem = ({ item }) => {
    if (item.type === 'header') {
      return (
        <LinearGradient
          colors={['#004b23', '#004b23']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.header}
        >
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Upload Documents</Text>
          </View>
        </LinearGradient>
      );
    } else if (item.type === 'content') {
      return (
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.titleContainer}>
              <Ionicons name="document-attach" size={28} color="#004b23" />
              <Text style={styles.cardTitle}>Required Documents</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.documentList}>
              {['Grade 12 SHS Report Card', 'Good Moral Certificate', 'PSA Birth Certificate', 'Testament of Qualification'].map((doc, index) => (
                <View key={index} style={styles.documentItem}>
                  <Ionicons name="document-text-outline" size={24} color="#004b23" />
                  <Text style={styles.documentText}>{doc}</Text>
                </View>
              ))}
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={24} color="#004b23" />
              <Text style={styles.infoText}>
                This is step four in the enrollment process. Please ensure all documents are clear and legible.
              </Text>
            </View>

            {!isUploadEnabled && (
              <View style={styles.warningBox}>
                <Ionicons name="alert-circle" size={24} color="#ff6b6b" />
                <Text style={styles.warningText}>
                  You are not eligible to upload documents at this time.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.uploadButton,
                (!isUploadEnabled || isUploaded || isUploading) && styles.disabledButton
              ]}
              onPress={handleFileSelect}
              disabled={!isUploadEnabled || isUploaded || isUploading}
            >
              <Ionicons name="cloud-upload-outline" size={24} color="white" />
              <Text style={styles.uploadButtonText}>
                {selectedFiles.length > 0 ? 'Add More Files' : 'Choose Files'}
              </Text>
            </TouchableOpacity>

            {selectedFiles.length > 0 && (
              <View style={styles.selectedFilesContainer}>
                <Text style={styles.selectedFilesTitle}>Selected Files</Text>
                <FlatList
                  data={selectedFiles}
                  renderItem={({ item, index }) => (
                    <View style={styles.fileItem}>
                      <Image source={{ uri: item.uri }} style={styles.filePreview} />
                      <View style={styles.fileDetails}>
                        <Text style={styles.fileName} numberOfLines={1}>
                          {item.name || item.uri.split('/').pop()}
                        </Text>
                        {!isUploading && !isUploaded && (
                          <TouchableOpacity 
                            onPress={() => handleRemoveFile(index)}
                            style={styles.removeFileButton}
                          >
                            <Ionicons name="close-circle" size={24} color="#ff6b6b" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                  keyExtractor={(item, index) => index.toString()}
                />

                {!isUploaded && (
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      !isFormValid && styles.disabledButton
                    ]}
                    onPress={handleUpload}
                    disabled={!isFormValid || isUploading}
                  >
                    {isUploading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={24} color="white" />
                        <Text style={styles.submitButtonText}>Submit Documents</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {isUploaded && (
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={handleCancel}
                  >
                    <Ionicons name="refresh-outline" size={24} color="white" />
                    <Text style={styles.cancelButtonText}>Start Over</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      );
    }
  };

  const data = [
    { type: 'header' },
    { type: 'content' },
  ];

  const isFormValid = selectedFiles.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.scrollContent}
        />

        <Modal
          animationType="fade"
          transparent={true}
          visible={cancelModalVisible}
          onRequestClose={() => setCancelModalVisible(false)}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>Are you sure you want to cancel the upload?</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonCancel]}
                  onPress={() => setCancelModalVisible(false)}
                >
                  <Text style={styles.textStyle}>No</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonConfirm]}
                  onPress={confirmCancel}
                >
                  <Text style={styles.textStyle}>Yes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          animationType="fade"
          transparent={true}
          visible={successModalVisible}
          onRequestClose={() => {}}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Success</Text>
              <Text style={styles.modalText}>Documents have been uploaded successfully.</Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setSuccessModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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
            onPress={() => navigation.navigate('ViewForm')}
          >
            <Ionicons name="document-text-outline" size={24} color="#004b23" />
            <Text style={styles.tabLabel}>View Form</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="cloud-upload" size={24} color="#004b23" />
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F0',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80,
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
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#004b23',
    marginLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 15,
  },
  documentList: {
    marginBottom: 20,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  documentText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e8f5e9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    color: '#004b23',
    fontSize: 14,
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#ffe5e5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  warningText: {
    flex: 1,
    marginLeft: 10,
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '500',
  },
  uploadButton: {
    backgroundColor: '#004b23',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  selectedFilesContainer: {
    marginTop: 20,
  },
  selectedFilesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#004b23',
    marginBottom: 15,
  },
  fileItem: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  filePreview: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 10,
  },
  fileDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginRight: 10,
  },
  removeFileButton: {
    padding: 5,
  },
  submitButton: {
    backgroundColor: '#004b23',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#ff6b6b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
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
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    minWidth: 100,
  },
  buttonCancel: {
    backgroundColor: "#2196F3",
  },
  buttonConfirm: {
    backgroundColor: "#FF6347",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center"
  },
  modalButton: {
    backgroundColor: '#004b23',
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    minWidth: 100,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default UploadDocuments;

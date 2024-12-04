import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, Image, Alert, ActivityIndicator, Modal, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { auth, db, storage } from '../firebase_config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';

const TransfereeCaptureImage = () => {
  const navigation = useNavigation();
  const [isPressed, setIsPressed] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email);
        fetchExistingImage(user.email);
      } else {
        navigation.navigate('Login');
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchExistingImage = async (email) => {
    try {
      const docRef = doc(db, 'transferee_applicant_form', email);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const capturedImageData = data.captured_image || {};
        if (capturedImageData.image_url) {
          setCapturedImage({
            uri: capturedImageData.image_url,
            type: capturedImageData.type,
            name: capturedImageData.name,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching existing image:', error);
      setCapturedImage(null);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission required', 'Sorry, we need camera permissions to make this work!');
        return;
      }

      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setCapturedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showAlert('Error', 'An error occurred while taking the photo.');
    }
  };

  const handleSubmit = async () => {
    if (!capturedImage) {
      showAlert('Missing Image', 'Please capture an image before submitting.');
      return;
    }
  
    setIsLoading(true);
    try {
      const storageRef = ref(storage, `uploads/transferee_captured_images/${userEmail}`);
  
      // Delete any existing files in the storage folder for this user
      const existingFiles = await listAll(storageRef);
      await Promise.all(existingFiles.items.map(fileRef => deleteObject(fileRef)));
  
      // Upload new file
      const response = await fetch(capturedImage.uri);
      const blob = await response.blob();
      const fileName = `profile_image_${new Date().toISOString()}.jpg`;
      const fileRef = ref(storage, `uploads/transferee_captured_images/${userEmail}/${fileName}`);
  
      const metadata = { contentType: 'image/jpeg' };
      await uploadBytes(fileRef, blob, metadata);
  
      // Fetch the download URL for the uploaded image
      const imageUrl = await getDownloadURL(fileRef);
  
      // Update the document in Firestore
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleString('en-US', { timeZone: 'Asia/Manila' });
  
      const applicantData = {
        captured_image: {
          image_url: imageUrl,
          uploaded_at: formattedDate,
          type: 'image/jpeg',
          name: fileName
        }
      };

      await setDoc(doc(db, 'transferee_applicant_form', userEmail), applicantData, { merge: true });
  
      // Update the capturedImage state with the URL of the uploaded image
      setCapturedImage({
        uri: imageUrl,
        type: 'image/jpeg',
        name: fileName,
      });
  
      showAlert('Success', 'Image has been uploaded successfully.');
    } catch (error) {
      console.error('Error uploading image:', error);
      showAlert('Upload Failed', 'An error occurred while uploading the image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const showAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const renderItem = ({ item }) => {
    if (item.key === 'content') {
      return (
        <View style={styles.formContainer}>
          <View style={styles.subHeader}>
            <Text style={styles.subHeaderText}>Capture Image</Text>
          </View>

          <Text style={styles.description}>
            This photo will be included in the data of your QR code. Please take a clear selfie in a well-lit area.
          </Text>

          <Text style={styles.importantNotice}>
            IMPORTANT: If you click the back button, lose connection, or close the app, you will need to retake the photo.
          </Text>

          <View style={styles.imageContainer}>
            {capturedImage ? (
              <Image source={{ uri: capturedImage.uri }} style={styles.capturedImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="person" size={100} color="#cccccc" />
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.cameraButton}
            onPress={handleTakePhoto}
          >
            <Text style={styles.cameraButtonText}>{capturedImage ? 'Retake Photo' : 'Take Photo'}</Text>
            <Ionicons name="camera" size={24} color="#FFFFFF" />
          </TouchableOpacity>
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
            style={[styles.submitButton, (!capturedImage || isLoading) && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={!capturedImage || isLoading}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
          >
            <LinearGradient
              colors={capturedImage ? (isPressed ? ['#003d1c', '#004b23'] : ['#004b23', '#003d1c']) : ['#cccccc', '#b3b3b3']}
              style={styles.gradient}
            >
              <Ionicons name="send" size={24} color="#FFFFFF" style={styles.submitIcon} />
              <Text style={styles.submitButtonText}>Submit</Text>
              {isLoading && <ActivityIndicator color="#FFFFFF" style={styles.loader} />}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={alertVisible}
        onRequestClose={() => {}}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{alertTitle}</Text>
            <Text style={styles.modalText}>{alertMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setAlertVisible(false);
                if (alertTitle === 'Success') {
                  navigation.navigate('Home');
                }
              }}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    width: 70,
    height: 70,
    marginRight: 10,
    marginTop: 20,
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
  description: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'justify',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  importantNotice: {
    fontSize: 14,
    color: '#FF0000',
    textAlign: 'justify',
    marginBottom: 15,
    fontWeight: 'bold',
    paddingHorizontal: 20,
  },
  imageContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  capturedImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    flexDirection: 'row',
    backgroundColor: '#004b23',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  cameraButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  submitButton: {
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
  submitIcon: {
    marginRight: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  loader: {
    marginLeft: 10,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#228B22',
    borderRadius: 10,
    padding: 10,
    elevation: 2,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default TransfereeCaptureImage;

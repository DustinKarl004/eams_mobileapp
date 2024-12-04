import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, Alert, Animated, Easing, Image, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, FlatList, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, AntDesign, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { auth, db, storage } from './firebase_config';
import { doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';

const ProfileScreen = ({ navigation }) => {
  const [userEmail, setUserEmail] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [applicantInfo, setApplicantInfo] = useState(null);
  const [removeImageModalVisible, setRemoveImageModalVisible] = useState(false);
  const [addressInfo, setAddressInfo] = useState(null);
  const [isRemovingImage, setIsRemovingImage] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email);
        fetchUserData(user.email);
      } else {
        navigation.navigate('Login');
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserData = async (email) => {
    try {
      const freshmenApplicantDocRef = doc(db, 'freshmen_applicant_form', email);
      const freshmenApplicantDocSnap = await getDoc(freshmenApplicantDocRef);
      
      const transfereeApplicantDocRef = doc(db, 'transferee_applicant_form', email);
      const transfereeApplicantDocSnap = await getDoc(transfereeApplicantDocRef);

      if (freshmenApplicantDocSnap.exists()) {
        const freshmenData = freshmenApplicantDocSnap.data();
        const applicantData = freshmenData.applicant_info;
        setApplicantInfo({
          ...applicantData,
          suffix: applicantData.suffix || ''
        });
        setAddressInfo(freshmenData.address_and_cn);
      } else if (transfereeApplicantDocSnap.exists()) {
        const transfereeData = transfereeApplicantDocSnap.data();
        const applicantData = transfereeData.applicant_info;
        setApplicantInfo({
          ...applicantData,
          suffix: applicantData.suffix || ''
        });
        setAddressInfo(transfereeData.address_and_cn);
      }

      const profilePictureDocRef = doc(db, 'profile_pictures', email);
      const profilePictureDocSnap = await getDoc(profilePictureDocRef);
      if (profilePictureDocSnap.exists()) {
        const profilePictureData = profilePictureDocSnap.data();
        if (profilePictureData.profilePicture) {
          setProfileImage(profilePictureData.profilePicture);
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setIsLoading(false);
    }
  };

  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setIsLoading(true);
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'An error occurred while selecting the image.');
    }
  };

  const uploadProfilePicture = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      if (profileImage) {
        const oldImageRef = ref(storage, profileImage);
        await deleteObject(oldImageRef);
      }
      
      const fileRef = ref(storage, `profile_pictures/${userEmail}/${Date.now()}`);
      
      await uploadBytes(fileRef, blob);
      const downloadURL = await getDownloadURL(fileRef);

      await setDoc(doc(collection(db, 'profile_pictures'), userEmail), { profilePicture: downloadURL });
      
      setProfileImage(downloadURL);
      setIsLoading(false);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      Alert.alert('Upload Failed', 'An error occurred while uploading the profile picture. Please try again.');
      setIsLoading(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      setIsRemovingImage(true);
      if (profileImage) {
        const imageRef = ref(storage, profileImage);
        await deleteObject(imageRef);
      }
      
      await setDoc(doc(collection(db, 'profile_pictures'), userEmail), { profilePicture: null });
      
      setProfileImage(null);
      setIsRemovingImage(false);
      setRemoveImageModalVisible(false);
    } catch (error) {
      console.error('Error removing profile picture:', error);
      Alert.alert('Remove Failed', 'An error occurred while removing the profile picture. Please try again.');
      setIsRemovingImage(false);
      setRemoveImageModalVisible(false);
    }
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
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
        </LinearGradient>
      );
    } else if (item.type === 'content') {
      return (
        <ScrollView style={styles.content}>
          <View style={styles.profileCard}>
            <View style={styles.profileImageWrapper}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="person" size={80} color="#004b23" />
                </View>
              )}
              <TouchableOpacity 
                style={styles.editButton} 
                onPress={profileImage ? () => setRemoveImageModalVisible(true) : handleImagePick}
              >
                <MaterialCommunityIcons 
                  name={profileImage ? "delete" : "camera"} 
                  size={24} 
                  color="#004b23" 
                />
              </TouchableOpacity>
            </View>

            {applicantInfo && (
              <Text style={styles.userName}>
                {`${applicantInfo.first_name} ${applicantInfo.middle_name || ''} ${applicantInfo.last_name}${applicantInfo.suffix ? ' ' + applicantInfo.suffix : ''}`}
              </Text>
            )}
            
            <Text style={styles.userEmail}>{userEmail}</Text>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            {applicantInfo && (
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <FontAwesome5 name="venus-mars" size={20} color="#004b23" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Sex</Text>
                    <Text style={styles.infoText}>{applicantInfo.sex}</Text>
                  </View>
                </View>

                <View style={styles.infoItem}>
                  <FontAwesome5 name="birthday-cake" size={20} color="#004b23" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Date of Birth</Text>
                    <Text style={styles.infoText}>{applicantInfo.dob}</Text>
                  </View>
                </View>

                <View style={styles.infoItem}>
                  <FontAwesome5 name="map-marker-alt" size={20} color="#004b23" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Place of Birth</Text>
                    <Text style={styles.infoText}>{applicantInfo.place_of_birth}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {addressInfo && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <FontAwesome5 name="home" size={20} color="#004b23" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Address</Text>
                    <Text style={styles.infoText}>
                      {`${addressInfo.address_line_1}${addressInfo.address_line_2 ? ', ' + addressInfo.address_line_2 : ''}, ${addressInfo.barangay}, ${addressInfo.municipality}, ${addressInfo.province}`}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoItem}>
                  <FontAwesome5 name="phone" size={20} color="#004b23" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Contact Number</Text>
                    <Text style={styles.infoText}>{addressInfo.contact_number}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      );
    }
  };

  const data = [
    { type: 'header' },
    { type: 'content' },
  ];

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
          visible={removeImageModalVisible}
          onRequestClose={() => setRemoveImageModalVisible(false)}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>Are you sure you want to remove your profile picture?</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonCancel]}
                  onPress={() => setRemoveImageModalVisible(false)}
                >
                  <Text style={styles.textStyle}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonConfirm]}
                  onPress={handleRemoveImage}
                >
                  <Text style={styles.textStyle}>Confirm</Text>
                </TouchableOpacity>
              </View>
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

          <TouchableOpacity 
            style={styles.tabItem} 
            onPress={() => navigation.navigate('UploadDocuments')}
          >
            <Ionicons name="cloud-upload-outline" size={24} color="#004b23" />
            <Text style={styles.tabLabel}>Upload</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.tabItem} 
          >
            <Ionicons name="person" size={24} color="#004b23" />
            <Text style={styles.tabLabel}>Profile</Text>
          </TouchableOpacity>
        </View>

        {(isLoading || isRemovingImage) && (
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
    backgroundColor: '#F0F4F0',
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
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  profileImageWrapper: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#004b23',
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#004b23',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: '#004b23',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#004b23',
    textAlign: 'center',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#004b23',
    marginBottom: 15,
  },
  infoGrid: {
    gap: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  infoTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 16,
    color: '#004b23',
    fontWeight: '500',
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
});

export default ProfileScreen;

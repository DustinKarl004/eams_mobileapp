import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal, Alert, Animated, Easing, SafeAreaView, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from './firebase_config';
import { doc, getDoc } from 'firebase/firestore';

const HomeScreen = ({ navigation }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [canProceed, setCanProceed] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnimation = useRef(new Animated.Value(-300)).current;
  const [userEmail, setUserEmail] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);

  const slides = [
    { image: require('./Picture/cdm_logo.png'), text: 'Welcome to Colegio De Montalban' },
    { image: require('./Picture/Model 2.png'), text: 'Join Our Community' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }), 
    ]).start();
  }, [currentSlide]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email);
        fetchProfileImage(user.email);
        fetchNotifications(user.email);
      }
    });

    // Set up notification and profile refresh interval
    const refreshInterval = setInterval(() => {
      if (auth.currentUser) {
        fetchNotifications(auth.currentUser.email);
        fetchProfileImage(auth.currentUser.email);
      }
    }, 5000); // Refresh every 5 seconds

    return () => {
      unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const fetchNotifications = async (email) => {
    try {
      const notificationRef = doc(db, 'Notifications', email);
      const notificationSnap = await getDoc(notificationRef);
      
      if (notificationSnap.exists()) {
        const notifications = notificationSnap.data().list || [];
        const unreadCount = notifications.filter(notification => notification.status === 'unread').length;
        setNotificationCount(unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchProfileImage = async (email) => {
    try {
      const profilePictureDocRef = doc(db, 'profile_pictures', email);
      const profilePictureDocSnap = await getDoc(profilePictureDocRef);
      if (profilePictureDocSnap.exists()) {
        const profilePictureData = profilePictureDocSnap.data();
        if (profilePictureData.profilePicture) {
          setProfileImage(profilePictureData.profilePicture);
        }
      }
    } catch (error) {
      console.error('Error fetching profile image:', error);
    }
  };

  const toggleMenu = () => {
    if (menuVisible) {
      Animated.timing(slideAnimation, {
        toValue: -300,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start(() => setMenuVisible(false));
    } else {
      setMenuVisible(true);
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleMenuItemPress = (screenName) => {
    toggleMenu();
    if (screenName === 'Help') {
      navigation.navigate('HelpScreen');
    }
    else if (screenName === 'Change Password') {
      navigation.navigate('ChangePassword');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Logout", 
          onPress: () => {
            auth.signOut().then(() => {
              navigation.navigate('Login');
            }).catch((error) => {
              console.error('Error:', error);
              Alert.alert("Error", "An error occurred while logging out.");
            });
          },
          style: "destructive"
        }
      ],
      { cancelable: false }
    );
  };

  const handleFreshmenPress = () => {
    if (canProceed) {
      navigation.navigate('FreshmenScreen');
    }
  };

  const handleTransfereePress = () => {
    if (canProceed) {
      navigation.navigate('TransfereeScreen');
    }
  };

  const menuItems = [
    { 
      name: 'Help', 
      icon: 'help-circle',
      color: '#4CAF50',
      description: 'Get assistance and support'
    },
    { 
      name: 'Change Password', 
      icon: 'key',
      color: '#2196F3',
      description: 'Update your account security'
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#004b23', '#004b23']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.header}
      >
        <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
          <Ionicons name="menu" size={28} color="white" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Colegio De Montalban</Text>
        </View>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => navigation.navigate('NotificationScreen')}
        >
          <View>
            <Ionicons name="notifications" size={24} color="white" />
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </LinearGradient>

      <Modal
        animationType="none"
        transparent={true}
        visible={menuVisible}
        onRequestClose={toggleMenu}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPressOut={toggleMenu}
        >
          <Animated.View 
            style={[
              styles.menuModal,
              {
                transform: [{ translateX: slideAnimation }],
              },
            ]}
          >
            <LinearGradient
              colors={['#004b23', '#006400']}
              style={styles.menuHeader}
            >
              <View style={styles.userInfo}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.userAvatar}>
                    <Ionicons name="person" size={40} color="#004b23" />
                  </View>
                )}
                <Text style={styles.userName}>Welcome!</Text>
                <Text style={styles.userEmail}>{userEmail}</Text>
              </View>
            </LinearGradient>
            
            <ScrollView style={styles.menuItemsContainer}>
              {menuItems.map((item, index) => (
                <TouchableOpacity 
                  key={index}
                  style={[styles.menuItem, { borderLeftColor: item.color, borderLeftWidth: 4 }]} 
                  onPress={() => handleMenuItemPress(item.name)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
                    <Ionicons name={item.icon} size={24} color={item.color} />
                  </View>
                  <View style={styles.menuItemContent}>
                    <Text style={styles.menuItemText}>{item.name}</Text>
                    <Text style={styles.menuItemDescription}>{item.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={handleLogout}
            >
              <LinearGradient
                colors={['#FF6347', '#FF7F50']}
                style={styles.logoutGradient}
              >
                <Ionicons name="log-out" size={24} color="#FFF" />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      <ScrollView>
        <View style={styles.content}>
          <View style={styles.carouselContainer}>
            <Animated.View style={[styles.slide, { opacity: fadeAnim }]}>
              <Image source={slides[currentSlide].image} style={styles.carouselImage} />
              <Text style={styles.carouselText}>
                {slides[currentSlide].text}
              </Text>
            </Animated.View>
          </View>

          <View style={styles.requirementsCard}>
            <Text style={styles.cardTitle}>ADMISSION REQUIREMENTS</Text>
            
            <View style={styles.requirementsSection}>
              <Text style={styles.sectionTitle}>For First-Year Students:</Text>
              <View style={styles.requirementsList}>
                <Text style={styles.requirementItem}>• Grade 12 SHS Report Card</Text>
                <Text style={styles.requirementItem}>• Good Moral Certificate (Original and Photocopy)</Text>
                <Text style={styles.requirementItem}>• PSA Birth Certificate (Photocopy)</Text>
                <Text style={styles.requirementItem}>• Testament of Qualification (Photocopy)</Text>
                <Text style={styles.requirementItem}>• 2x2 Recent Pictures (2 copies) (White Background)</Text>
              </View>
            </View>

            <View style={styles.requirementsSection}>
              <Text style={styles.sectionTitle}>Additional for Transferees:</Text>
              <View style={styles.requirementsList}>
                <Text style={styles.requirementItem}>• Honorable Dismissal or Transfere Credit (Orginal and Photocopy)</Text>
                <Text style={styles.requirementItem}>• Transcript of Records (Original and Photocopy)</Text>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.applicationButton, styles.freshmenButton]}
                onPress={handleFreshmenPress}
                disabled={!canProceed}
              >
                <LinearGradient
                  colors={['#004b23', '#006400']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Freshmen Application</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.applicationButton, styles.transfereeButton]}
                onPress={handleTransfereePress}
                disabled={!canProceed}
              >
                <LinearGradient
                  colors={['#1976D2', '#2196F3']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Transferee Application</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.notificationCard}>
            <View style={styles.notificationHeader}>
              <Ionicons name="notifications" size={24} color="#FF9800" />
              <Text style={styles.notificationTitle}>Important Updates</Text>
              {notificationCount > 0 && (
                <View style={styles.notificationCountBadge}>
                  <Text style={styles.notificationCountText}>{notificationCount}</Text>
                </View>
              )}
            </View>
            <View style={styles.notificationList}>
              <Text style={styles.notificationItem}>• Application Status Updates</Text>
              <Text style={styles.notificationItem}>• Entrance Exam Schedule</Text>
              <Text style={styles.notificationItem}>• Exam Results</Text>
              <Text style={styles.notificationItem}>• Enrollment Status</Text>
              <Text style={styles.notificationItem}>• Requirements Completion</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={styles.tabItem} 
        >
          <Ionicons name="home" size={24} color="#004b23" />
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
          onPress={() => navigation.navigate('ProfileScreen')}
        >
          <Ionicons name="person-outline" size={24} color="#004b23" />
          <Text style={styles.tabLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
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
  menuButton: {
    padding: 8,
  },
  notificationButton: {
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    right: -5,
    top: -5,
    backgroundColor: '#FF0000',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notificationCountBadge: {
    backgroundColor: '#FF0000',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  notificationCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 300,
    height: '100%',
    backgroundColor: 'white',
    elevation: 5,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  menuHeader: {
    padding: 20,
    borderTopRightRadius: 20,
  },
  userInfo: {
    alignItems: 'center',
    marginVertical: 10,
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 3,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  menuItemsContainer: {
    flex: 1,
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 1,
    borderRadius: 8,
    marginHorizontal: 10,
    marginVertical: 5,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  menuItemDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  logoutButton: {
    margin: 16,
    borderRadius: 25,
    overflow: 'hidden',
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  logoutButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  content: {
    padding: 16,
  },
  carouselContainer: {
    height: 300,
    backgroundColor: '#004b23',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 4,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  carouselImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  carouselText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  requirementsCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#004b23',
    textAlign: 'center',
    marginBottom: 20,
  },
  requirementsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 10,
  },
  requirementsList: {
    marginLeft: 10,
  },
  requirementItem: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 8,
  },
  buttonContainer: {
    marginTop: 20,
  },
  applicationButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 15,
  },
  buttonGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9800',
    marginLeft: 10,
  },
  notificationList: {
    marginLeft: 10,
  },
  notificationItem: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 8,
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
});

export default HomeScreen;
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Platform, ActivityIndicator, Linking, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from './firebase_config';
import { collection, query, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email);
        setUserId(user.uid);
      } else {
        navigation.navigate('Login');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (userEmail) {
        try {
          const notificationRef = doc(db, 'Notifications', userEmail);
          const notificationSnap = await getDoc(notificationRef);

          if (notificationSnap.exists()) {
            const notificationData = notificationSnap.data();
            // Remove duplicates keeping only latest
            const uniqueNotifications = notificationData.list.reduce((acc, current) => {
              const x = acc.find(item => item.category === current.category);
              if (!x) {
                return acc.concat([current]);
              } else if (new Date(current.timestamp) > new Date(x.timestamp)) {
                return acc.map(item => item.category === current.category ? current : item);
              }
              return acc;
            }, []);
            
            // Sort by timestamp
            const sortedNotifications = uniqueNotifications.sort((a, b) => 
              new Date(b.timestamp) - new Date(a.timestamp)
            );
            setNotifications(sortedNotifications);
          }
          
          setIsLoading(false);
        } catch (error) {
          console.error('Failed to fetch notifications:', error);
          setIsLoading(false);
        }
      }
    };

    fetchNotifications();
  }, [userEmail]);

  const handleMarkAllRead = async () => {
    if (userEmail) {
      try {
        const notificationRef = doc(db, 'Notifications', userEmail);
        const notificationSnap = await getDoc(notificationRef);

        if (notificationSnap.exists()) {
          const updatedList = notificationSnap.data().list.map(notification => ({
            ...notification,
            status: 'read'
          }));

          await setDoc(notificationRef, {
            list: updatedList
          });

          setNotifications(updatedList);
        }
      } catch (error) {
        console.error('Failed to mark notifications as read:', error);
      }
    }
  };

  const handleNotificationPress = async (notification, index) => {
    setSelectedNotification(notification);

    if (notification.category === 'Schedule') {
      setShowScheduleModal(true);
    } else if (notification.category === 'Results') {
      setShowResultsModal(true);
    } else if (notification.link) {
      Linking.openURL(notification.link);
    }

    if (notification.status === 'unread') {
      try {
        const notificationRef = doc(db, 'Notifications', userEmail);
        const notificationSnap = await getDoc(notificationRef);

        if (notificationSnap.exists()) {
          const updatedList = [...notifications];
          updatedList[index] = {
            ...notification,
            status: 'read'
          };

          await setDoc(notificationRef, {
            list: updatedList
          });

          setNotifications(updatedList);
        }
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
  };

  const ScheduleModal = () => (
    <Modal
      visible={showScheduleModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowScheduleModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.enhancedModal]}>
          <Text style={styles.modalTitle}>Examination Schedule</Text>
          
          <TouchableOpacity 
            style={[styles.modalButton, styles.enhancedButton]}
            onPress={() => {
              Linking.openURL('https://eas-client-web-app.vercel.app/client_freshmenexamSchedule.html');
              setShowScheduleModal(false);
            }}
          >
            <Ionicons name="calendar-outline" size={24} color="white" />
            <Text style={styles.modalButtonText}>Freshmen Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.modalButton, styles.enhancedButton]}
            onPress={() => {
              Linking.openURL('https://eas-client-web-app.vercel.app/client_transfereeexamSchedule.html');
              setShowScheduleModal(false);
            }}
          >
            <Ionicons name="calendar-outline" size={24} color="white" />
            <Text style={styles.modalButtonText}>Transferee Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.modalCloseButton, styles.enhancedCloseButton]}
            onPress={() => setShowScheduleModal(false)}
          >
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const ResultsModal = () => (
    <Modal
      visible={showResultsModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowResultsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.enhancedModal]}>
          <Text style={styles.modalTitle}>Examination Results</Text>
          
          <TouchableOpacity 
            style={[styles.modalButton, styles.enhancedButton]}
            onPress={() => {
              Linking.openURL('https://eas-client-web-app.vercel.app/client_freshmenresults.html');
              setShowResultsModal(false);
            }}
          >
            <Ionicons name="document-text-outline" size={24} color="white" />
            <Text style={styles.modalButtonText}>Freshmen Results</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.modalButton, styles.enhancedButton]}
            onPress={() => {
              Linking.openURL('https://eas-client-web-app.vercel.app/client_transfereeresults.html');
              setShowResultsModal(false);
            }}
          >
            <Ionicons name="document-text-outline" size={24} color="white" />
            <Text style={styles.modalButtonText}>Transferee Results</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.modalButton, styles.enhancedButton]}
            onPress={() => {
              Linking.openURL('https://eas-client-web-app.vercel.app/client_portal/login_portal.html');
              setShowResultsModal(false);
            }}
          >
            <Ionicons name="school-outline" size={24} color="white" />
            <Text style={styles.modalButtonText}>Student Portal</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.modalCloseButton, styles.enhancedCloseButton]}
            onPress={() => setShowResultsModal(false)}
          >
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#004b23', '#004b23']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.header}
      >
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
      </LinearGradient>

      <View style={styles.markAllContainer}>
        <TouchableOpacity 
          style={styles.markAllButton}
          onPress={handleMarkAllRead}
        >
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#004b23" style={styles.loader} />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={50} color="#999" />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        ) : (
          notifications.map((notification, index) => (
            <TouchableOpacity 
              key={index}
              style={[
                styles.notificationItem,
                notification.status === 'unread' && styles.unreadNotification
              ]}
              onPress={() => handleNotificationPress(notification, index)}
            >
              <View style={styles.notificationIcon}>
                <Ionicons 
                  name={notification.status === 'unread' ? "notifications" : "notifications-outline"} 
                  size={24} 
                  color={notification.status === 'unread' ? "#004b23" : "#666"} 
                />
              </View>
              <View style={styles.notificationContent}>
                <Text style={[
                  styles.notificationCategory,
                  notification.status === 'unread' && styles.unreadText
                ]}>
                  {notification.category}
                </Text>
                <Text style={[
                  styles.notificationMessage,
                  notification.status === 'unread' && styles.unreadText
                ]}>
                  {notification.message}
                </Text>
                <Text style={styles.timestamp}>
                  {new Date(notification.timestamp).toLocaleDateString()}
                </Text>
              </View>
              {notification.status === 'unread' && (
                <View style={styles.unreadDot} />
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <ScheduleModal />
      <ResultsModal />

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
  markAllContainer: {
    padding: 10,
    alignItems: 'flex-end',
  },
  markAllButton: {
    padding: 8,
    borderRadius: 15,
    backgroundColor: '#004b23',
  },
  markAllText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 10,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: 'relative',
  },
  unreadNotification: {
    backgroundColor: '#E8F5E9',
  },
  notificationIcon: {
    marginRight: 15,
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    lineHeight: 20,
  },
  unreadText: {
    color: '#004b23',
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#004b23',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    width: '85%',
    alignItems: 'center',
  },
  enhancedModal: {
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#004b23',
    marginBottom: 25,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#004b23',
    padding: 15,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enhancedButton: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  modalCloseButton: {
    marginTop: 10,
    padding: 12,
    width: '100%',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  enhancedCloseButton: {
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  modalCloseText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loader: {
    marginBottom: 10,
  },
  loadingText: {
    fontSize: 16,
    color: '#004b23',
  },
});

export default NotificationScreen;

import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View, ScrollView, SafeAreaView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

const HelpScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#004b23', '#004b23']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.header}
      >
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Help Center</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.helpContainer}>
          <View style={styles.helpSection}>
            <View style={styles.helpTitleContainer}>
              <FontAwesome5 name="graduation-cap" size={24} color="#004b23" style={styles.helpIcon} />
              <Text style={styles.helpTitle}>Admission Guide</Text>
            </View>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.helpText}>Upload clear and complete required documents</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.helpText}>Verify personal information accuracy</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.helpText}>Submit before application deadline</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.helpText}>Contact admissions for specific questions</Text>
              </View>
            </View>
          </View>

          <View style={styles.helpSection}>
            <View style={styles.helpTitleContainer}>
              <FontAwesome5 name="info-circle" size={24} color="#004b23" style={styles.helpIcon} />
              <Text style={styles.helpTitle}>About CDM App</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.helpText}>
                The CDM Admission App simplifies your application process by providing:
              </Text>
              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <FontAwesome5 name="file-upload" size={16} color="#004b23" />
                  <Text style={styles.featureText}>Easy document submission</Text>
                </View>
                <View style={styles.featureItem}>
                  <FontAwesome5 name="tasks" size={16} color="#004b23" />
                  <Text style={styles.featureText}>Real-time status tracking</Text>
                </View>
                <View style={styles.featureItem}>
                  <FontAwesome5 name="bell" size={16} color="#004b23" />
                  <Text style={styles.featureText}>Important notifications</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.helpSection}>
            <View style={styles.helpTitleContainer}>
              <FontAwesome5 name="exclamation-circle" size={24} color="#004b23" style={styles.helpIcon} />
              <Text style={styles.helpTitle}>Important Notice</Text>
            </View>
            <View style={styles.noticeCard}>
              <Text style={styles.noticeText}>
                For security purposes:
              </Text>
              <View style={styles.noticeBullets}>
                <View style={styles.noticeBulletItem}>
                  <FontAwesome5 name="circle" size={8} color="#004b23" solid />
                  <Text style={styles.noticeItemText}>Auto-logout occurs when closing the app</Text>
                </View>
                <View style={styles.noticeBulletItem}>
                  <FontAwesome5 name="circle" size={8} color="#004b23" solid />
                  <Text style={styles.noticeItemText}>Back button press triggers logout</Text>
                </View>
              </View>
            </View>
          </View>
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
  content: {
    flex: 1,
    padding: 16,
  },
  helpContainer: {
    marginBottom: 20,
  },
  helpSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  helpTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF4',
    paddingBottom: 12,
  },
  helpIcon: {
    marginRight: 12,
  },
  helpTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#004b23',
  },
  bulletList: {
    marginTop: 12,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#004b23',
    marginRight: 12,
  },
  helpText: {
    fontSize: 15,
    color: '#4A5568',
    lineHeight: 22,
  },
  cardContent: {
    padding: 4,
  },
  featureList: {
    marginTop: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  featureText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#4A5568',
  },
  noticeCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  noticeText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2D3748',
    marginBottom: 12,
  },
  noticeBullets: {
    marginTop: 8,
  },
  noticeBulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    paddingLeft: 4,
  },
  noticeItemText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#4A5568',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#E8ECF4',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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

export default HelpScreen;

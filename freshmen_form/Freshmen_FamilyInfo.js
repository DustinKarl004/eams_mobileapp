import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, SafeAreaView, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../firebase_config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const FreshmenFamilyInformation = () => {
  const navigation = useNavigation();
  const [householdMembers, setHouseholdMembers] = useState('');
  const [familyMembers, setFamilyMembers] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [isPressed, setIsPressed] = useState(false);
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
        const familyData = data.family_info || {};
        setHouseholdMembers(familyData.household_member_count || '');
        setFamilyMembers(familyData.family_members || []);
      }
    } catch (error) {
      console.error('Error fetching existing data:', error);
    }
  };

  useEffect(() => {
    if (householdMembers !== '') {
      const count = parseInt(householdMembers);
      if (!isNaN(count)) {
        const newFamilyMembers = Array(count).fill().map((_, index) => ({
          id: index + 1,
          lastName: '',
          firstName: '',
          middleName: '',
          suffix: '',
          sex: '',
          civilStatus: '',
          relation: '',
          education: '',
          occupation: '',
        }));
        setFamilyMembers(newFamilyMembers);
      } else {
        setFamilyMembers([]);
      }
    } else {
      setFamilyMembers([]);
    }
  }, [householdMembers]);

  const updateFamilyMember = (index, field, value) => {
    setFamilyMembers(prevMembers => {
      const updatedMembers = [...prevMembers];
      if (updatedMembers[index]) {
        updatedMembers[index] = { ...updatedMembers[index], [field]: value };
      }
      return updatedMembers;
    });
  };

  const isFormValid = () => {
    return householdMembers !== '' && familyMembers.length > 0 && familyMembers.every(member => 
      member.lastName !== '' &&
      member.firstName !== '' &&
      member.middleName !== '' &&
      member.sex !== '' &&
      member.civilStatus !== '' &&
      member.relation !== '' &&
      member.education !== '' &&
      member.occupation !== ''
    );
  };

  const handleSubmit = async () => {
    if (familyMembers.length === 0) {
      alert('Please add family members before submitting.');
      return;
    }

    const applicantData = {
      family_info: {
        household_member_count: householdMembers,
        family_members: familyMembers,
      }
    };

    try {
      setIsLoading(true);
      await setDoc(doc(db, 'freshmen_applicant_form', userEmail), applicantData, { merge: true });
      console.log('Family information saved successfully');
      setIsLoading(false);
      navigation.navigate('FreshmenCourse');
    } catch (error) {
      console.error('Error saving family information:', error);
      alert('Failed to save family information. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <LinearGradient
          colors={['#004b23', '#003d1c']}
          style={styles.header}
        >
          <Image source={require('../Picture/cdm_logo.png')} style={styles.logo} />
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            <View style={styles.subHeader}>
              <Text style={styles.subHeaderText}>Family Information</Text>
            </View>

            {/* Number of Household Members Section */}
            <View style={styles.memberSection}>
              <InputField
                label="Number of Household Members"
                placeholder="Enter number of household members"
                value={householdMembers}
                onChangeText={setHouseholdMembers}
                keyboardType="numeric"
                icon="people-outline"
              />
              <Text style={styles.householdMembersInfo}>
                Please include only immediate family members (father, mother, brothers, and sisters) in the household count. 
                If you have a guardian, such as grandparents, uncles, or aunts, you may include them as well.
              </Text>
            </View>

            {/* Family Member Information Section */}
            {familyMembers.map((member, index) => (
              <View key={member.id} style={styles.memberSection}>
                <Text style={styles.memberHeaderText}>Family Member {member.id} Information</Text>
                <InputField
                  label="Last Name"
                  placeholder="Enter Last Name"
                  value={member.lastName}
                  onChangeText={(value) => updateFamilyMember(index, 'lastName', value)}
                  icon="person-outline"
                />
                <InputField
                  label="First Name"
                  placeholder="Enter First Name"
                  value={member.firstName}
                  onChangeText={(value) => updateFamilyMember(index, 'firstName', value)}
                  icon="person-outline"
                />
                <InputField
                  label="Middle Name"
                  placeholder="Enter Middle Name"
                  value={member.middleName}
                  onChangeText={(value) => updateFamilyMember(index, 'middleName', value)}
                  description="Type N/A if you do not have a middle name"
                  icon="person-outline"
                />
                <InputField
                  label="Suffix (Optional)"
                  placeholder="Enter Suffix (Optional)"
                  value={member.suffix}
                  onChangeText={(value) => updateFamilyMember(index, 'suffix', value)}
                  description="e.g. Jr., Sr., III (Leave blank if none)"
                  icon="person-outline"
                />
                <InputField
                  label="Sex"
                  placeholder="Enter Sex"
                  value={member.sex}
                  onChangeText={(value) => updateFamilyMember(index, 'sex', value)}
                  icon="male-female-outline"
                />
                <InputField
                  label="Civil Status"
                  placeholder="Enter Civil Status"
                  value={member.civilStatus}
                  onChangeText={(value) => updateFamilyMember(index, 'civilStatus', value)}
                  icon="heart-outline"
                />
                <InputField
                  label="Relation to Applicant"
                  placeholder="Enter Relation"
                  value={member.relation}
                  onChangeText={(value) => updateFamilyMember(index, 'relation', value)}
                  icon="people-outline"
                />
                <InputField
                  label="Highest Education Attainment"
                  placeholder="Enter Education"
                  value={member.education}
                  onChangeText={(value) => updateFamilyMember(index, 'education', value)}
                  icon="school-outline"
                />
                <InputField
                  label="Occupation"
                  placeholder="Enter Occupation"
                  value={member.occupation}
                  onChangeText={(value) => updateFamilyMember(index, 'occupation', value)}
                  icon="briefcase-outline"
                />
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.nextButton, !isFormValid() && styles.disabledButton]}
            onPress={handleSubmit}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            disabled={!isFormValid()}
          >
            <LinearGradient
              colors={isPressed ? ['#003d1c', '#004b23'] : ['#004b23', '#003d1c']}
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

// InputField Component
const InputField = ({ label, placeholder, value, onChangeText, keyboardType, maxLength, description, icon }) => (
  <View style={styles.inputBox}>
    <View style={styles.labelContainer}>
      <Ionicons name={icon} size={24} color="#004b23" style={styles.inputIcon} />
      <Text style={styles.inputLabel}>{label}{!label.includes('Optional') && <Text style={styles.requiredAsterisk}>*</Text>}</Text>
    </View>
    {description && <Text style={styles.inputDescription}>{description}</Text>}
    <TextInput
      style={styles.textInput}
      placeholder={placeholder}
      placeholderTextColor="#7A7A7A"
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      maxLength={maxLength}
    />
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
  memberSection: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  memberHeaderText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#004b23',
    marginBottom: 15,
  },
  inputBox: {
    marginBottom: 20,
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
  textInput: {
    borderWidth: 1,
    borderColor: '#004b23',
    borderRadius: 5,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: '#333333',
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
  householdMembersInfo: {
    fontSize: 14,
    color: '#666666',
    marginTop: 10,
    fontStyle: 'italic',
    textAlign: 'justify',
  },
});

export default FreshmenFamilyInformation;

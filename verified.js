import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity, Image, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import { signIn, db } from './firebase_config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

function VerifiedScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);

  const handleConfirmationCodeChange = (code) => {
    setConfirmationCode(code);
    setIsSubmitEnabled(code === '7b6e4');
  };

  const handleSubmit = async () => {
    setErrorMessage('');
    setIsLoading(true);
    try {
      const user = await signIn(email, password);
      
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        await updateDoc(userDocRef, {
          isVerified: true
        });
        navigation.navigate('Login');
        setEmail('');
        setPassword('');
        setConfirmationCode('');
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      let errorMessage = 'Verification failed. Please try again.';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'The email address is not valid.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No user found with this email.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'The password is incorrect.';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
  
      setErrorMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <Image
            source={require('./Picture/cdm_logo.png')}
            style={styles.logo}
          />
          <Text style={styles.title}>Verify Your Account</Text>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <View style={styles.inputContainer}>
            <FontAwesome name="envelope" size={20} color="#004b23" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#004b23"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <View style={styles.inputContainer}>
            <FontAwesome name="lock" size={20} color="#004b23" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#004b23"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={toggleShowPassword} style={styles.showPasswordIcon}>
              <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={24} color="#004b23" />
            </TouchableOpacity>
          </View>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={24} color="#004b23" style={styles.infoIcon} />
            <Text style={styles.explanationText}>
  Please check your Gmail inbox for the email verification message from noreply@easdb. 
          If you received a verification link that has expired or are unable to create an account due to already being registered, use the confirmation code found in the email address: 
  <Text style={{ fontWeight: 'bold' }}> noreply@easdb-HIDDEN_CODE</Text>.
            </Text>
          </View>
          <View style={styles.inputContainer}>
            <FontAwesome name="check-circle" size={20} color="#004b23" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirmation Code"
              placeholderTextColor="#004b23"
              value={confirmationCode}
              onChangeText={handleConfirmationCodeChange}
            />
          </View>
          <View style={styles.codeInstructionBox}>
            <MaterialIcons name="info" size={20} color="#004b23" style={styles.infoIcon} />
            <Text style={styles.codeInstructionText}>
              Enter only the last 5 characters: HIDDEN_CODE
            </Text>
          </View>
          <View style={styles.purposeBox}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#004b23" style={styles.purposeIcon} />
            <Text style={styles.purposeText}>
              This verification step ensures your account remains secure in case of 
              unexpected app closure or loss of internet connection during the registration process.
            </Text>
          </View>
          <TouchableOpacity onPress={handleSubmit} style={[styles.submitButton, !isSubmitEnabled && styles.submitButtonDisabled]} disabled={!isSubmitEnabled || isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Submit</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F0',
  },
  content: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginTop: 30,
    borderRadius: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 30,
    color: '#004b23',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    marginBottom: 15,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#004b23',
    fontSize: 16,
  },
  showPasswordIcon: {
    padding: 10,
  },
  submitButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#004b23',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F3E6',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  infoIcon: {
    marginRight: 10,
  },
  explanationText: {
    flex: 1,
    fontSize: 14,
    color: '#004b23',
  },
  codeInstructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  codeInstructionText: {
    flex: 1,
    fontSize: 14,
    color: '#004b23',
  },
  purposeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E6F3E6',
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },
  purposeIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  purposeText: {
    flex: 1,
    fontSize: 14,
    color: '#004b23',
  },
});

export default VerifiedScreen;
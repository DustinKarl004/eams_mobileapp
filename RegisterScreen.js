import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity, ScrollView, Image, Modal, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { app } from './firebase_config'; // Firebase config
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, fetchSignInMethodsForEmail } from "firebase/auth";
import { getFirestore, doc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";

const RegisterScreen = ({ navigation }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [registrationSuccessVisible, setRegistrationSuccessVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [timer, setTimer] = useState(120);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResendEnabled, setIsResendEnabled] = useState(false);
  const [isValidationAlert, setIsValidationAlert] = useState(false);

  const db = getFirestore(app); // Initialize Firestore
  const auth = getAuth(app); // Initialize Firebase Auth

  useEffect(() => {
    let interval;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerRunning(false);
      setIsResendEnabled(true);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  const showAlert = (title, message, isValidation = false) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setIsValidationAlert(isValidation);
    setAlertVisible(true);
  };

  const handleRegister = async () => {
    setIsLoading(true);
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!*()_\-,.?:;"'`~<>{}[\]\\|/]).{8,}$/;

    if (!firstName || !lastName || !middleName || !email || !password || !confirmPassword) {
      showAlert('Registration Failed', 'Please fill in all fields.', true);
    } else if (password !== confirmPassword) {
      showAlert('Registration Failed', 'Passwords do not match.', true);
    } else if (!email.includes('@gmail.com')) {
      showAlert('Registration Failed', 'Email must be a valid Gmail address.', true);
    } else if (!passwordRegex.test(password)) {
      showAlert('Registration Failed', 'Password must be at least 8 characters long, including a number, special character, and uppercase letter.', true);
    } else {
      try {
        // Check if the email is already in use
        const signInMethods = await fetchSignInMethodsForEmail(auth, email);
        if (signInMethods.length > 0) {
          showAlert('Registration Failed', 'Email is already in use. Please use a different email address or reset your password if you have an account.', true);
          setIsLoading(false);
          return;
        }

        // Check if the combined name already exists
        const usersRef = collection(db, "users");
        const q = query(usersRef, 
          where("firstName", "==", firstName),
          where("lastName", "==", lastName),
          where("middleName", "==", middleName)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          showAlert('Registration Failed', 'A user with this combination of first name, last name, and middle name already exists.', true);
          setIsLoading(false);
          return;
        }

        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Send verification email
        await sendEmailVerification(user);

        // Inform user to verify email
        setConfirmationVisible(true); // Show confirmation modal
        setTimer(30);
        setIsTimerRunning(true);
        setIsResendEnabled(false);

        // Add user information to Firestore
        await setDoc(doc(db, "users", user.uid), {
          firstName,
          lastName,
          middleName,
          email,
          isVerified: false,  // Initially set to false
        });

      } catch (error) {
        showAlert('Registration Failed', error.message, true);
      }
    }
    setIsLoading(false);
  };

  const handleConfirmationOk = async () => {
    setConfirmationVisible(false);

    // Inform the user that they need to check their email for verification
    showAlert('Required!', 'Please do not close the app until you have verified your account and received a registration successful message.');

    // Wait for user to check their email (you may want to set a timer here in a real-world scenario)
    setTimeout(async () => {
      const user = auth.currentUser;
      await user.reload(); // Reload the user to get updated verification status

      if (user.emailVerified) {
        // If email is verified, update isVerified to true in Firestore
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          isVerified: true
        });

        // Show registration success alert
        setRegistrationSuccessVisible(true);
      } else {
        // Email not verified
        setAlertVisible(true);
        setAlertTitle('Email Not Verified');
        setAlertMessage('30 seconds verification period has expired. Please resend the verification email.');
        setIsValidationAlert(false);
        setIsResendEnabled(true);
      }
    }, 30000); // 30 seconds delay to give user time to check email
  };

  const handleRegistrationSuccessOk = () => {
    setRegistrationSuccessVisible(false);
    navigation.navigate('Login');
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleResendVerification = async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      await sendEmailVerification(user);
      setConfirmationVisible(true);
      setTimer(30);
      setIsTimerRunning(true);
      setIsResendEnabled(false);
    } catch (error) {
      showAlert('Resend Failed', error.message, true);
    }
    setIsLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require('./Picture/cdm_logo.png')} style={styles.logo} />
      <Text style={styles.title}>Create Your Account</Text>
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionTitle}>Important Instructions:</Text>
        <Text style={styles.instructionText}>
          • Ensure you finish the process until you see "Registration Successful."{'\n'}
          • If you encounter any issues, return to the login page and select "Have an account but not verified?" to complete your registration.
        </Text>
      </View>

      <View style={styles.formContainer}>
        {/* Input Fields */}
        <View style={styles.inputContainer}>
          <MaterialIcons name="person" size={24} color="#004b23" style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="First Name" placeholderTextColor="#004b23" value={firstName} onChangeText={setFirstName} />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="person" size={24} color="#004b23" style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="Last Name" placeholderTextColor="#004b23" value={lastName} onChangeText={setLastName} />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="person" size={24} color="#004b23" style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="Middle Name" placeholderTextColor="#004b23" value={middleName} onChangeText={setMiddleName} />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="email" size={24} color="#004b23" style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#004b23" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={24} color="#004b23" style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#004b23" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
          <TouchableOpacity onPress={toggleShowPassword} style={styles.showPasswordIcon}>
            <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={24} color="#004b23" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={24} color="#004b23" style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor="#004b23" secureTextEntry={!showConfirmPassword} value={confirmPassword} onChangeText={setConfirmPassword} />
          <TouchableOpacity onPress={toggleShowConfirmPassword} style={styles.showPasswordIcon}>
            <MaterialIcons name={showConfirmPassword ? 'visibility' : 'visibility-off'} size={24} color="#004b23" />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.registerButtonText}>Register</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.registerButton, !isResendEnabled && styles.disabledButton]} 
        onPress={handleResendVerification} 
        disabled={!isResendEnabled || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.registerButtonText}>Resend Verification</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkContainer}>
        <Text style={styles.linkText}>Already Have an Account? Login</Text>
      </TouchableOpacity>

      {/* First Alert for Registration Issues */}
      <Modal animationType="fade" transparent={true} visible={alertVisible} onRequestClose={() => setAlertVisible(false)}>
        <View style={styles.centeredView}>
          <View style={[styles.modalView, isValidationAlert ? styles.validationModalView : styles.warningModalView]}>
            <MaterialIcons 
              name={isValidationAlert ? "error" : "warning"} 
              size={50} 
              color={isValidationAlert ? "#FFFFFF" : "#000000"} 
              style={styles.modalIcon}
            />
            <Text style={[styles.modalTitle, isValidationAlert ? styles.validationModalTitle : styles.warningModalTitle]}>{alertTitle}</Text>
            <Text style={[styles.modalText, isValidationAlert ? styles.validationModalText : styles.warningModalText]}>{alertMessage}</Text>
            <TouchableOpacity 
              style={[styles.modalButton, isValidationAlert ? styles.validationModalButton : styles.warningModalButton]} 
              onPress={() => setAlertVisible(false)}
            >
              <Text style={[styles.modalButtonText, isValidationAlert ? styles.validationModalButtonText : styles.warningModalButtonText]}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Second Alert for Email Confirmation */}
      <Modal animationType="fade" transparent={true} visible={confirmationVisible} onRequestClose={() => setConfirmationVisible(false)}>
        <View style={styles.centeredView}>
          <View style={[styles.modalView, styles.warningModalView]}>
            <MaterialIcons 
              name="warning" 
              size={50} 
              color="#000000" 
              style={styles.modalIcon}
            />
            <Text style={[styles.modalTitle, styles.warningModalTitle]}>Confirm and Verify</Text>
            <Text style={[styles.modalText, styles.warningModalText]}>Please check your email for a verification link. It is valid for 30 seconds.</Text>
            <Text style={[styles.timerText, styles.warningModalText]}>Time remaining: <Text style={styles.timerNumber}>{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</Text></Text>
            <TouchableOpacity style={[styles.modalButton, styles.warningModalButton]} onPress={handleConfirmationOk}>
              <Text style={styles.warningModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Third Alert for Successful Registration */}
      <Modal animationType="fade" transparent={true} visible={registrationSuccessVisible} onRequestClose={() => setRegistrationSuccessVisible(false)}>
        <View style={styles.centeredView}>
          <View style={[styles.modalView, styles.successModalView]}>
            <MaterialIcons 
              name="check-circle" 
              size={50} 
              color="#004b23" 
              style={styles.modalIcon}
            />
            <Text style={[styles.modalTitle, styles.successModalTitle]}>Registration Successful!</Text>
            <Text style={[styles.modalText, styles.successModalText]}>Your account has been successfully registered and verified. You may now log in.</Text>
            <TouchableOpacity style={[styles.modalButton, styles.successModalButton]} onPress={handleRegistrationSuccessOk}>
              <Text style={styles.successModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F0F4F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginTop: 30,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    marginBottom: 15,
    color: '#004b23',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  instructionContainer: {
    backgroundColor: '#E6F3E6',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#004b23',
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#004b23',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    color: '#004b23',
    lineHeight: 20,
  },
  formContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
    height: 50,
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
  registerButton: {
    backgroundColor: '#004b23',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    minWidth: 200,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkContainer: {
    marginBottom: 20,
  },
  linkText: {
    color: '#004b23',
    fontSize: 16,
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
    width: '80%',
  },
  validationModalView: {
    backgroundColor: '#FF3B30',
  },
  warningModalView: {
    backgroundColor: '#FFD700',
  },
  successModalView: {
    backgroundColor: '#E6F3E6',
  },
  modalIcon: {
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  validationModalTitle: {
    color: '#FFFFFF',
  },
  warningModalTitle: {
    color: '#000000',
  },
  successModalTitle: {
    color: '#004b23',
  },
  modalText: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  validationModalText: {
    color: '#FFFFFF',
  },
  warningModalText: {
    color: '#000000',
  },
  successModalText: {
    color: '#004b23',
  },
  modalButton: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    minWidth: 100,
    alignItems: 'center',
  },
  validationModalButton: {
    backgroundColor: '#FFFFFF',
  },
  warningModalButton: {
    backgroundColor: '#FFFFFF',
  },
  successModalButton: {
    backgroundColor: '#FFFFFF',
  },
  modalButtonText: {
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  validationModalButtonText: {
    color: '#FF3B30',
  },
  warningModalButtonText: {
    color: '#000000',
  },
  successModalButtonText: {
    color: '#000000',
  },
  timerText: {
    marginBottom: 15,
    fontSize: 16,
  },
  timerNumber: {
    color: 'red',
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
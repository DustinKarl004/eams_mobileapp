import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity, Image, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { signIn, db } from './firebase_config';
import { doc, getDoc } from 'firebase/firestore';

function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setErrorMessage(''); // Reset the error message
    setIsLoading(true); // Start loading
    try {
      const user = await signIn(email, password);
      
      // Check if the user is verified
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists() && userDocSnap.data().isVerified === true) {
        // Navigate to the Home screen if sign-in is successful and user is verified
        navigation.navigate('Home');
        setEmail('');
        setPassword('');
      } else {
        // If user is not verified, throw an error
        throw new Error('Account not verified');
      }
    } catch (error) {
      let errorMessage = 'Invalid email or password.';
      
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
          errorMessage = error.message === 'Account not verified' 
            ? 'This account is not verified.' 
            : (error.message || errorMessage);
      }
  
      setErrorMessage(errorMessage); // Display the error message
    } finally {
      setIsLoading(false); // Stop loading
    }
  };
  

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleNotVerified = () => {
    navigation.navigate('Verified');
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
          <Text style={styles.title}>Welcome to Colegio De Montalban</Text>


          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text> // Display the error message
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
          <TouchableOpacity onPress={handleLogin} style={styles.loginButton} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleForgotPassword} style={styles.linkContainer}>
            <Text style={styles.linkText}>Forgot Password?</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('VerifiedScreen')} style={styles.linkContainer}>
            <Text style={styles.linkText}>Have an account but not verified?</Text>
          </TouchableOpacity>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>
          <TouchableOpacity onPress={handleRegister} style={styles.registerButton}>
            <Text style={styles.registerButtonText}>Create New Account</Text>
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
    width: 120,
    height: 120,
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
  loginButton: {
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
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkContainer: {
    marginTop: 15,
  },
  linkText: {
    color: '#004b23',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#004b23',
  },
  dividerText: {
    width: 50,
    textAlign: 'center',
    color: '#004b23',
  },
  registerButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderColor: '#004b23',
    borderWidth: 2,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#004b23',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
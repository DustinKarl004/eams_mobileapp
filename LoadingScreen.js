import React from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const LoadingScreen = ({ loadingProgress }) => {
  return (
    <LinearGradient colors={['#004b23', '#004b23']} style={styles.container}>
      <StatusBar style="dark" backgroundColor="#F0F4F0" />
      <View style={styles.content}>
        <Image source={require('./Picture/cdm_logo.png')} style={styles.logo} />
        <Text style={styles.loadingText}>Loading... {Math.round(loadingProgress)}%</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${loadingProgress}%` }]} />
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    marginBottom: 20,
  },
  progressBarContainer: {
    width: '80%',
    height: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00ff00',
  },
});

export default LoadingScreen;
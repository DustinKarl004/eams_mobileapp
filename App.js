import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar'; // Importing StatusBar
// Importing screens (no changes)
import LoginScreen from './LoginScreen';
import LoadingScreen from './LoadingScreen';
import HomeScreen from './HomeScreen';
import NotificationScreen from './NotificationScreen';
import RegisterScreen from './RegisterScreen';
import FreshmenScreen from './FreshmenScreen';
import TransfereeScreen from './TransfereeScreen';
import FreshmenApplicantInformation from './freshmen_form/Freshmen_ApplicantInformation';
import FreshmenAddressAndCN from './freshmen_form/Freshmen_AddressAndCN';
import FreshmenProofofResidency from './freshmen_form/Freshmen_ProofofResidency';
import FreshmenOtherApplicantInfo from './freshmen_form/Freshmen_otherapplicantinfo';
import FreshmenSectorAndWorkStatus from './freshmen_form/Freshmen_sectorandworkstatus';
import FreshmenParentsInfo from './freshmen_form/Freshmen_parentsinfo';
import FreshmenIncomeAndBeneficiary from './freshmen_form/Freshmen_familyincome';
import FreshmenGuardianInfo from './freshmen_form/Freshmen_guardianinfo';
import FreshmenEducation from './freshmen_form/Freshmen_Education';
import FreshmenProofOfEligibility from './freshmen_form/Freshmen_proofofeligibility';
import FreshmenFamilyInformation from './freshmen_form/Freshmen_FamilyInfo';
import FreshmenCourse from './freshmen_form/Freshmen_course';
import FreshmenCaptureImage from './freshmen_form/Freshmen_CaptureImage';
import ProfileScreen from './ProfileScreen';
import UploadDocuments from './UploadDocuments';
import HelpScreen from './HelpScreen';
import ChangePassword from './ChangePassword';
import TransfereeApplicantInformation from './transferee_form/Transferee_ApplicantInformation';
import TransfereeAddressAndCN from './transferee_form/Transferee_AddressAndCN';
import TransfereeProofofResidency from './transferee_form/Transferee_ProofofResidency';
import TransfereeOtherApplicantInfo from './transferee_form/Transferee_otherapplicantinfo';
import TransfereeSectorAndWorkStatus from './transferee_form/Transferee_sectorandworkstatus';
import TransfereeParentsInfo from './transferee_form/Transferee_parentsinfo';
import TransfereeIncomeAndBeneficiary from './transferee_form/Transferee_familyincome';
import TransfereeGuardianInfo from './transferee_form/Transferee_guardianinfo';
import TransfereeEducation from './transferee_form/Transferee_Education';
import TransfereeProofOfEligibility from './transferee_form/Transferee_proofofeligibility';    
import TransfereeFamilyInformation from './transferee_form/Transferee_Familyinfo';
import TransfereeCourse from './transferee_form/Transferee_course';
import TransfereeCaptureImage from './transferee_form/Transferee_CaptureImage';
import VerifiedScreen from './verified';
import ForgotPassword from './ForgotPassword';
import ViewForm from './ViewForm';
import ViewApplicantInformation from './Form/Form_Applicant_Information';
import ViewAddressAndCN from './Form/Form_AddressAndCN';
import ViewProofofResidency from './Form/Form_ProofofResidency';
import ViewOtherApplicantInfo from './Form/Form_otherapplicantinfo';
import ViewSectorAndWorkStatus from './Form/Form_sector_and_status';
import ViewParentsInfo from './Form/Form_parentsinfo';
import ViewFamilyIncome from './Form/Form_familyincome';
import ViewGuardianInfo from './Form/Form_guardianinfo';
import ViewEducation from './Form/Form_education';
import ViewProofOfEligibility from './Form/Form_ProofOfEligibility';
import ViewFamilyInformation from './Form/Form_familyinfo';
import ViewCourse from './Form/Form_Course';
import ViewCaptureImage from './Form/Form_CaptureImage';
const Stack = createStackNavigator();

export default function App() {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setLoadingProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(timer);
          setIsLoading(false);
          return 100;
        }
        return prevProgress + 1;
      });
    }, 20);

    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen loadingProgress={loadingProgress} />;
  }

  return (
    <NavigationContainer>
      {/* Customize StatusBar */}
      <StatusBar style="dark" backgroundColor="#F0F4F0" />

      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="NotificationScreen" component={NotificationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="FreshmenScreen" component={FreshmenScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TransfereeScreen" component={TransfereeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="FreshmenApplicantInformation" component={FreshmenApplicantInformation} options={{ headerShown: false }} />
        <Stack.Screen name="FreshmenAddressAndCN" component={FreshmenAddressAndCN} options={{ headerShown: false }} />
        <Stack.Screen name="FreshmenProofofResidency" component={FreshmenProofofResidency} options={{ headerShown: false }} />
        <Stack.Screen name="FreshmenOtherApplicantInfo" component={FreshmenOtherApplicantInfo} options={{ headerShown: false }} />
        <Stack.Screen name="FreshmenSectorAndWorkStatus" component={FreshmenSectorAndWorkStatus} options={{ headerShown: false }} />
        <Stack.Screen name="FreshmenParentsInfo" component={FreshmenParentsInfo} options={{ headerShown: false }} />
        <Stack.Screen name="FreshmenIncomeAndBeneficiary" component={FreshmenIncomeAndBeneficiary} options={{ headerShown: false }} />
        <Stack.Screen name="FreshmenGuardianInfo" component={FreshmenGuardianInfo} options={{ headerShown: false }} />
        <Stack.Screen name="FreshmenEducation" component={FreshmenEducation} options={{ headerShown: false }} />
        <Stack.Screen name="FreshmenProofOfEligibility" component={FreshmenProofOfEligibility} options={{ headerShown: false }} />
        <Stack.Screen name="FreshmenFamilyInformation" component={FreshmenFamilyInformation} options={{ headerShown: false }} />
        <Stack.Screen name="FreshmenCourse" component={FreshmenCourse} options={{ headerShown: false }} />
        <Stack.Screen name="FreshmenCaptureImage" component={FreshmenCaptureImage} options={{ headerShown: false }} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="UploadDocuments" component={UploadDocuments} options={{ headerShown: false }} />
        <Stack.Screen name="HelpScreen" component={HelpScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ChangePassword" component={ChangePassword} options={{ headerShown: false }} />
        <Stack.Screen name="TransfereeApplicantInformation" component={TransfereeApplicantInformation} options={{ headerShown: false }} />
        <Stack.Screen name="TransfereeAddressAndCN" component={TransfereeAddressAndCN} options={{ headerShown: false }} />
        <Stack.Screen name="TransfereeProofofResidency" component={TransfereeProofofResidency} options={{ headerShown: false }} />
        <Stack.Screen name="TransfereeOtherApplicantInfo" component={TransfereeOtherApplicantInfo} options={{ headerShown: false }} />
        <Stack.Screen name="TransfereeSectorAndWorkStatus" component={TransfereeSectorAndWorkStatus} options={{ headerShown: false }} />
        <Stack.Screen name="TransfereeParentsInfo" component={TransfereeParentsInfo} options={{ headerShown: false }} />
        <Stack.Screen name="TransfereeIncomeAndBeneficiary" component={TransfereeIncomeAndBeneficiary} options={{ headerShown: false }} />
        <Stack.Screen name="TransfereeGuardianInfo" component={TransfereeGuardianInfo} options={{ headerShown: false }} />
        <Stack.Screen name="TransfereeEducation" component={TransfereeEducation} options={{ headerShown: false }} />
        <Stack.Screen name="TransfereeProofOfEligibility" component={TransfereeProofOfEligibility} options={{ headerShown: false }} />
        <Stack.Screen name="TransfereeFamilyInformation" component={TransfereeFamilyInformation} options={{ headerShown: false }} />
        <Stack.Screen name="TransfereeCourse" component={TransfereeCourse} options={{ headerShown: false }} />
        <Stack.Screen name="TransfereeCaptureImage" component={TransfereeCaptureImage} options={{ headerShown: false }} />
        <Stack.Screen name="VerifiedScreen" component={VerifiedScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ headerShown: false }} />
        <Stack.Screen name="ViewForm" component={ViewForm} options={{ headerShown: false }} />
        <Stack.Screen name="ViewApplicantInformation" component={ViewApplicantInformation} options={{ headerShown: false }} />
        <Stack.Screen name="ViewAddressAndCN" component={ViewAddressAndCN} options={{ headerShown: false }} />
        <Stack.Screen name="ViewProofofResidency" component={ViewProofofResidency} options={{ headerShown: false }} />
        <Stack.Screen name="ViewOtherApplicantInfo" component={ViewOtherApplicantInfo} options={{ headerShown: false }} />
        <Stack.Screen name="ViewSectorAndWorkStatus" component={ViewSectorAndWorkStatus} options={{ headerShown: false }} />
        <Stack.Screen name="ViewParentsInfo" component={ViewParentsInfo} options={{ headerShown: false }} />
        <Stack.Screen name="ViewFamilyIncome" component={ViewFamilyIncome} options={{ headerShown: false }} />
        <Stack.Screen name="ViewGuardianInfo" component={ViewGuardianInfo} options={{ headerShown: false }} />
        <Stack.Screen name="ViewEducation" component={ViewEducation} options={{ headerShown: false }} />
        <Stack.Screen name="ViewProofOfEligibility" component={ViewProofOfEligibility} options={{ headerShown: false }} />
        <Stack.Screen name="ViewFamilyInformation" component={ViewFamilyInformation} options={{ headerShown: false }} />
        <Stack.Screen name="ViewCourse" component={ViewCourse} options={{ headerShown: false }} />
        <Stack.Screen name="ViewCaptureImage" component={ViewCaptureImage} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

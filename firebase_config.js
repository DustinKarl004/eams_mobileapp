import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAgJzW4fLSxwRetmc6wrOMOfARqwskwAto",
  authDomain: "easdb-7b6e4.firebaseapp.com",
  projectId: "easdb-7b6e4",
  storageBucket: "easdb-7b6e4.appspot.com",
  messagingSenderId: "621986702779",
  appId: "1:621986702779:web:7926ff43e862bc69b5909e",
  measurementId: "G-F8GD1MC73Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Example function for adding data to Firestore
const addDataToFirestore = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), data);
    console.log("Document written with ID:", docRef.id);
  } catch (error) {
    console.error("Error adding document:", error.message);
  }
};

// Example function for fetching data from Firestore
const fetchDataFromFirestore = async (collectionName) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("Fetched data:", data);
    return data;
  } catch (error) {
    console.error("Error fetching documents:", error.message);
    return [];
  }
};

// Example function for signing in a user
const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Log only the user's email
    const { email: userEmail } = userCredential.user;
    console.log("User signed in with email:", userEmail);

    return userCredential.user; // Return user object for further use if needed
  } catch (error) {
    throw error; // Re-throw the error for handling elsewhere
  }
};

// Example to check authentication state
const checkAuthState = () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in
    } else {
      // No user is signed in
    }
  });
};

// Function for uploading files to Firebase Storage
const uploadFile = async (file, fileName) => {
  try {
    const storageRef = ref(storage, `uploads/${fileName}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    console.log("File available at", downloadURL);
    return downloadURL; // Return the file URL
  } catch (error) {
    console.error("Error uploading file:", error.message);
  }
};

// Exporting functions and variables
export { app, db, auth, storage, addDataToFirestore, fetchDataFromFirestore, signIn, checkAuthState, uploadFile };
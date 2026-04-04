import { createContext, useState, useEffect, useContext } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { auth } from "../config/firebase";
import API from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // MongoDB user (with role)
  const [fireUser, setFireUser] = useState(null); // Firebase user
  const [loading, setLoading] = useState(true);

  // Listen for Firebase auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setFireUser(firebaseUser);
        try {
          const { data } = await API.get(`/users/firebase/${firebaseUser.uid}`);
          setUser(data.user);
        } catch (err) {
          setUser(null);
        }
      } else {
        setFireUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // REGISTER — Admin self-registration
  const register = async (name, email, password, role) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });

    const { data } = await API.post("/users", {
      firebaseUid: cred.user.uid,
      name,
      email,
      role: role || "admin",
    });

    setUser(data.user);
    return data.user;
  };

  // LOGIN
  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const { data } = await API.get(`/users/firebase/${cred.user.uid}`);
    setUser(data.user);
    return data.user;
  };

  // ADD CLIENT — Admin creates client account
  const addClient = async (clientName, clientEmail, projectName, startDate) => {
    // Generate throwaway password
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!%&";
    let tempPassword = "Aa1@";
    for (let i = 0; i < 12; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Create Firebase account
    const cred = await createUserWithEmailAndPassword(auth, clientEmail, tempPassword);
    await updateProfile(cred.user, { displayName: clientName });

    // Send password reset email so client sets their own password
    await sendPasswordResetEmail(auth, clientEmail);

    // Save user to MongoDB
    const { data: userData } = await API.post("/users", {
      firebaseUid: cred.user.uid,
      name: clientName,
      email: clientEmail,
      role: "client",
    });

    // Create project in MongoDB
    const { data: projData } = await API.post("/projects", {
      clientId: userData.user._id,
      projectName,
      startDate,
    });

    // Sign back in as admin (creating a user signs you in as them)
    // The onAuthStateChanged listener will handle this
    return { user: userData.user, project: projData.project };
  };

  // LOGOUT
  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        fireUser,
        loading,
        register,
        login,
        logout,
        addClient,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

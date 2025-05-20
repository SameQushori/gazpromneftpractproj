import {
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";

export const createUserRecord = async (userId, email) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        email,
        createdAt: serverTimestamp(),
        downloadedCases: [],
        lastSubmittedWork: null,
        lastActivity: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error creating user record:", error);
  }
};

export const trackCaseDownload = async (userId, caseId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.error("User document does not exist");
      return;
    }

    await updateDoc(userRef, {
      downloadedCases: arrayUnion(caseId),
      lastActivity: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error tracking case download:", error);
  }
};

export const trackWorkSubmission = async (userId, caseId, githubUrl, caseTitle) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.error("User document does not exist");
      return;
    }

    await updateDoc(userRef, {
      lastSubmittedWork: {
        caseId,
        caseTitle,
        githubUrl,
        submittedAt: serverTimestamp(),
      },
      lastActivity: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error tracking work submission:", error);
  }
};

export const updateUserActivity = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.error("User document does not exist");
      return;
    }

    await updateDoc(userRef, {
      lastActivity: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating user activity:", error);
  }
};
 
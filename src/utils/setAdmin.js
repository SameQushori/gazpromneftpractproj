import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export const setUserAsAdmin = async (userId) => {
  try {
    // Проверяем существование пользователя
    const userDoc = await getDoc(doc(db, "users", userId));

    if (!userDoc.exists()) {
      // Если пользователь не существует, создаем документ
      await setDoc(doc(db, "users", userId), {
        isAdmin: true,
        createdAt: new Date().toISOString(),
      });
    } else {
      // Если пользователь существует, обновляем поле isAdmin
      await setDoc(
        doc(db, "users", userId),
        {
          ...userDoc.data(),
          isAdmin: true,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    return true;
  } catch (error) {
    console.error("Ошибка при установке админской роли:", error);
    return false;
  }
};

export const removeAdminRole = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));

    if (userDoc.exists()) {
      await setDoc(
        doc(db, "users", userId),
        {
          ...userDoc.data(),
          isAdmin: false,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      return true;
    }

    return false;
  } catch (error) {
    console.error("Ошибка при удалении админской роли:", error);
    return false;
  }
};

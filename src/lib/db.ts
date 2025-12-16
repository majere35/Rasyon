import { doc, setDoc, getDoc, collection, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import type { AppState } from '../types';

export const PRESETS = ['recipes', 'salesTargets', 'expenses', 'packagingCosts', 'company', 'daysWorkedInMonth', 'rawIngredients', 'ingredientCategories'];


export async function getUserData(uid: string): Promise<Partial<AppState> | null> {
    try {
        console.log(`[DB] Fetching data for user: ${uid}`);
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            console.log(`[DB] Data found for user: ${uid}`, docSnap.data());
            return docSnap.data() as Partial<AppState>;
        }
        console.log(`[DB] No data found for user: ${uid}`);
        return null;
    } catch (error) {
        console.error(`[DB] Error fetching user data:`, error);
        return null;
    }
}

export async function saveUserData(uid: string, data: Partial<AppState>) {
    try {
        const cleanData: any = {};
        PRESETS.forEach(key => {
            if ((data as any)[key] !== undefined) {
                cleanData[key] = (data as any)[key];
            }
        });

        console.log(`[DB] Saving data for user: ${uid}`, cleanData);
        const docRef = doc(db, 'users', uid);
        await setDoc(docRef, cleanData, { merge: true });
        console.log(`[DB] Data saved successfully.`);
    } catch (error) {
        console.error(`[DB] Error saving user data:`, error);
    }
}

export async function updateUserMetadata(user: any) {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
        email: user.email,
        lastActive: new Date().toISOString(),
        displayName: user.displayName || user.email?.split('@')[0],
        photoURL: user.photoURL,
        uid: user.uid
    }, { merge: true });
}

export function subscribeToSystemStats(callback: (stats: any) => void, onError?: (error: any) => void) {
    const usersRef = collection(db, 'users');

    return onSnapshot(usersRef, (snapshot) => {
        let totalUsers = 0;
        let activeSessionCount = 0;
        let totalDataSize = 0;
        let expensesCount = 0;
        let recipesCount = 0;

        const now = new Date();

        snapshot.forEach(doc => {
            totalUsers++;
            const data = doc.data();

            if (data.lastActive) {
                const lastActive = new Date(data.lastActive);
                const diffHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
                if (diffHours < 24) {
                    activeSessionCount++;
                }
            }

            totalDataSize += JSON.stringify(data).length;
            if (data.recipes) recipesCount += data.recipes.length;
            if (data.expenses) expensesCount += data.expenses.length;
        });

        callback({
            totalUsers,
            activeSessionCount,
            totalDataSize: (totalDataSize / 1024).toFixed(1) + ' KB',
            recipesCount,
            expensesCount
        });
    }, (error) => {
        console.error("Stats subscription error:", error);
        if (onError) onError(error);
    });
}

export function subscribeToUsers(callback: (users: any[]) => void, onError?: (error: any) => void) {
    const usersRef = collection(db, 'users');

    return onSnapshot(usersRef, (snapshot) => {
        const users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as any[];

        console.log("Debug: Real-time users fetched:", users.length);

        // Sort by lastActive desc
        users.sort((a, b) => new Date(b.lastActive || 0).getTime() - new Date(a.lastActive || 0).getTime());

        callback(users);
    }, (error) => {
        console.error("Users subscription error:", error);
        if (onError) onError(error);
    });
}

export async function getAllUsers() {
    try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        console.log("getAllUsers: Fetched", snapshot.size, "users.");

        const users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as any[];

        return users.sort((a, b) => new Date(b.lastActive || 0).getTime() - new Date(a.lastActive || 0).getTime());
    } catch (error) {
        console.error("Error fetching all users:", error);
        throw error;
    }
}


// End of file


import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { AppState } from '../types';

export const PRESETS = ['recipes', 'salesTargets', 'expenses', 'packagingCosts', 'company', 'daysWorkedInMonth'];

export async function getUserData(uid: string): Promise<Partial<AppState> | null> {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as Partial<AppState>;
    }
    return null;
}

export async function saveUserData(uid: string, data: Partial<AppState>) {
    const cleanData: any = {};
    PRESETS.forEach(key => {
        if ((data as any)[key] !== undefined) {
            cleanData[key] = (data as any)[key];
        }
    });

    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, cleanData, { merge: true });
}

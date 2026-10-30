import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDocFromServer, 
  collection, 
  getDocs, 
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import type { WorkOrder, Asset } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore with the exact provisioned database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connectivity test
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is currently offline or unreachable.');
    }
    return false;
  }
}

// Collection names
export const WORK_ORDERS_COLLECTION = 'work_orders';
export const ASSETS_COLLECTION = 'assets';

/**
 * บันทึกใบแจ้งซ่อมใหม่หรืออัปเดตลง Firebase Firestore อัตโนมัติ (ข้ามเครื่อง)
 */
export async function saveWorkOrderToFirestore(order: WorkOrder): Promise<void> {
  const docRef = doc(db, WORK_ORDERS_COLLECTION, order.id);
  try {
    const payload = {
      ...order,
      syncedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, payload, { merge: true });
    console.log(`[Firebase] Work order ${order.orderNumber} synced to Firestore.`);
  } catch (error) {
    console.error(`[Firebase] Failed to save work order ${order.orderNumber}:`, error);
    handleFirestoreError(error, OperationType.WRITE, `${WORK_ORDERS_COLLECTION}/${order.id}`);
  }
}

/**
 * บันทึกหรืออัปเดตทะเบียนครุภัณฑ์ลง Firestore
 */
export async function saveAssetToFirestore(asset: Asset): Promise<void> {
  const docRef = doc(db, ASSETS_COLLECTION, asset.id);
  try {
    const payload = {
      ...asset,
      syncedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    console.error(`[Firebase] Failed to save asset ${asset.code}:`, error);
    handleFirestoreError(error, OperationType.WRITE, `${ASSETS_COLLECTION}/${asset.id}`);
  }
}

/**
 * ดึงรายการใบแจ้งซ่อมทั้งหมดจาก Firestore
 */
export async function fetchWorkOrdersFromFirestore(): Promise<WorkOrder[]> {
  try {
    const colRef = collection(db, WORK_ORDERS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const orders: WorkOrder[] = [];
    snapshot.forEach(docSnap => {
      orders.push(docSnap.data() as WorkOrder);
    });
    // Sort descending by reportDate
    orders.sort((a, b) => (b.reportDate || '').localeCompare(a.reportDate || ''));
    return orders;
  } catch (error) {
    console.warn('[Firebase] fetchWorkOrders error:', error);
    return [];
  }
}

/**
 * ดึงรายการครุภัณฑ์ทั้งหมดจาก Firestore
 */
export async function fetchAssetsFromFirestore(): Promise<Asset[]> {
  try {
    const colRef = collection(db, ASSETS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const assets: Asset[] = [];
    snapshot.forEach(docSnap => {
      assets.push(docSnap.data() as Asset);
    });
    return assets;
  } catch (error) {
    console.warn('[Firebase] fetchAssets error:', error);
    return [];
  }
}

/**
 * สมัครรับข้อมูล Realtime updates ใบแจ้งซ่อมจาก Firebase Firestore (รับข้อมูลสดเมื่อมีเครื่องอื่นบันทึก)
 */
export function subscribeToWorkOrders(onUpdate: (orders: WorkOrder[]) => void): () => void {
  try {
    const colRef = collection(db, WORK_ORDERS_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const orders: WorkOrder[] = [];
        snapshot.forEach(docSnap => {
          orders.push(docSnap.data() as WorkOrder);
        });
        // Sort descending by report date
        orders.sort((a, b) => (b.reportDate || '').localeCompare(a.reportDate || ''));
        onUpdate(orders);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, WORK_ORDERS_COLLECTION);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.warn('[Firebase] Work order subscription failed:', error);
    return () => {};
  }
}

/**
 * สมัครรับข้อมูล Realtime updates ครุภัณฑ์จาก Firebase Firestore
 */
export function subscribeToAssets(onUpdate: (assets: Asset[]) => void): () => void {
  try {
    const colRef = collection(db, ASSETS_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const assets: Asset[] = [];
        snapshot.forEach(docSnap => {
          assets.push(docSnap.data() as Asset);
        });
        if (assets.length > 0) {
          onUpdate(assets);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, ASSETS_COLLECTION);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.warn('[Firebase] Asset subscription failed:', error);
    return () => {};
  }
}

/**
 * ซิงค์ข้อมูลทั้งหมดขึ้น Firestore เมื่อมีการร้องขอหรือเปิดใช้งานครั้งแรก
 */
export async function batchSyncWorkOrdersToFirestore(orders: WorkOrder[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const order of orders) {
      const docRef = doc(db, WORK_ORDERS_COLLECTION, order.id);
      batch.set(docRef, { ...order, syncedAt: new Date().toISOString() }, { merge: true });
    }
    await batch.commit();
    console.log(`[Firebase] Batch uploaded ${orders.length} work orders to Firestore.`);
  } catch (error) {
    console.error('[Firebase] Batch work order upload failed:', error);
    handleFirestoreError(error, OperationType.WRITE, WORK_ORDERS_COLLECTION);
  }
}

/**
 * ซิงค์ครุภัณฑ์ทั้งหมดขึ้น Firestore
 */
export async function batchSyncAssetsToFirestore(assets: Asset[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const asset of assets) {
      const docRef = doc(db, ASSETS_COLLECTION, asset.id);
      batch.set(docRef, { ...asset, syncedAt: new Date().toISOString() }, { merge: true });
    }
    await batch.commit();
    console.log(`[Firebase] Batch uploaded ${assets.length} assets to Firestore.`);
  } catch (error) {
    console.error('[Firebase] Batch assets upload failed:', error);
    handleFirestoreError(error, OperationType.WRITE, ASSETS_COLLECTION);
  }
}

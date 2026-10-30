import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Asset, 
  WorkOrder, 
  PMRecord, 
  SparePart, 
  Technician, 
  WorkOrderStatus, 
  PMStatus,
  UsedPart,
  SystemUser
} from '../types';
import { 
  INITIAL_ASSETS, 
  INITIAL_WORK_ORDERS, 
  INITIAL_PM_RECORDS, 
  INITIAL_SPARE_PARTS, 
  INITIAL_TECHNICIANS,
  INITIAL_SYSTEM_USERS
} from '../data/mockData';
import {
  saveWorkOrderToFirestore,
  subscribeToWorkOrders,
  saveAssetToFirestore,
  subscribeToAssets,
  batchSyncWorkOrdersToFirestore,
  batchSyncAssetsToFirestore,
  testConnection
} from '../lib/firebase';

interface AppContextType {
  assets: Asset[];
  workOrders: WorkOrder[];
  pmRecords: PMRecord[];
  spareParts: SparePart[];
  technicians: Technician[];
  systemUsers: SystemUser[];
  activeTab: 'dashboard' | 'assets' | 'inventory' | 'work-orders' | 'pm-calibration' | 'reports' | 'workforce';
  setActiveTab: (tab: 'dashboard' | 'assets' | 'inventory' | 'work-orders' | 'pm-calibration' | 'reports' | 'workforce') => void;
  selectedAssetForDetail: Asset | null;
  setSelectedAssetForDetail: (asset: Asset | null) => void;
  selectedOrderForDetail: WorkOrder | null;
  setSelectedOrderForDetail: (order: WorkOrder | null) => void;
  selectedOrderForPrint: WorkOrder | null;
  setSelectedOrderForPrint: (order: WorkOrder | null) => void;
  selectedAssetForQR: Asset | null;
  setSelectedAssetForQR: (asset: Asset | null) => void;
  selectedAssetForLedger: Asset | null;
  setSelectedAssetForLedger: (asset: Asset | null) => void;
  
  // Firebase Live Sync Status (Multi-device)
  firebaseConnected: boolean;
  firebaseSyncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncedTime: string | null;
  syncWorkOrderToCloud: (order: WorkOrder) => Promise<void>;
  syncAllDataToCloud: () => Promise<void>;

  // Handlers
  addAsset: (asset: Omit<Asset, 'id'>) => void;
  batchAddAssets: (assets: Omit<Asset, 'id'>[]) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  
  addWorkOrder: (order: Omit<WorkOrder, 'id' | 'orderNumber' | 'reportDate' | 'status' | 'usedParts' | 'totalCost'>) => void;
  updateWorkOrderStatus: (id: string, status: WorkOrderStatus, notes?: string) => void;
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => void;
  issuePartToOrder: (orderId: string, partId: string, quantity: number) => boolean;

  addPMRecord: (record: Omit<PMRecord, 'id'>) => void;
  completePMRecord: (id: string, overallResult: 'pass' | 'conditional_pass' | 'fail', deviation?: string, notes?: string) => void;

  addSparePart: (part: Omit<SparePart, 'id'>) => void;
  restockPart: (id: string, quantity: number) => void;

  updateTechStatus: (id: string, status: 'available' | 'busy' | 'leave') => void;
  updateUserStatus: (id: string, status: 'active' | 'suspended') => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assets' | 'inventory' | 'work-orders' | 'pm-calibration' | 'reports' | 'workforce'>('dashboard');
  
  // Local storage state initialization
  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('skh_assets');
    return saved ? JSON.parse(saved) : INITIAL_ASSETS;
  });

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => {
    const saved = localStorage.getItem('skh_work_orders');
    return saved ? JSON.parse(saved) : INITIAL_WORK_ORDERS;
  });

  const [pmRecords, setPmRecords] = useState<PMRecord[]>(() => {
    const saved = localStorage.getItem('skh_pm_records');
    return saved ? JSON.parse(saved) : INITIAL_PM_RECORDS;
  });

  const [spareParts, setSpareParts] = useState<SparePart[]>(() => {
    const saved = localStorage.getItem('skh_spare_parts');
    return saved ? JSON.parse(saved) : INITIAL_SPARE_PARTS;
  });

  const [technicians, setTechnicians] = useState<Technician[]>(() => {
    const saved = localStorage.getItem('skh_technicians');
    return saved ? JSON.parse(saved) : INITIAL_TECHNICIANS;
  });

  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(() => {
    const saved = localStorage.getItem('skh_system_users');
    return saved ? JSON.parse(saved) : INITIAL_SYSTEM_USERS;
  });

  // Modal / Selected views
  const [selectedAssetForDetail, setSelectedAssetForDetail] = useState<Asset | null>(null);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<WorkOrder | null>(null);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<WorkOrder | null>(null);
  const [selectedAssetForQR, setSelectedAssetForQR] = useState<Asset | null>(null);
  const [selectedAssetForLedger, setSelectedAssetForLedger] = useState<Asset | null>(null);

  // Firebase Live Sync State
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(false);
  const [firebaseSyncStatus, setFirebaseSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('offline');
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  // Test Firebase connection & subscribe to realtime updates
  useEffect(() => {
    let isMounted = true;

    testConnection().then((connected) => {
      if (isMounted) {
        setFirebaseConnected(connected);
        if (connected) {
          setFirebaseSyncStatus('synced');
          setLastSyncedTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      }
    });

    // 1. Subscribe to real-time work orders (any device update is received live)
    const unsubOrders = subscribeToWorkOrders((remoteOrders) => {
      if (!isMounted) return;
      if (remoteOrders.length === 0) {
        // If Firestore is completely fresh, bootstrap initial mock orders
        batchSyncWorkOrdersToFirestore(INITIAL_WORK_ORDERS).catch(console.warn);
      } else {
        setWorkOrders(remoteOrders);
      }
      setFirebaseConnected(true);
      setFirebaseSyncStatus('synced');
      setLastSyncedTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    });

    // 2. Subscribe to real-time assets
    const unsubAssets = subscribeToAssets((remoteAssets) => {
      if (!isMounted || !remoteAssets || remoteAssets.length === 0) return;
      setAssets(remoteAssets);
      setFirebaseConnected(true);
      setFirebaseSyncStatus('synced');
    });

    return () => {
      isMounted = false;
      unsubOrders();
      unsubAssets();
    };
  }, []);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('skh_assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('skh_work_orders', JSON.stringify(workOrders));
  }, [workOrders]);

  useEffect(() => {
    localStorage.setItem('skh_pm_records', JSON.stringify(pmRecords));
  }, [pmRecords]);

  useEffect(() => {
    localStorage.setItem('skh_spare_parts', JSON.stringify(spareParts));
  }, [spareParts]);

  useEffect(() => {
    localStorage.setItem('skh_technicians', JSON.stringify(technicians));
  }, [technicians]);

  useEffect(() => {
    localStorage.setItem('skh_system_users', JSON.stringify(systemUsers));
  }, [systemUsers]);

  // Cloud sync function for single work order
  const syncWorkOrderToCloud = async (order: WorkOrder) => {
    setFirebaseSyncStatus('syncing');
    try {
      await saveWorkOrderToFirestore(order);
      setFirebaseSyncStatus('synced');
      setFirebaseConnected(true);
      setLastSyncedTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('[Firebase] Sync failed, saved locally:', err);
      setFirebaseSyncStatus('error');
    }
  };

  // Sync all data to Cloud
  const syncAllDataToCloud = async () => {
    setFirebaseSyncStatus('syncing');
    try {
      await batchSyncWorkOrdersToFirestore(workOrders);
      await batchSyncAssetsToFirestore(assets);
      setFirebaseSyncStatus('synced');
      setFirebaseConnected(true);
      setLastSyncedTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('[Firebase] Manual batch sync failed:', err);
      setFirebaseSyncStatus('error');
    }
  };

  // Asset Actions
  const addAsset = (newAssetData: Omit<Asset, 'id'>) => {
    const newAsset: Asset = {
      ...newAssetData,
      id: `ast-${Date.now().toString().slice(-5)}`,
    };
    setAssets(prev => [newAsset, ...prev]);
    saveAssetToFirestore(newAsset).catch(console.warn);
  };

  const batchAddAssets = (newAssetsData: Omit<Asset, 'id'>[]) => {
    const timestamp = Date.now();
    const createdAssets: Asset[] = newAssetsData.map((data, index) => ({
      ...data,
      id: `ast-${timestamp.toString().slice(-4)}${index}`,
    }));
    setAssets(prev => [...createdAssets, ...prev]);
    batchSyncAssetsToFirestore(createdAssets).catch(console.warn);
  };

  const updateAsset = (id: string, updates: Partial<Asset>) => {
    let updatedAsset: Asset | null = null;
    setAssets(prev => prev.map(a => {
      if (a.id === id) {
        const merged = { ...a, ...updates };
        updatedAsset = merged;
        return merged;
      }
      return a;
    }));
    if (selectedAssetForDetail?.id === id) {
      setSelectedAssetForDetail(prev => prev ? { ...prev, ...updates } : null);
    }
    if (updatedAsset) {
      saveAssetToFirestore(updatedAsset).catch(console.warn);
    }
  };

  const deleteAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    if (selectedAssetForDetail?.id === id) {
      setSelectedAssetForDetail(null);
    }
  };

  // Work Order Actions
  const addWorkOrder = (data: Omit<WorkOrder, 'id' | 'orderNumber' | 'reportDate' | 'status' | 'usedParts' | 'totalCost'>) => {
    const now = new Date();
    const year = now.getFullYear();
    const orderCount = workOrders.length + 1;
    const orderNumber = `WO-${year}-${String(orderCount).padStart(4, '0')}`;
    const reportDate = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;

    const newOrder: WorkOrder = {
      ...data,
      id: `wo-${Date.now().toString().slice(-6)}`,
      orderNumber,
      reportDate,
      status: 'pending',
      usedParts: [],
      totalCost: 0,
    };

    // 1. Optimistic Local State Update
    setWorkOrders(prev => [newOrder, ...prev]);

    // 2. Also update asset status to in_repair if currently ready
    updateAsset(data.assetId, { status: 'in_repair' });

    // 3. Automatically sync new work order to Firebase Firestore
    syncWorkOrderToCloud(newOrder);
  };

  const updateWorkOrderStatus = (id: string, status: WorkOrderStatus, notes?: string) => {
    const now = new Date();
    const dateStr = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;

    let updatedTargetOrder: WorkOrder | null = null;

    setWorkOrders(prev => prev.map(wo => {
      if (wo.id !== id) return wo;
      
      const updates: Partial<WorkOrder> = { status };
      if (notes) updates.notes = (wo.notes ? `${wo.notes}\n` : '') + `[${dateStr}] ${notes}`;
      
      if (status === 'in_progress' && !wo.repairStartDate) {
        updates.repairStartDate = dateStr;
      }
      if (status === 'completed' || status === 'testing') {
        updates.repairEndDate = dateStr;
      }

      const merged = { ...wo, ...updates };
      updatedTargetOrder = merged;
      return merged;
    }));

    // If order is completed, update the asset back to ready
    const order = workOrders.find(o => o.id === id);
    if (order && status === 'completed') {
      updateAsset(order.assetId, { status: 'ready' });
    }

    // Auto sync updated order to Firestore
    if (updatedTargetOrder) {
      syncWorkOrderToCloud(updatedTargetOrder);
    }
  };

  const updateWorkOrder = (id: string, updates: Partial<WorkOrder>) => {
    let updatedTargetOrder: WorkOrder | null = null;

    setWorkOrders(prev => prev.map(wo => {
      if (wo.id !== id) return wo;
      const merged = { ...wo, ...updates };
      updatedTargetOrder = merged;
      return merged;
    }));

    if (selectedOrderForDetail?.id === id) {
      setSelectedOrderForDetail(prev => prev ? { ...prev, ...updates } : null);
    }

    // Auto sync updated order to Firestore
    if (updatedTargetOrder) {
      syncWorkOrderToCloud(updatedTargetOrder);
    }
  };

  const issuePartToOrder = (orderId: string, partId: string, quantity: number): boolean => {
    const part = spareParts.find(p => p.id === partId);
    if (!part || part.quantity < quantity) {
      return false;
    }

    // Deduct inventory
    setSpareParts(prev => prev.map(p => {
      if (p.id === partId) {
        return { ...p, quantity: p.quantity - quantity };
      }
      return p;
    }));

    // Add to work order
    const usedPart: UsedPart = {
      partId: part.id,
      partName: part.name,
      partCode: part.code,
      quantity,
      unitPrice: part.unitPrice,
      totalPrice: part.unitPrice * quantity,
    };

    setWorkOrders(prev => prev.map(wo => {
      if (wo.id !== orderId) return wo;
      const existingPartIndex = wo.usedParts.findIndex(up => up.partId === partId);
      let newUsedParts = [...wo.usedParts];
      if (existingPartIndex >= 0) {
        const current = newUsedParts[existingPartIndex];
        const newQty = current.quantity + quantity;
        newUsedParts[existingPartIndex] = {
          ...current,
          quantity: newQty,
          totalPrice: newQty * current.unitPrice,
        };
      } else {
        newUsedParts.push(usedPart);
      }

      const totalPartsCost = newUsedParts.reduce((sum, p) => sum + p.totalPrice, 0);
      const totalCost = totalPartsCost + (wo.externalCost || 0);

      return {
        ...wo,
        usedParts: newUsedParts,
        totalCost,
      };
    }));

    return true;
  };

  // PM & Calibration Actions
  const addPMRecord = (data: Omit<PMRecord, 'id'>) => {
    const newRecord: PMRecord = {
      ...data,
      id: `pm-${Date.now().toString().slice(-5)}`,
    };
    setPmRecords(prev => [newRecord, ...prev]);
  };

  const completePMRecord = (id: string, overallResult: 'pass' | 'conditional_pass' | 'fail', deviation?: string, notes?: string) => {
    const today = new Date().toISOString().slice(0, 10);
    setPmRecords(prev => prev.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        status: overallResult === 'fail' ? 'failed' : 'passed',
        completedDate: today,
        overallResult,
        deviationRate: deviation || r.deviationRate,
        notes: notes || r.notes,
      };
    }));

    // Update asset's lastPMDate
    const rec = pmRecords.find(r => r.id === id);
    if (rec) {
      const asset = assets.find(a => a.id === rec.assetId);
      if (asset) {
        if (rec.type === 'pm') {
          updateAsset(asset.id, { 
            lastPMDate: today, 
            nextPMDate: rec.nextScheduledDate,
            status: overallResult === 'fail' ? 'in_repair' : asset.status 
          });
        } else {
          updateAsset(asset.id, { 
            lastCalibrationDate: today, 
            nextCalibrationDate: rec.nextScheduledDate 
          });
        }
      }
    }
  };

  // Spare Parts Actions
  const addSparePart = (data: Omit<SparePart, 'id'>) => {
    const newPart: SparePart = {
      ...data,
      id: `sp-${Date.now().toString().slice(-5)}`,
    };
    setSpareParts(prev => [...prev, newPart]);
  };

  const restockPart = (id: string, quantity: number) => {
    const today = new Date().toISOString().slice(0, 10);
    setSpareParts(prev => prev.map(p => {
      if (p.id !== id) return p;
      return {
        ...p,
        quantity: p.quantity + quantity,
        lastRestockedDate: today,
      };
    }));
  };

  // Technician Actions
  const updateTechStatus = (id: string, status: 'available' | 'busy' | 'leave') => {
    setTechnicians(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  // User Actions
  const updateUserStatus = (id: string, status: 'active' | 'suspended') => {
    setSystemUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u));
  };

  const resetAllData = () => {
    localStorage.removeItem('skh_assets');
    localStorage.removeItem('skh_work_orders');
    localStorage.removeItem('skh_pm_records');
    localStorage.removeItem('skh_spare_parts');
    localStorage.removeItem('skh_technicians');
    localStorage.removeItem('skh_system_users');
    setAssets(INITIAL_ASSETS);
    setWorkOrders(INITIAL_WORK_ORDERS);
    setPmRecords(INITIAL_PM_RECORDS);
    setSpareParts(INITIAL_SPARE_PARTS);
    setTechnicians(INITIAL_TECHNICIANS);
    setSystemUsers(INITIAL_SYSTEM_USERS);
  };

  return (
    <AppContext.Provider
      value={{
        assets,
        workOrders,
        pmRecords,
        spareParts,
        technicians,
        systemUsers,
        activeTab,
        setActiveTab,
        selectedAssetForDetail,
        setSelectedAssetForDetail,
        selectedOrderForDetail,
        setSelectedOrderForDetail,
        selectedOrderForPrint,
        setSelectedOrderForPrint,
        selectedAssetForQR,
        setSelectedAssetForQR,
        selectedAssetForLedger,
        setSelectedAssetForLedger,
        firebaseConnected,
        firebaseSyncStatus,
        lastSyncedTime,
        syncWorkOrderToCloud,
        syncAllDataToCloud,
        addAsset,
        batchAddAssets,
        updateAsset,
        deleteAsset,
        addWorkOrder,
        updateWorkOrderStatus,
        updateWorkOrder,
        issuePartToOrder,
        addPMRecord,
        completePMRecord,
        addSparePart,
        restockPart,
        updateTechStatus,
        updateUserStatus,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

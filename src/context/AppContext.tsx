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
  SystemUser,
  UserRole
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
  saveUserToFirestore,
  subscribeToUsers,
  batchSyncUsersToFirestore,
  clearFirestoreData,
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

  // Authentication & User Management
  currentUser: SystemUser | null;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  login: (username: string, password?: string) => { success: boolean; message?: string };
  logout: () => void;
  registerUser: (data: {
    fullName: string;
    username: string;
    password?: string;
    department: string;
    role: UserRole;
    phone: string;
  }) => Promise<{ success: boolean; message?: string }>;
  approveUser: (userId: string) => Promise<void>;
  rejectUser: (userId: string) => Promise<void>;

  // Clean Production Database Management
  clearAllSampleData: () => Promise<void>;
  loadSampleData: () => Promise<void>;

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
  
  // Authentication State
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(() => {
    const saved = localStorage.getItem('skh_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(() => {
    return !localStorage.getItem('skh_current_user');
  });

  // Local storage state initialization (Default to empty [] for real hospital operation)
  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('skh_assets');
    // If empty or explicitly cleared, start blank
    return saved !== null ? JSON.parse(saved) : [];
  });

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => {
    const saved = localStorage.getItem('skh_work_orders');
    return saved !== null ? JSON.parse(saved) : [];
  });

  const [pmRecords, setPmRecords] = useState<PMRecord[]>(() => {
    const saved = localStorage.getItem('skh_pm_records');
    return saved !== null ? JSON.parse(saved) : [];
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
      setWorkOrders(remoteOrders);
      setFirebaseConnected(true);
      setFirebaseSyncStatus('synced');
      setLastSyncedTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    });

    // 2. Subscribe to real-time assets
    const unsubAssets = subscribeToAssets((remoteAssets) => {
      if (!isMounted) return;
      setAssets(remoteAssets);
      setFirebaseConnected(true);
      setFirebaseSyncStatus('synced');
    });

    // 3. Subscribe to real-time users (new registrations & approvals)
    const unsubUsers = subscribeToUsers((remoteUsers) => {
      if (!isMounted || !remoteUsers || remoteUsers.length === 0) return;
      setSystemUsers(remoteUsers);
    });

    return () => {
      isMounted = false;
      unsubOrders();
      unsubAssets();
      unsubUsers();
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
      await batchSyncUsersToFirestore(systemUsers);
      setFirebaseSyncStatus('synced');
      setFirebaseConnected(true);
      setLastSyncedTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('[Firebase] Manual batch sync failed:', err);
      setFirebaseSyncStatus('error');
    }
  };

  // Authentication Handlers
  const login = (username: string, password?: string): { success: boolean; message?: string } => {
    const user = systemUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      return { success: false, message: 'ไม่พบบัญชีผู้ใช้นี้ในระบบ กรุณาตรวจสอบหรือสมัครเข้าใช้งาน' };
    }
    
    // Check password
    if (user.password && password && user.password !== password) {
      return { success: false, message: 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' };
    }

    // Check approval status
    if (user.status === 'pending') {
      return { 
        success: false, 
        message: 'บัญชีของท่านอยู่ระหว่างรอการอนุมัติสิทธิ์จากแอดมิน (Admin Approval Required)' 
      };
    }
    if (user.status === 'suspended' || user.status === 'rejected') {
      return { 
        success: false, 
        message: 'บัญชีนี้ถูกระงับหรือปฏิเสธการใช้งาน กรุณาติดต่อผู้ดูแลระบบสารสนเทศ' 
      };
    }

    // Login successful
    const updatedUser = { 
      ...user, 
      lastLogin: new Date().toLocaleDateString('th-TH') + ' ' + new Date().toTimeString().slice(0, 5) 
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('skh_current_user', JSON.stringify(updatedUser));
    saveUserToFirestore(updatedUser).catch(console.warn);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('skh_current_user');
    setIsAuthModalOpen(true);
  };

  const registerUser = async (data: {
    fullName: string;
    username: string;
    password?: string;
    department: string;
    role: UserRole;
    phone: string;
  }): Promise<{ success: boolean; message?: string }> => {
    const existing = systemUsers.find(u => u.username.toLowerCase() === data.username.toLowerCase());
    if (existing) {
      return { success: false, message: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น' };
    }

    const roleNameMap: Record<UserRole, string> = {
      super_admin: 'ผู้ดูแลระบบสารสนเทศ (Super Admin)',
      supervisor: 'หัวหน้างานซ่อมบำรุงและวิศวกรรมอาคาร',
      technician: 'ช่างเทคนิค/วิศวกรซ่อมบำรุง',
      department_staff: 'เจ้าหน้าที่ประจำแผนก/พยาบาล'
    };

    const permissionsMap: Record<UserRole, string[]> = {
      super_admin: ['all_access', 'asset_edit', 'repair_manage', 'inventory_manage', 'user_manage', 'report_export'],
      supervisor: ['repair_assign', 'repair_approve', 'pm_manage', 'inventory_issue', 'report_export'],
      technician: ['repair_update', 'pm_execute', 'part_request'],
      department_staff: ['repair_create', 'repair_inspect', 'asset_view']
    };

    const newUser: SystemUser = {
      id: `usr-${Date.now().toString().slice(-6)}`,
      username: data.username.toLowerCase(),
      password: data.password || '123456',
      fullName: data.fullName,
      role: data.role,
      roleName: roleNameMap[data.role] || 'ผู้ใช้งานระบบ',
      department: data.department,
      phone: data.phone,
      email: `${data.username.toLowerCase()}@skh.moph.go.th`,
      status: 'pending', // Requires admin approval
      registeredDate: new Date().toLocaleString('th-TH'),
      permissions: permissionsMap[data.role] || ['repair_create', 'asset_view']
    };

    setSystemUsers(prev => [newUser, ...prev]);
    await saveUserToFirestore(newUser);
    return { success: true };
  };

  const approveUser = async (userId: string) => {
    const target = systemUsers.find(u => u.id === userId);
    if (!target) return;

    const updatedUser: SystemUser = {
      ...target,
      status: 'active',
      approvedDate: new Date().toLocaleString('th-TH'),
      approvedBy: currentUser?.fullName || 'ผู้ดูแลระบบสารสนเทศ (Admin)'
    };

    setSystemUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    await saveUserToFirestore(updatedUser);
  };

  const rejectUser = async (userId: string) => {
    const target = systemUsers.find(u => u.id === userId);
    if (!target) return;

    const updatedUser: SystemUser = {
      ...target,
      status: 'rejected'
    };

    setSystemUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    await saveUserToFirestore(updatedUser);
  };

  // Clean Empty Production Database
  const clearAllSampleData = async () => {
    setAssets([]);
    setWorkOrders([]);
    setPmRecords([]);
    localStorage.setItem('skh_assets', JSON.stringify([]));
    localStorage.setItem('skh_work_orders', JSON.stringify([]));
    localStorage.setItem('skh_pm_records', JSON.stringify([]));
    localStorage.setItem('skh_database_cleared', 'true');
    await clearFirestoreData();
    setLastSyncedTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  const loadSampleData = async () => {
    setAssets(INITIAL_ASSETS);
    setWorkOrders(INITIAL_WORK_ORDERS);
    setPmRecords(INITIAL_PM_RECORDS);
    localStorage.removeItem('skh_database_cleared');
    await batchSyncWorkOrdersToFirestore(INITIAL_WORK_ORDERS);
    await batchSyncAssetsToFirestore(INITIAL_ASSETS);
    setLastSyncedTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
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
        currentUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        login,
        logout,
        registerUser,
        approveUser,
        rejectUser,
        clearAllSampleData,
        loadSampleData,
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

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
  UserRole,
  UserStatus
} from '../types';
import { 
  INITIAL_ASSETS, 
  INITIAL_WORK_ORDERS, 
  INITIAL_PM_RECORDS, 
  INITIAL_SPARE_PARTS, 
  INITIAL_TECHNICIANS,
  INITIAL_SYSTEM_USERS,
  DEFAULT_ADMIN_USER,
  SAMPLE_SPARE_PARTS_FOR_DEMO,
  SAMPLE_TECHNICIANS_FOR_DEMO,
  SAMPLE_USERS_FOR_DEMO
} from '../data/mockData';
import {
  saveWorkOrderToFirestore,
  subscribeToWorkOrders,
  saveAssetToFirestore,
  subscribeToAssets,
  saveSparePartToFirestore,
  deleteSparePartFromFirestore,
  subscribeToSpareParts,
  batchSyncSparePartsToFirestore,
  saveTechnicianToFirestore,
  deleteTechnicianFromFirestore,
  subscribeToTechnicians,
  batchSyncTechniciansToFirestore,
  saveUserToFirestore,
  deleteUserFromFirestore,
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
  addUserByAdmin: (data: {
    username: string;
    fullName: string;
    password?: string;
    role: UserRole;
    department: string;
    phone: string;
    email?: string;
    allowedMenus?: ('dashboard' | 'assets' | 'inventory' | 'work-orders' | 'pm-calibration' | 'reports' | 'workforce')[];
  }) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  approveUser: (
    userId: string, 
    allowedMenus?: ('dashboard' | 'assets' | 'inventory' | 'work-orders' | 'pm-calibration' | 'reports' | 'workforce')[], 
    role?: UserRole
  ) => Promise<void>;
  updateUserPermissions: (
    userId: string, 
    allowedMenus: ('dashboard' | 'assets' | 'inventory' | 'work-orders' | 'pm-calibration' | 'reports' | 'workforce')[], 
    role?: UserRole
  ) => Promise<void>;
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
  deleteSparePart: (id: string) => Promise<void>;
  restockPart: (id: string, quantity: number) => void;

  addTechnician: (tech: Omit<Technician, 'id' | 'activeTicketsCount' | 'completedTicketsCount'>) => Promise<void>;
  deleteTechnician: (id: string) => Promise<void>;
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

  // Local storage state initialization (Default to clean empty database for real hospital operations)
  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('skh_assets');
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
    return saved !== null ? JSON.parse(saved) : INITIAL_SPARE_PARTS;
  });

  const [technicians, setTechnicians] = useState<Technician[]>(() => {
    const saved = localStorage.getItem('skh_technicians');
    return saved !== null ? JSON.parse(saved) : INITIAL_TECHNICIANS;
  });

  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(() => {
    try {
      const saved = localStorage.getItem('skh_system_users');
      const list: SystemUser[] = saved ? JSON.parse(saved) : INITIAL_SYSTEM_USERS;
      const hasAdmin = list.some(u => u.username.toLowerCase() === 'admin');
      if (!hasAdmin) {
        return [DEFAULT_ADMIN_USER, ...list];
      }
      return list.map(u => u.username.toLowerCase() === 'admin' ? { ...u, password: 'sskhos', status: 'active' as UserStatus } : u);
    } catch {
      return INITIAL_SYSTEM_USERS;
    }
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

    // 3. Subscribe to real-time spare parts (คลังอะไหล่)
    const unsubParts = subscribeToSpareParts((remoteParts) => {
      if (!isMounted) return;
      setSpareParts(remoteParts);
      setFirebaseConnected(true);
    });

    // 4. Subscribe to real-time technicians (ทีมช่าง)
    const unsubTechs = subscribeToTechnicians((remoteTechs) => {
      if (!isMounted) return;
      setTechnicians(remoteTechs);
      setFirebaseConnected(true);
    });

    // 5. Subscribe to real-time users (ผู้ใช้งานระบบและการกำหนดสิทธิ์)
    const unsubUsers = subscribeToUsers((remoteUsers) => {
      if (!isMounted || !remoteUsers) return;
      const hasAdmin = remoteUsers.some(u => u.username.toLowerCase() === 'admin');
      const finalUsers: SystemUser[] = hasAdmin
        ? remoteUsers.map(u => u.username.toLowerCase() === 'admin' ? { ...u, password: 'sskhos', status: 'active' as UserStatus } : u)
        : [DEFAULT_ADMIN_USER, ...remoteUsers];
      setSystemUsers(finalUsers);
      setFirebaseConnected(true);
    });

    return () => {
      isMounted = false;
      unsubOrders();
      unsubAssets();
      unsubParts();
      unsubTechs();
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

  // Sync new work order to cloud
  const syncWorkOrderToCloud = async (order: WorkOrder) => {
    setFirebaseSyncStatus('syncing');
    try {
      await saveWorkOrderToFirestore(order);
      setFirebaseSyncStatus('synced');
      setFirebaseConnected(true);
      setLastSyncedTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (error) {
      console.warn('Failed to sync order to cloud:', error);
      setFirebaseSyncStatus('error');
    }
  };

  // Sync all data to cloud manually
  const syncAllDataToCloud = async () => {
    setFirebaseSyncStatus('syncing');
    try {
      await batchSyncWorkOrdersToFirestore(workOrders);
      await batchSyncAssetsToFirestore(assets);
      await batchSyncSparePartsToFirestore(spareParts);
      await batchSyncTechniciansToFirestore(technicians);
      await batchSyncUsersToFirestore(systemUsers);
      setFirebaseSyncStatus('synced');
      setFirebaseConnected(true);
      setLastSyncedTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (error) {
      console.warn('Manual sync failed:', error);
      setFirebaseSyncStatus('error');
    }
  };

  // Authentication Handlers
  const login = (username: string, password?: string): { success: boolean; message?: string } => {
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password?.trim() || '';

    // 1. Strict check for Admin credentials (admin / sskhos)
    if (cleanUsername === 'admin') {
      if (cleanPassword === 'sskhos') {
        const adminAccount: SystemUser = {
          ...DEFAULT_ADMIN_USER,
          lastLogin: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
        };
        setCurrentUser(adminAccount);
        localStorage.setItem('skh_current_user', JSON.stringify(adminAccount));
        setIsAuthModalOpen(false);
        saveUserToFirestore(adminAccount).catch(console.warn);
        return { success: true };
      } else {
        return { success: false, message: 'รหัสผ่านแอดมินไม่ถูกต้อง (กรุณากรอกรหัสผ่านที่กำหนด)' };
      }
    }

    // 2. Regular User Login
    const user = systemUsers.find(u => u.username.toLowerCase() === cleanUsername);
    if (!user) {
      return { success: false, message: 'ไม่พบชื่อผู้ใช้งานนี้ในระบบ หรือยังไม่ได้รับการอนุมัติ' };
    }

    if (user.status === 'pending') {
      return { 
        success: false, 
        message: 'บัญชีของคุณอยู่ระหว่างรอการตรวจสอบและอนุมัติจากผู้ดูแลระบบ (Admin) กรุณาติดต่อกลุ่มงานสารสนเทศ' 
      };
    }

    if (user.status === 'suspended' || user.status === 'rejected') {
      return { success: false, message: 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' };
    }

    // Check user password if set
    if (user.password && cleanPassword && user.password !== cleanPassword) {
      return { success: false, message: 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' };
    }

    const updatedUser = {
      ...user,
      lastLogin: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('skh_current_user', JSON.stringify(updatedUser));
    setIsAuthModalOpen(false);
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
      return { success: false, message: 'ชื่อผู้ใช้งานนี้มีในระบบแล้ว กรุณาเลือกชื่อผู้ใช้ใหม่' };
    }

    const roleNameMap: Record<UserRole, string> = {
      super_admin: 'ผู้ดูแลระบบสารสนเทศ (Super Admin)',
      supervisor: 'หัวหน้างานซ่อมบำรุงและวิศวกรรมอาคาร',
      technician: 'ช่างเทคนิค/วิศวกรซ่อมบำรุง',
      department_staff: 'เจ้าหน้าที่ประจำแผนก/พยาบาล'
    };

    const permissionsMap: Record<UserRole, string[]> = {
      super_admin: ['all_access'],
      supervisor: ['repair_assign', 'repair_approve', 'pm_manage', 'inventory_issue', 'report_export'],
      technician: ['repair_update', 'pm_execute', 'calibration_cert', 'part_request'],
      department_staff: ['repair_create', 'repair_inspect', 'asset_view']
    };

    const defaultMenusMap: Record<UserRole, ('dashboard' | 'assets' | 'inventory' | 'work-orders' | 'pm-calibration' | 'reports' | 'workforce')[]> = {
      super_admin: ['dashboard', 'assets', 'inventory', 'work-orders', 'pm-calibration', 'reports', 'workforce'],
      supervisor: ['dashboard', 'assets', 'inventory', 'work-orders', 'pm-calibration', 'reports'],
      technician: ['dashboard', 'assets', 'inventory', 'work-orders', 'pm-calibration'],
      department_staff: ['dashboard', 'assets', 'work-orders']
    };

    const newUser: SystemUser = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      username: data.username.toLowerCase().trim(),
      password: data.password || 'sskhos',
      fullName: data.fullName.trim(),
      role: data.role,
      roleName: roleNameMap[data.role] || 'เจ้าหน้าที่ผู้ใช้งาน',
      department: data.department,
      phone: data.phone,
      email: `${data.username.toLowerCase()}@skh.moph.go.th`,
      status: 'pending', // Requires admin approval
      registeredDate: new Date().toLocaleString('th-TH'),
      permissions: permissionsMap[data.role] || ['repair_create', 'asset_view'],
      allowedMenus: defaultMenusMap[data.role] || ['dashboard', 'assets', 'work-orders']
    };

    setSystemUsers(prev => [newUser, ...prev]);
    await saveUserToFirestore(newUser);
    return { success: true };
  };

  // Add User by Admin (เพิ่มผู้ใช้โดยแอดมินเท่านั้น พร้อมบันทึก Firebase อัตโนมัติ)
  const addUserByAdmin = async (userData: {
    username: string;
    fullName: string;
    password?: string;
    role: UserRole;
    department: string;
    phone: string;
    email?: string;
    allowedMenus?: ('dashboard' | 'assets' | 'inventory' | 'work-orders' | 'pm-calibration' | 'reports' | 'workforce')[];
  }) => {
    const roleNameMap: Record<UserRole, string> = {
      super_admin: 'ผู้ดูแลระบบสารสนเทศสูงสุด (Super Admin)',
      supervisor: 'หัวหน้างานซ่อมบำรุงและวิศวกรรมอาคาร (Supervisor)',
      technician: 'ช่างเทคนิค/วิศวกรชีวการแพทย์ (Technician)',
      department_staff: 'บุคลากรประจำแผนกผู้แจ้งซ่อม (Department Staff)'
    };

    const defaultMenusMap: Record<UserRole, ('dashboard' | 'assets' | 'inventory' | 'work-orders' | 'pm-calibration' | 'reports' | 'workforce')[]> = {
      super_admin: ['dashboard', 'assets', 'inventory', 'work-orders', 'pm-calibration', 'reports', 'workforce'],
      supervisor: ['dashboard', 'assets', 'inventory', 'work-orders', 'pm-calibration', 'reports'],
      technician: ['dashboard', 'assets', 'inventory', 'work-orders', 'pm-calibration'],
      department_staff: ['dashboard', 'assets', 'work-orders']
    };

    const newUser: SystemUser = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      username: userData.username.toLowerCase().trim(),
      password: userData.password || 'sskhos',
      fullName: userData.fullName.trim(),
      role: userData.role,
      roleName: roleNameMap[userData.role] || 'บุคลากรโรงพยาบาลสังขละบุรี',
      department: userData.department,
      phone: userData.phone || '034-595021',
      email: userData.email || `${userData.username.toLowerCase()}@skh.moph.go.th`,
      status: 'active',
      lastLogin: 'เพิ่งสร้างบัญชี',
      permissions: userData.role === 'super_admin' ? ['all_access'] : ['repair_manage', 'asset_view'],
      allowedMenus: userData.allowedMenus || defaultMenusMap[userData.role]
    };

    setSystemUsers(prev => [newUser, ...prev.filter(u => u.username !== newUser.username)]);
    await saveUserToFirestore(newUser);

    // If role is technician, automatically register in technicians list as well
    if (userData.role === 'technician') {
      const newTech: Technician = {
        id: `tech-${newUser.id}`,
        name: newUser.fullName,
        role: 'biomedical',
        roleTitle: 'ช่างเทคนิค/วิศวกรซ่อมบำรุง',
        phone: newUser.phone,
        email: newUser.email,
        status: 'available',
        activeTicketsCount: 0,
        completedTicketsCount: 0,
        avatarColor: 'bg-emerald-700'
      };
      setTechnicians(prev => [newTech, ...prev.filter(t => t.name !== newTech.name)]);
      await saveTechnicianToFirestore(newTech);
    }
  };

  const deleteUser = async (userId: string) => {
    const target = systemUsers.find(u => u.id === userId);
    if (!target) return;
    if (target.username.toLowerCase() === 'admin') {
      console.warn('Cannot delete primary admin user.');
      return;
    }
    setSystemUsers(prev => prev.filter(u => u.id !== userId));
    await deleteUserFromFirestore(userId);
  };

  const approveUser = async (
    userId: string, 
    allowedMenus?: ('dashboard' | 'assets' | 'inventory' | 'work-orders' | 'pm-calibration' | 'reports' | 'workforce')[], 
    role?: UserRole
  ) => {
    const target = systemUsers.find(u => u.id === userId);
    if (!target) return;

    const roleNameMap: Record<UserRole, string> = {
      super_admin: 'ผู้ดูแลระบบสารสนเทศ (Super Admin)',
      supervisor: 'หัวหน้างานซ่อมบำรุงและวิศวกรรมอาคาร',
      technician: 'ช่างเทคนิค/วิศวกรซ่อมบำรุง',
      department_staff: 'เจ้าหน้าที่ประจำแผนก/พยาบาล'
    };

    const targetRole = role || target.role;
    const defaultMenus: Record<UserRole, ('dashboard' | 'assets' | 'inventory' | 'work-orders' | 'pm-calibration' | 'reports' | 'workforce')[]> = {
      super_admin: ['dashboard', 'assets', 'inventory', 'work-orders', 'pm-calibration', 'reports', 'workforce'],
      supervisor: ['dashboard', 'assets', 'inventory', 'work-orders', 'pm-calibration', 'reports'],
      technician: ['dashboard', 'assets', 'inventory', 'work-orders', 'pm-calibration'],
      department_staff: ['dashboard', 'assets', 'work-orders']
    };

    const updatedUser: SystemUser = {
      ...target,
      status: 'active',
      role: targetRole,
      roleName: roleNameMap[targetRole] || target.roleName,
      allowedMenus: allowedMenus && allowedMenus.length > 0 ? allowedMenus : (target.allowedMenus || defaultMenus[targetRole]),
      approvedDate: new Date().toLocaleString('th-TH'),
      approvedBy: currentUser?.fullName || 'ผู้ดูแลระบบสารสนเทศ (Admin)'
    };

    setSystemUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    await saveUserToFirestore(updatedUser);

    if (targetRole === 'technician') {
      const existingTech = technicians.find(t => t.id === `tech-${userId}` || t.name === updatedUser.fullName);
      if (!existingTech) {
        const newTech: Technician = {
          id: `tech-${userId}`,
          name: updatedUser.fullName,
          role: 'biomedical',
          roleTitle: 'ช่างเทคนิค/วิศวกรซ่อมบำรุง',
          phone: updatedUser.phone,
          email: updatedUser.email,
          status: 'available',
          activeTicketsCount: 0,
          completedTicketsCount: 0,
          avatarColor: 'bg-emerald-700'
        };
        setTechnicians(prev => [newTech, ...prev]);
        await saveTechnicianToFirestore(newTech);
      }
    }
  };

  const updateUserPermissions = async (
    userId: string, 
    allowedMenus: ('dashboard' | 'assets' | 'inventory' | 'work-orders' | 'pm-calibration' | 'reports' | 'workforce')[], 
    role?: UserRole
  ) => {
    const target = systemUsers.find(u => u.id === userId);
    if (!target) return;

    const roleNameMap: Record<UserRole, string> = {
      super_admin: 'ผู้ดูแลระบบสารสนเทศ (Super Admin)',
      supervisor: 'หัวหน้างานซ่อมบำรุงและวิศวกรรมอาคาร',
      technician: 'ช่างเทคนิค/วิศวกรซ่อมบำรุง',
      department_staff: 'เจ้าหน้าที่ประจำแผนก/พยาบาล'
    };

    const updatedUser: SystemUser = {
      ...target,
      role: role || target.role,
      roleName: role ? (roleNameMap[role] || target.roleName) : target.roleName,
      allowedMenus
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

  // Clean Empty Production Database (ล้างเป็นฐานเปล่า 100% พร้อมบันทึกข้อมูลจริง)
  const clearAllSampleData = async () => {
    setAssets([]);
    setWorkOrders([]);
    setPmRecords([]);
    setSpareParts([]);
    setTechnicians([]);
    setSystemUsers([DEFAULT_ADMIN_USER]);

    localStorage.setItem('skh_assets', JSON.stringify([]));
    localStorage.setItem('skh_work_orders', JSON.stringify([]));
    localStorage.setItem('skh_pm_records', JSON.stringify([]));
    localStorage.setItem('skh_spare_parts', JSON.stringify([]));
    localStorage.setItem('skh_technicians', JSON.stringify([]));
    localStorage.setItem('skh_system_users', JSON.stringify([DEFAULT_ADMIN_USER]));
    localStorage.setItem('skh_database_cleared', 'true');

    await clearFirestoreData();
    setLastSyncedTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  const loadSampleData = async () => {
    setAssets(INITIAL_ASSETS);
    setWorkOrders(INITIAL_WORK_ORDERS);
    setPmRecords(INITIAL_PM_RECORDS);
    setSpareParts(SAMPLE_SPARE_PARTS_FOR_DEMO);
    setTechnicians(SAMPLE_TECHNICIANS_FOR_DEMO);
    setSystemUsers([DEFAULT_ADMIN_USER, ...SAMPLE_USERS_FOR_DEMO]);
    localStorage.removeItem('skh_database_cleared');

    await batchSyncWorkOrdersToFirestore(INITIAL_WORK_ORDERS);
    await batchSyncAssetsToFirestore(INITIAL_ASSETS);
    await batchSyncSparePartsToFirestore(SAMPLE_SPARE_PARTS_FOR_DEMO);
    await batchSyncTechniciansToFirestore(SAMPLE_TECHNICIANS_FOR_DEMO);
    await batchSyncUsersToFirestore([DEFAULT_ADMIN_USER, ...SAMPLE_USERS_FOR_DEMO]);
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

    setWorkOrders(prev => [newOrder, ...prev]);
    updateAsset(data.assetId, { status: 'in_repair' });
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
      } else if (status === 'completed' && !wo.repairEndDate) {
        updates.repairEndDate = dateStr;
      }

      const merged = { ...wo, ...updates };
      updatedTargetOrder = merged;
      return merged;
    }));

    if (updatedTargetOrder) {
      syncWorkOrderToCloud(updatedTargetOrder);
      const target = updatedTargetOrder as WorkOrder;
      if (status === 'completed') {
        updateAsset(target.assetId, { status: 'ready', lastRepairDate: dateStr.slice(0, 10) });
      } else if (status === 'in_progress') {
        updateAsset(target.assetId, { status: 'in_repair' });
      }
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

    if (updatedTargetOrder) {
      syncWorkOrderToCloud(updatedTargetOrder);
    }
  };

  const issuePartToOrder = (orderId: string, partId: string, quantity: number): boolean => {
    const part = spareParts.find(p => p.id === partId);
    if (!part || part.quantity < quantity) {
      return false;
    }

    // Deduct part stock
    let updatedPartRecord: SparePart | null = null;
    setSpareParts(prev => prev.map(p => {
      if (p.id !== partId) return p;
      const up = { ...p, quantity: p.quantity - quantity };
      updatedPartRecord = up;
      return up;
    }));
    if (updatedPartRecord) {
      saveSparePartToFirestore(updatedPartRecord).catch(console.warn);
    }

    // Add to work order
    const usedPart: UsedPart = {
      partId: part.id,
      partName: part.name,
      partCode: part.code,
      quantity,
      unitPrice: part.unitPrice,
      totalPrice: part.unitPrice * quantity,
    };

    let updatedTargetOrder: WorkOrder | null = null;
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

      const merged = {
        ...wo,
        usedParts: newUsedParts,
        totalCost,
      };
      updatedTargetOrder = merged;
      return merged;
    }));

    if (updatedTargetOrder) {
      syncWorkOrderToCloud(updatedTargetOrder);
    }

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

  // Spare Parts Actions (คลังอะไหล่ - ลิงค์ Firebase อัตโนมัติ)
  const addSparePart = async (data: Omit<SparePart, 'id'>) => {
    const newPart: SparePart = {
      ...data,
      id: `sp-${Date.now().toString().slice(-5)}`,
    };
    setSpareParts(prev => [...prev, newPart]);
    await saveSparePartToFirestore(newPart);
  };

  const deleteSparePart = async (id: string) => {
    setSpareParts(prev => prev.filter(p => p.id !== id));
    await deleteSparePartFromFirestore(id);
  };

  const restockPart = async (id: string, quantity: number) => {
    const today = new Date().toISOString().slice(0, 10);
    let updatedPart: SparePart | null = null;
    setSpareParts(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = {
        ...p,
        quantity: p.quantity + quantity,
        lastRestockedDate: today,
      };
      updatedPart = updated;
      return updated;
    }));
    if (updatedPart) {
      await saveSparePartToFirestore(updatedPart);
    }
  };

  // Technician Actions (ทีมช่าง - ลิงค์ Firebase อัตโนมัติ)
  const addTechnician = async (techData: Omit<Technician, 'id' | 'activeTicketsCount' | 'completedTicketsCount'>) => {
    const newTech: Technician = {
      ...techData,
      id: `tech-${Date.now().toString().slice(-4)}`,
      activeTicketsCount: 0,
      completedTicketsCount: 0,
    };
    setTechnicians(prev => [newTech, ...prev]);
    await saveTechnicianToFirestore(newTech);
  };

  const deleteTechnician = async (id: string) => {
    setTechnicians(prev => prev.filter(t => t.id !== id));
    await deleteTechnicianFromFirestore(id);
  };

  const updateTechStatus = async (id: string, status: 'available' | 'busy' | 'leave') => {
    let updatedTech: Technician | null = null;
    setTechnicians(prev => prev.map(t => {
      if (t.id === id) {
        const up = { ...t, status };
        updatedTech = up;
        return up;
      }
      return t;
    }));
    if (updatedTech) {
      await saveTechnicianToFirestore(updatedTech);
    }
  };

  // User Actions (จัดการผู้ใช้ - ลิงค์ Firebase อัตโนมัติ)
  const updateUserStatus = async (id: string, status: 'active' | 'suspended') => {
    let updatedUser: SystemUser | null = null;
    setSystemUsers(prev => prev.map(u => {
      if (u.id === id) {
        const up = { ...u, status };
        updatedUser = up;
        return up;
      }
      return u;
    }));
    if (updatedUser) {
      await saveUserToFirestore(updatedUser);
    }
  };

  const resetAllData = () => {
    localStorage.removeItem('skh_assets');
    localStorage.removeItem('skh_work_orders');
    localStorage.removeItem('skh_pm_records');
    localStorage.removeItem('skh_spare_parts');
    localStorage.removeItem('skh_technicians');
    localStorage.removeItem('skh_system_users');
    setAssets([]);
    setWorkOrders([]);
    setPmRecords([]);
    setSpareParts([]);
    setTechnicians([]);
    setSystemUsers([DEFAULT_ADMIN_USER]);
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
        deleteSparePart,
        restockPart,
        addTechnician,
        deleteTechnician,
        updateTechStatus,
        updateUserStatus,
        currentUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        login,
        logout,
        registerUser,
        addUserByAdmin,
        deleteUser,
        approveUser,
        updateUserPermissions,
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

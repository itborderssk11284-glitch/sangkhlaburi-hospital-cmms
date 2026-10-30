import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/navigation/Sidebar';
import { TopBar } from './components/navigation/TopBar';
import { AnalyticsDashboard } from './components/dashboard/AnalyticsDashboard';
import { AssetManagement } from './components/assets/AssetManagement';
import { WorkOrderManagement } from './components/work-orders/WorkOrderManagement';
import { PMCalibrationManagement } from './components/pm/PMCalibrationManagement';
import { InventoryManagement } from './components/inventory/InventoryManagement';
import { WorkforceManagement } from './components/workforce/WorkforceManagement';
import { ReportsManagement } from './components/reports/ReportsManagement';
import { NewRepairModal } from './components/work-orders/NewRepairModal';
import { AssetDetailModal } from './components/assets/AssetDetailModal';
import { PrintableWorkOrder } from './components/common/PrintableWorkOrder';
import { PrintableQRBadge } from './components/common/PrintableQRBadge';
import { PrintableAssetLedger } from './components/common/PrintableAssetLedger';
import { Asset } from './types';

function MainContent() {
  const { 
    activeTab, 
    assets,
    selectedAssetForDetail, 
    setSelectedAssetForDetail, 
    selectedOrderForPrint, 
    setSelectedOrderForPrint,
    selectedAssetForQR, 
    setSelectedAssetForQR,
    selectedAssetForLedger,
    setSelectedAssetForLedger
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewRepairModalOpen, setIsNewRepairModalOpen] = useState(false);
  const [targetAssetForRepair, setTargetAssetForRepair] = useState<Asset | null>(null);

  const handleOpenRepairForAsset = (asset: Asset) => {
    setTargetAssetForRepair(asset);
    setIsNewRepairModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      {/* Modern Left Sidebar */}
      <Sidebar
        onOpenNewRepairModal={() => {
          setTargetAssetForRepair(null);
          setIsNewRepairModalOpen(true);
        }}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Container offset by sidebar width on desktop */}
      <div className="md:pl-72 flex-1 flex flex-col min-h-screen">
        {/* Top Bar Navigation Controls */}
        <TopBar
          onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
          onOpenNewRepairModal={() => {
            setTargetAssetForRepair(null);
            setIsNewRepairModalOpen(true);
          }}
        />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {activeTab === 'dashboard' && <AnalyticsDashboard />}
        {activeTab === 'assets' && (
          <AssetManagement 
            onOpenNewRepairForAsset={handleOpenRepairForAsset} 
          />
        )}
        {activeTab === 'work-orders' && (
          <WorkOrderManagement 
            onOpenNewRepairModal={() => {
              setTargetAssetForRepair(null);
              setIsNewRepairModalOpen(true);
            }} 
          />
        )}
        {activeTab === 'pm-calibration' && <PMCalibrationManagement />}
        {activeTab === 'inventory' && <InventoryManagement />}
        {activeTab === 'workforce' && <WorkforceManagement />}
        {activeTab === 'reports' && <ReportsManagement />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img 
              src="/assets/aistudio/Logo_SK_-_______26693d5e.png" 
              alt="Logo"
              className="w-7 h-7 object-contain"
            />
            <div>
              <p className="font-semibold text-slate-800">
                โรงพยาบาลสังขละบุรี · Sangkhlaburi Hospital CMMS
              </p>
              <p className="text-[11px] text-slate-500">
                กลุ่มงานบริหารทั่วไปและงานซ่อมบำรุงวิศวกรรมการแพทย์ โทรศัพท์ 034-595021 ต่อ 141
              </p>
            </div>
          </div>

          <div className="text-right text-[11px] text-slate-400">
            ระบบบริหารจัดการงานซ่อมบำรุงครุภัณฑ์ออนไลน์ · มาตรฐานความปลอดภัยเครื่องมือแพทย์ สธ.
          </div>
        </div>
      </footer>
      </div>

      {/* Modals & Overlays */}
      {isNewRepairModalOpen && (
        <NewRepairModal
          initialAsset={targetAssetForRepair}
          onClose={() => {
            setIsNewRepairModalOpen(false);
            setTargetAssetForRepair(null);
          }}
        />
      )}

      {selectedAssetForDetail && (
        <AssetDetailModal
          asset={selectedAssetForDetail}
          onClose={() => setSelectedAssetForDetail(null)}
          onOpenQRBadge={(ast) => {
            setSelectedAssetForDetail(null);
            setSelectedAssetForQR(ast);
          }}
          onOpenNewRepairForAsset={(ast) => {
            setSelectedAssetForDetail(null);
            handleOpenRepairForAsset(ast);
          }}
        />
      )}

      {selectedOrderForPrint && (
        <PrintableWorkOrder
          order={selectedOrderForPrint}
          asset={assets.find(a => a.id === selectedOrderForPrint.assetId || a.code === selectedOrderForPrint.assetCode)}
          onClose={() => setSelectedOrderForPrint(null)}
        />
      )}

      {selectedAssetForQR && (
        <PrintableQRBadge
          asset={selectedAssetForQR}
          onClose={() => setSelectedAssetForQR(null)}
        />
      )}

      {selectedAssetForLedger && (
        <PrintableAssetLedger
          asset={selectedAssetForLedger}
          onClose={() => setSelectedAssetForLedger(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

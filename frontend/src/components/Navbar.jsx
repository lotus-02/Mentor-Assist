import React from 'react';
import { 
  Scale, 
  BookOpen, 
  Activity, 
  Layers, 
  Cpu, 
  Users, 
  FileSpreadsheet, 
  Sliders, 
  RefreshCw,
  Trash2,
  Database,
  LayoutDashboard,
  UploadCloud,
  Sun,
  Moon
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  backendHealthy, 
  isRefreshing, 
  onRefresh,
  cohortCount = 0,
  budgetSelected = 0,
  cohortName = null,
  onClearCohort,
  onLoadDemo,
  onUploadCsv,
  theme = 'light',
  onToggleTheme
}) {
  const tabs = [
    { id: 'batch', label: 'Dashboard & Intake', icon: LayoutDashboard },
    { id: 'ranker', label: 'Prioritized Student Queue', icon: Users },
    { id: 'scorecard', label: '100-Point Scorecard', icon: Activity },
    { id: 'fairness', label: 'Subgroup Fairness', icon: Layers },
    { id: 'xai', label: 'Explainable AI & Audit', icon: Cpu },
    { id: 'simulator', label: 'Intervention Tools', icon: Sliders },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      {/* Top tier brand and status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Brand matching User Image */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 p-0.5 shadow-sm">
              <div className="w-full h-full bg-white rounded-[9px] flex items-center justify-center text-blue-700">
                <BookOpen className="w-5 h-5 stroke-[2.2]" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-sans">
                  MentorAssist
                </h1>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Fair Student-Support Prioritization & Allocation Platform
              </p>
            </div>
          </div>

          {/* Quick Metrics & Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Live Engine Status Badge */}
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
              backendHealthy 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${backendHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span>{backendHealthy ? 'Engine Active' : 'Connecting...'}</span>
            </div>

            {/* Active Cohort Status Indicator */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium">
              <span className="text-slate-500">Active Cohort:</span>
              {cohortCount > 0 ? (
                <span className="font-mono font-bold text-blue-700">
                  {cohortCount} Students ({budgetSelected} in 20% Budget)
                </span>
              ) : (
                <span className="font-mono text-amber-600 font-semibold">
                  0 Students (Awaiting Upload)
                </span>
              )}
            </div>

            {/* Direct Upload CSV button in Navbar */}
            <button
              onClick={onUploadCsv}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              title="Open File Picker to Upload Student CSV"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload CSV</span>
            </button>

            {/* Reset to 0 Data button (if data loaded) */}
            {cohortCount > 0 ? (
              <button
                onClick={onClearCohort}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer"
                title="Clear loaded student data and reset back to 0"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Reset to 0 Data</span>
              </button>
            ) : (
              <button
                onClick={onLoadDemo}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                title="Load 395 Benchmark student records for testing"
              >
                <Database className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Load Demo (395)</span>
              </button>
            )}

            {/* Refresh button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium transition-colors shadow-xs cursor-pointer"
              title="Sync ML Model State"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>

            {/* Subtle Divider */}
            <div className="h-5 w-px bg-slate-200 hidden sm:block" />

            {/* Right Side Top Corner: Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                theme === 'dark'
                  ? 'bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border-amber-400/40'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
              title={theme === 'dark' ? "Switch to White Theme" : "Switch to Dark Theme"}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                  <span className="font-bold">White Theme</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600 fill-slate-600/20" />
                  <span className="font-bold">Dark Theme</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 overflow-x-auto no-scrollbar border-t border-slate-200 py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border-b-2 border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}

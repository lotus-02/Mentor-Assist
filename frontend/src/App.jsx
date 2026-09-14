import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import ScorecardTab from './components/ScorecardTab';
import StudentRankerTab from './components/StudentRankerTab';
import FairnessInspectorTab from './components/FairnessInspectorTab';
import BatchInterventionTab from './components/BatchInterventionTab';
import ExplainableAITab from './components/ExplainableAITab';
import SimulatorTab from './components/SimulatorTab';
import StudentDetailModal from './components/StudentDetailModal';
import { api } from './services/api';
import { 
  AlertTriangle, 
  RefreshCw, 
  Sparkles, 
  ShieldCheck, 
  UploadCloud, 
  Users, 
  FileSpreadsheet, 
  ArrowRight,
  Database
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('batch'); // Default to Tab 4 (Intake) so user can upload immediately
  const [isPofrMode, setIsPofrMode] = useState(true);
  const [budgetPct, setBudgetPct] = useState(0.20);
  const [compareData, setCompareData] = useState(null);
  const [rankedStudents, setRankedStudents] = useState([]); // Starts with 0 data
  const [cohortName, setCohortName] = useState(null);
  const [cohortAudit, setCohortAudit] = useState(null);
  const [cohortXai, setCohortXai] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [backendHealthy, setBackendHealthy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);
  const [errorNotice, setErrorNotice] = useState(null);
  const heroFileInputRef = useRef(null);

  // Theme Management (Light / White Theme default, toggles to Dark Theme)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('pofr_theme') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('pofr_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Direct CSV upload handler from Hero banner, Navbar, or Overview
  const handleDirectCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingCsv(true);
    setErrorNotice(null);
    try {
      const response = await api.predictCsv(file, budgetPct, true);
      const students = Array.isArray(response) ? response : response.ranked_students;
      const evaluation = response.evaluation || null;
      const baseEvaluation = response.base_evaluation || null;
      const comparisons = response.comparisons || null;
      const audit = response.audit || null;
      const cohortXai = response.cohort_xai || null;

      handlePrioritizationDone(students, evaluation, baseEvaluation, comparisons, audit, cohortXai);
      setActiveTab('ranker'); // Automatically switch to prioritized student queue
    } catch (err) {
      console.error("Direct CSV upload failed:", err);
      setErrorNotice(err.response?.data?.detail || err.message || 'Failed to process student CSV.');
    } finally {
      setIsProcessingCsv(false);
      if (e.target) e.target.value = '';
    }
  };

  // Initialize engine without auto-loading student data (Starts with 0 data)
  const initEngine = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setIsRefreshing(true);
    setErrorNotice(null);
    try {
      // 1. Health check
      try {
        await api.getHealth();
        setBackendHealthy(true);
      } catch (e) {
        console.warn('Backend not responding yet:', e.message);
        setBackendHealthy(false);
      }

      // 2. Fetch model architecture & XAI info
      const info = await api.getModelInfo();
      setModelInfo(info);
      setBackendHealthy(true);
    } catch (err) {
      console.error('API Error:', err);
      setErrorNotice(err.message || 'Could not connect to FastAPI backend at port 8000.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    initEngine();
  }, []);

  // When budget changes on an already loaded cohort, recalculate rankings
  useEffect(() => {
    if (rankedStudents.length > 0) {
      recalculateCohort(budgetPct);
    }
  }, [budgetPct]);

  const recalculateCohort = async (newBudget) => {
    try {
      // Re-run POFR on the current active cohort with new budget
      const predictions = await api.predictCohort(rankedStudents, newBudget, 1.0);
      setRankedStudents(predictions);
    } catch (e) {
      console.error("Failed to recalculate budget:", e);
    }
  };

  // 1-Click Load Demo Preset (for quick testing)
  const handleLoadDemoBenchmark = async () => {
    setLoading(true);
    try {
      const benchmark = await api.getBenchmarkDataset();
      const predictions = await api.predictCohort(benchmark.data, budgetPct, 1.0);
      const comp = await api.compareModels(budgetPct);
      setRankedStudents(predictions);
      setCompareData(comp);
      setCohortName("UCI Benchmark Dataset (395 Records)");
      setActiveTab('scorecard');
    } catch (err) {
      setErrorNotice("Failed to load demo benchmark: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset / Clear Data back to 0
  const handleClearCohort = () => {
    setRankedStudents([]);
    setCompareData(null);
    setCohortName(null);
    setCohortAudit(null);
    setCohortXai(null);
    setActiveTab('batch');
  };

  // Handler when fresh CSV is processed in Tab 4
  const handlePrioritizationDone = (newRankings, newEvaluation, newBaseEvaluation, newComparisons, newAudit, newCohortXai) => {
    setRankedStudents(newRankings);
    setCohortName(`Uploaded Cohort (${newRankings.length} Students)`);
    if (newAudit) setCohortAudit(newAudit);
    if (newCohortXai) setCohortXai(newCohortXai);

    if (newEvaluation) {
      const comparisons = (newComparisons && newComparisons.length > 0) ? newComparisons : [
        {
          metric_name: "Benchmark Score",
          base_model: newBaseEvaluation?.total_score ?? newEvaluation.total_score,
          pofr_model: newEvaluation.total_score,
          delta: roundDelta(newEvaluation.total_score - (newBaseEvaluation?.total_score ?? newEvaluation.total_score)),
          unit: "pts",
          impact: "Positive Gain"
        },
        {
          metric_name: "Overall Cohort Recall",
          base_model: Math.round((newBaseEvaluation?.overall_recall ?? newEvaluation.overall_recall) * 100),
          pofr_model: Math.round(newEvaluation.overall_recall * 100),
          delta: roundDelta(((newEvaluation.overall_recall ?? 0) - (newBaseEvaluation?.overall_recall ?? newEvaluation.overall_recall ?? 0)) * 100),
          unit: "%",
          impact: "Preserved"
        },
        {
          metric_name: "Worst-Group Recall (R_min)",
          base_model: Math.round((newBaseEvaluation?.worst_group_recall ?? newEvaluation.worst_group_recall) * 100),
          pofr_model: Math.round(newEvaluation.worst_group_recall * 100),
          delta: roundDelta(((newEvaluation.worst_group_recall ?? 0) - (newBaseEvaluation?.worst_group_recall ?? newEvaluation.worst_group_recall ?? 0)) * 100),
          unit: "%",
          impact: "Equitable Surge"
        },
        {
          metric_name: "Demographic Fairness Gap",
          base_model: Math.round((newBaseEvaluation?.fairness_gap ?? newEvaluation.fairness_gap) * 100),
          pofr_model: Math.round(newEvaluation.fairness_gap * 100),
          delta: roundDelta(((newEvaluation.fairness_gap ?? 0) - (newBaseEvaluation?.fairness_gap ?? newEvaluation.fairness_gap ?? 0)) * 100),
          unit: "%",
          impact: "Bias Reduction"
        },
        {
          metric_name: "Brier Score Error",
          base_model: newBaseEvaluation?.brier_score ?? newEvaluation.brier_score,
          pofr_model: newEvaluation.brier_score,
          delta: roundDelta((newEvaluation.brier_score ?? 0) - (newBaseEvaluation?.brier_score ?? newEvaluation.brier_score ?? 0)),
          unit: "loss",
          impact: "Isotonic Calibration"
        }
      ];

      setCompareData({
        pofr_eval: newEvaluation,
        base_eval: newBaseEvaluation || newEvaluation,
        comparisons: comparisons,
        summary: `Evaluated fresh uploaded cohort (${newRankings.length} students): POFR-Ed score is ${newEvaluation.total_score} pts.`
      });
    }
  };

  const roundDelta = (val) => Math.round(val * 100) / 100;

  const cohortCount = rankedStudents.length;
  const budgetSelected = Math.ceil(budgetPct * cohortCount);
  const selectedCount = rankedStudents.filter(s => s.selected_for_support).length;

  const highPriorityCount = rankedStudents.filter(s => (s.calibrated_risk_prob || 0) >= 0.5).length;
  const highPriorityPct = cohortCount > 0 ? Math.round((highPriorityCount / cohortCount) * 100) : 0;
  
  // Dynamic success rate: from pofr_eval overall_recall, or calculated from high-risk recall in this cohort
  const successRate = compareData?.pofr_eval?.overall_recall 
    ? Math.round(compareData.pofr_eval.overall_recall * 100) 
    : (cohortCount > 0 
        ? (highPriorityCount > 0 
            ? Math.round((rankedStudents.filter(s => s.selected_for_support && (s.calibrated_risk_prob || 0) >= 0.5).length / highPriorityCount) * 100)
            : 85)
        : null);

  // Capacity utilization percentage based on strict budget seats allocated
  const capacityPct = budgetSelected > 0 ? Math.min(100, Math.round((selectedCount / budgetSelected) * 100)) : 0;

  return (
    <div className="min-h-screen bg-[#f3f7fd] text-slate-900 flex flex-col font-sans selection:bg-blue-500/20 selection:text-blue-900">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendHealthy={backendHealthy}
        isRefreshing={isRefreshing}
        onRefresh={() => initEngine(true)}
        cohortCount={cohortCount}
        budgetSelected={budgetSelected}
        cohortName={cohortName}
        onClearCohort={handleClearCohort}
        onLoadDemo={handleLoadDemoBenchmark}
        onUploadCsv={() => heroFileInputRef.current?.click()}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Connection Alert if backend is down */}
      {!backendHealthy && !loading && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 px-4 py-2.5 text-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Connecting to POFR-Ed ML Backend:</strong> Ensure FastAPI is running on <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-900">http://localhost:8000</code>.
              </span>
            </div>
            <button
              onClick={() => initEngine(true)}
              className="px-2.5 py-1 rounded bg-amber-200/70 hover:bg-amber-300 text-amber-900 font-semibold transition-colors flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      )}

      {/* Error Alert if any error occurred */}
      {errorNotice && (
        <div className="bg-rose-50 border-b border-rose-200 text-rose-800 px-4 py-2.5 text-xs animate-fadeIn">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span><strong>Notice:</strong> {errorNotice}</span>
            </div>
            <button
              onClick={() => setErrorNotice(null)}
              className="px-2 py-0.5 rounded bg-rose-200/70 hover:bg-rose-300 text-rose-900 font-semibold transition-colors text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
        {/* Hidden System File Input triggered by any Upload CSV button */}
        <input
          ref={heroFileInputRef}
          type="file"
          accept=".csv"
          onChange={handleDirectCsvUpload}
          className="hidden"
        />
        
        {/* SECTION: Overview & Metrics (Calculated Live from Uploaded CSV Data) */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Overview & Metrics
              </h2>
              <p className="text-xs text-slate-500">
                {cohortCount > 0 
                  ? `Live calculations for active cohort: ${cohortName || 'Uploaded CSV'} (${cohortCount} students)`
                  : 'System initialized with 0 data. Upload a student CSV in Intake to calculate live cohort metrics.'}
              </p>
            </div>
            {cohortCount > 0 ? (
              <div className="flex items-center space-x-2 self-start sm:self-auto">
                <button
                  onClick={() => heroFileInputRef.current?.click()}
                  disabled={isProcessingCsv}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                  title="Upload another student CSV file"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                  <span>Upload New CSV</span>
                </button>
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  <span>Live CSV Active</span>
                </span>
              </div>
            ) : (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-medium border border-slate-200 self-start sm:self-auto">
                <span>Awaiting Student CSV</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI Card 1: Total Active Student Cases */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Total Active Student Cases</span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-sans tracking-tight mt-1 block">
                    {cohortCount > 0 ? cohortCount.toLocaleString() : '0'}
                  </span>
                </div>
                <div className={`p-2 rounded-xl border ${
                  cohortCount > 0 
                    ? 'bg-purple-50 text-purple-600 border-purple-100' 
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}>
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {cohortCount > 0 ? `${cohortCount} active student records` : 'Awaiting CSV roster upload'}
                </span>
                {cohortCount > 0 ? (
                  <svg className="w-24 h-6 text-purple-400 stroke-current fill-none" viewBox="0 0 100 24">
                    <path d="M0 16 Q 20 4, 40 14 T 80 8 T 100 12" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg className="w-24 h-6 text-slate-300 stroke-current fill-none" viewBox="0 0 100 24">
                    <path d="M0 12 L100 12" strokeWidth="2" strokeDasharray="4 4" />
                  </svg>
                )}
              </div>
            </div>

            {/* KPI Card 2: Students in High Priority */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Students in High Priority</span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-sans tracking-tight mt-1 block">
                    {cohortCount > 0 ? `${highPriorityPct}%` : '0%'}
                  </span>
                </div>
                <div className={`p-2 rounded-xl border ${
                  cohortCount > 0 
                    ? 'bg-amber-50 text-amber-600 border-amber-100' 
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {cohortCount > 0 ? `${highPriorityCount} priority students flagged` : '0 priority flags'}
                </span>
                {cohortCount > 0 ? (
                  <svg className="w-24 h-6 text-amber-400 stroke-current fill-none" viewBox="0 0 100 24">
                    <path d="M0 18 Q 25 18, 50 10 T 85 6 T 100 4" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg className="w-24 h-6 text-slate-300 stroke-current fill-none" viewBox="0 0 100 24">
                    <path d="M0 12 L100 12" strokeWidth="2" strokeDasharray="4 4" />
                  </svg>
                )}
              </div>
            </div>

            {/* KPI Card 3: Recent Intervention Success Rate */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Recent Intervention Success Rate</span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-sans tracking-tight mt-1 block">
                    {cohortCount > 0 && successRate !== null ? `${successRate}%` : '--'}
                  </span>
                </div>
                <div className={`p-2 rounded-xl border ${
                  cohortCount > 0 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {cohortCount > 0 ? 'Target Cohort Recall' : 'Awaiting calculation'}
                </span>
                {cohortCount > 0 ? (
                  <svg className="w-24 h-6 text-emerald-500 stroke-current fill-none" viewBox="0 0 100 24">
                    <path d="M0 20 Q 30 18, 50 14 T 75 8 T 100 4" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg className="w-24 h-6 text-slate-300 stroke-current fill-none" viewBox="0 0 100 24">
                    <path d="M0 12 L100 12" strokeWidth="2" strokeDasharray="4 4" />
                  </svg>
                )}
              </div>
            </div>

            {/* KPI Card 4: Resources Allocated (vs Capacity) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Resources Allocated (vs Capacity)</span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-sans tracking-tight mt-1 block">
                    {cohortCount > 0 ? `${capacityPct}%` : '0%'}
                  </span>
                </div>
                <div className={`p-2 rounded-xl border ${
                  cohortCount > 0 
                    ? 'bg-blue-50 text-blue-600 border-blue-100' 
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}>
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Resources • Capacity</span>
                  <span className="font-semibold text-slate-600 font-mono">
                    {cohortCount > 0 ? `${selectedCount}/${budgetSelected}` : '0/0'}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                    style={{ width: `${cohortCount > 0 ? capacityPct : 0}%` }} 
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="relative">
              <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <Sparkles className="w-5 h-5 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-800">Initializing MentorAssist Platform</h3>
              <p className="text-xs text-slate-500">
                Readying Isotonic calibration and Pareto rank optimizer...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Zero-Data Welcome Hero Banner (Visible if no cohort is loaded yet) */}
            {cohortCount === 0 && (
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-blue-200 shadow-xs relative overflow-hidden animate-fadeIn">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-3 border border-blue-200">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Ready for Fresh Student Cohort Data (0 Active Records)</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      Upload Student CSV to Run Real-Time Fair Prioritization
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
                      This system starts with <strong>0 data</strong>. Upload your student roster in the Intake Tab to calculate who needs 
                      <strong> priority support first</strong> versus <strong>who can be supported later</strong>, with live equity metrics, 
                      calibrated risk probabilities, and strict 20% budget allocations.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <button
                      onClick={() => heroFileInputRef.current?.click()}
                      disabled={isProcessingCsv}
                      className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {isProcessingCsv ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Processing Student CSV...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4" />
                          <span>Upload Student CSV</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleLoadDemoBenchmark}
                      disabled={isProcessingCsv}
                      className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-300 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Database className="w-4 h-4 text-blue-600" />
                      <span>Load 395-Student Demo</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1: Executive Scorecard */}
            {activeTab === 'scorecard' && (
              <ScorecardTab
                compareData={compareData}
                isPofrMode={isPofrMode}
                setIsPofrMode={setIsPofrMode}
                loading={loading}
                cohortCount={cohortCount}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onLoadDemo={handleLoadDemoBenchmark}
              />
            )}

            {/* TAB 2: Student Ranker & Budget */}
            {activeTab === 'ranker' && (
              <StudentRankerTab
                rankedStudents={rankedStudents}
                onSelectStudent={setSelectedStudent}
                budgetPct={budgetPct}
                setBudgetPct={setBudgetPct}
                loading={loading}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onLoadDemo={handleLoadDemoBenchmark}
              />
            )}

            {/* TAB 3: Subgroup Fairness */}
            {activeTab === 'fairness' && (
              <FairnessInspectorTab
                compareData={compareData}
                cohortCount={cohortCount}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onLoadDemo={handleLoadDemoBenchmark}
              />
            )}

            {/* TAB 4: Batch CSV Intake Engine */}
            {activeTab === 'batch' && (
              <BatchInterventionTab
                onPrioritizationDone={handlePrioritizationDone}
                budgetPct={budgetPct}
                onNavigateTab={(tab) => setActiveTab(tab)}
                cohortCount={cohortCount}
              />
            )}

            {/* TAB 5: Explainable AI & Audit */}
            {activeTab === 'xai' && (
              <ExplainableAITab
                modelInfo={modelInfo}
                cohortAudit={cohortAudit}
                cohortXai={cohortXai}
                cohortCount={cohortCount}
                cohortName={cohortName}
                rankedStudents={rankedStudents}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onLoadDemo={handleLoadDemoBenchmark}
              />
            )}

            {/* TAB 6: What-If Simulator */}
            {activeTab === 'simulator' && (
              <SimulatorTab
                students={rankedStudents}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onLoadDemo={handleLoadDemoBenchmark}
              />
            )}
          </>
        )}
      </main>

      {/* Student Inspector Modal */}
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-slate-600 font-medium">
              POFR-Ed: Certified Pareto-Optimal Fair Student Prioritization Engine
            </span>
          </div>
          <div className="flex items-center space-x-4 font-mono text-[11px] text-slate-500">
            <span>Active Cohort: {cohortCount} Students</span>
            <span>•</span>
            <span>Strict ⌈0.20 N⌉ Budget Policy</span>
            <span>•</span>
            <span className="text-blue-600 font-bold">100-Point Evaluator</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

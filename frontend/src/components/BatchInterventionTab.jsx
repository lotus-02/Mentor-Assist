import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Play, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  RefreshCw,
  FileCheck,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Scale,
  Award,
  Users
} from 'lucide-react';
import { api } from '../services/api';

export default function BatchInterventionTab({ onPrioritizationDone, budgetPct = 0.20, onNavigateTab }) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedResults, setProcessedResults] = useState(null);
  const [evalResult, setEvalResult] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processSelectedFile = async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await api.predictCsv(selectedFile, budgetPct, true);
      
      const students = Array.isArray(response) ? response : response.ranked_students;
      const evaluation = response.evaluation || null;
      const baseEvaluation = response.base_evaluation || null;
      const comparisons = response.comparisons || null;
      
      const audit = response.audit || null;
      const cohortXai = response.cohort_xai || null;
      
      setProcessedResults(students);
      if (evaluation) {
        setEvalResult(evaluation);
      } else {
        setEvalResult(null);
      }
      
      const selected = students.filter(s => s.selected_for_support).length;
      setSuccessMessage(`Successfully calculated prioritization for ${students.length} students! Strictly selected ${selected} students.`);
      
      if (onPrioritizationDone) {
        onPrioritizationDone(students, evaluation, baseEvaluation, comparisons, audit, cohortXai);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to process CSV file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleLoadBenchmarkPreset = async () => {
    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const benchmarkData = await api.getBenchmarkDataset();
      const predictions = await api.predictCohort(benchmarkData.data, budgetPct, 1.0);
      const comp = await api.compareModels(budgetPct);
      setProcessedResults(predictions);
      setEvalResult(comp.pofr_eval);
      setSuccessMessage(`Loaded canonical UCI Benchmark dataset (395 students). Strictly selected ${Math.ceil(budgetPct * 395)} students.`);
      if (onPrioritizationDone) {
        onPrioritizationDone(predictions, comp.pofr_eval, comp.base_eval, comp.comparisons);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to process benchmark cohort.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunPrioritization = async () => {
    if (!file) {
      setError('Please choose a CSV file or click "Load UCI Benchmark Preset" first.');
      return;
    }
    await processSelectedFile(file);
  };

  const downloadPrioritizedCsv = () => {
    if (!processedResults || processedResults.length === 0) return;
    
    const headers = [
      'Rank', 
      'Student_ID', 
      'Priority_Order',
      'Priority_Tier',
      'School', 
      'Sex', 
      'Age', 
      'G1', 
      'G2', 
      'Grade_Velocity', 
      'Absences', 
      'StudyTime', 
      'Failures',
      'Calibrated_Risk_Probability', 
      'POFR_Composite_Score', 
      'Selected_For_Support'
    ];
    
    const rows = processedResults.map(s => [
      s.rank,
      s.id,
      s.priority_order || (s.selected_for_support ? 'First' : 'Later'),
      s.priority_tier || (s.selected_for_support ? 'Priority 1 (First)' : 'Priority 3 (Later)'),
      s.school,
      s.sex,
      s.age,
      s.G1,
      s.G2,
      s.grade_velocity,
      s.absences !== undefined ? s.absences : '',
      s.studytime !== undefined ? s.studytime : '',
      s.failures !== undefined ? s.failures : '',
      s.calibrated_risk_prob,
      s.pofr_score,
      s.selected_for_support ? 'YES' : 'NO'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pofr_ed_academic_intervention_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedCount = processedResults ? processedResults.filter(s => s.selected_for_support).length : 0;
  const criticalCount = processedResults ? processedResults.filter(s => (s.calibrated_risk_prob || 0) >= 0.5).length : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Cohort Intake & Batch Processing</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Batch CSV Student Intervention Engine
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Upload any fresh cohort data (<code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono border border-blue-100">student-mat.csv</code> or custom student roster). 
              POFR-Ed runs feature extraction, Isotonic calibration, Pareto rank optimization, and outputs a certified intervention roster.
            </p>
          </div>

          <button
            onClick={handleLoadBenchmarkPreset}
            disabled={isProcessing}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-all shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Load UCI Benchmark Preset (395 Records)</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Upload Zone + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[200px] ${
              isProcessing
                ? 'border-blue-400 bg-blue-50/50 cursor-wait'
                : dragActive 
                ? 'border-blue-500 bg-blue-50/40' 
                : file 
                ? 'border-blue-300 bg-blue-50/20' 
                : 'border-slate-300 hover:border-blue-400 bg-slate-50/50'
            }`}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".csv"
              onClick={(e) => { e.target.value = ''; }}
              onChange={handleChange}
              className="hidden" 
            />

            {isProcessing ? (
              <div className="flex flex-col items-center space-y-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Processing & Prioritizing Roster...</h4>
                <p className="text-xs text-slate-500">
                  Parsing CSV, calibrating probabilities, and enforcing 20% budget constraints
                </p>
              </div>
            ) : file ? (
              <div className="flex flex-col items-center space-y-2 text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center border border-blue-200">
                  <FileCheck className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">{file.name}</h4>
                <p className="text-xs text-slate-500 font-mono">
                  {(file.size / 1024).toFixed(1)} KB • Prioritization Complete
                </p>
                <span className="text-[10px] text-blue-600 font-semibold underline pt-1">Click to replace or upload another CSV</span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1 border border-blue-100">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Drag and drop student roster CSV here
                </h4>
                <p className="text-xs text-slate-500">
                  Supports semicolon <code className="text-slate-700 font-mono">;</code> or comma <code className="text-slate-700 font-mono">,</code> delimited files (with or without G3)
                </p>
                <span className="text-xs font-semibold text-blue-600 mt-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-200">
                  Browse Local Files
                </span>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Action Bar */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Auto-detection for Delimiters, Encodings & Leakage Protection</span>
            </div>

            <button
              onClick={handleRunPrioritization}
              disabled={isProcessing || !file}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isProcessing || !file
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Computing POFR Optimization...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Run POFR-Ed Prioritization</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Processing Summary Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              Intervention Allocation Status
            </h3>

            {processedResults ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                    Calculations Active & Certified
                  </span>
                  <div className="mt-2 flex items-baseline space-x-2">
                    <span className="text-3xl font-black font-sans text-slate-900">
                      {selectedCount}
                    </span>
                    <span className="text-xs text-slate-500">
                      / {processedResults.length} students selected
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    Strict <code className="text-blue-700 font-mono font-semibold">⌈0.20 N⌉</code> budget quota enforced.
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Cohort Size:</span>
                    <span className="font-mono text-slate-900 font-semibold">{processedResults.length}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Support Seats (20%):</span>
                    <span className="font-mono text-blue-600 font-bold">{selectedCount}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">High Risk Students:</span>
                    <span className="font-mono text-amber-600 font-bold">{criticalCount}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                Upload a CSV or load the benchmark preset to calculate student rankings and download prioritized rosters.
              </div>
            )}
          </div>

          {processedResults && (
            <div className="space-y-2 mt-6">
              <button
                onClick={downloadPrioritizedCsv}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors shadow-2xs"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Download Prioritized CSV</span>
              </button>

              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('ranker')}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-md shadow-blue-500/20"
                >
                  <Users className="w-4 h-4" />
                  <span>Explore in Student Ranker Tab</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* If Uploaded Dataset contains G3 (Ground Truth), Show 100-Point Scorecard for this Cohort */}
      {evalResult && (
        <div className="bg-white p-6 rounded-2xl border border-blue-200/80 shadow-xs animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Uploaded Cohort 100-Point Benchmark Evaluation
                </h3>
                <p className="text-xs text-slate-500">
                  {evalResult.model_type || 'Evaluated exact competition metrics for this specific cohort.'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('scorecard')}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-all shadow-2xs"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>View Full Scorecard & Radar</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
              <div className="text-right">
                <span className="text-xs uppercase text-slate-400 block font-medium">Total Benchmark Score</span>
                <span className="text-3xl font-black font-sans text-blue-600">
                  {evalResult.total_score} <span className="text-xs text-slate-400 font-normal">/ 100 pts</span>
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] uppercase text-slate-500 font-semibold block">Overall Recall (Top 20%)</span>
              <span className="text-base font-bold font-sans text-slate-900 mt-0.5 block">
                {Math.round(evalResult.overall_recall * 1000) / 10}%
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] uppercase text-slate-500 font-semibold block">Worst-Group Recall (R_min)</span>
              <span className="text-base font-bold font-sans text-blue-700 mt-0.5 block">
                {Math.round(evalResult.worst_group_recall * 1000) / 10}%
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] uppercase text-slate-500 font-semibold block">Demographic Fairness Gap</span>
              <span className="text-base font-bold font-sans text-emerald-700 mt-0.5 block">
                Gap: {Math.round(evalResult.fairness_gap * 1000) / 10}%
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] uppercase text-slate-500 font-semibold block">Brier Calibration Score</span>
              <span className="text-base font-bold font-mono text-slate-800 mt-0.5 block">
                {evalResult.brier_score}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* In-Place Live Table Preview for Processed Data */}
      {processedResults && processedResults.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Calculated Cohort Prioritization Preview
              </h3>
              <p className="text-xs text-slate-500">
                Displaying top prioritized students from uploaded file (showing top 10 of {processedResults.length})
              </p>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('ranker')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1"
              >
                <span>View Full Table in Tab 2</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Student ID</th>
                  <th className="py-2.5 px-2">Sex</th>
                  <th className="py-2.5 px-2">School</th>
                  <th className="py-2.5 px-2 text-center">G1</th>
                  <th className="py-2.5 px-2 text-center">G2</th>
                  <th className="py-2.5 px-2 text-center">Velocity</th>
                  <th className="py-2.5 px-3">Calibrated Risk</th>
                  <th className="py-2.5 px-3">POFR Score</th>
                  <th className="py-2.5 px-3 text-center">Support Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {processedResults.slice(0, 10).map((s) => (
                  <tr key={s.id} className={s.selected_for_support ? 'bg-blue-50/30 font-medium' : 'hover:bg-slate-50/50'}>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-600">#{s.rank}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">{s.id}</td>
                    <td className="py-2.5 px-2 text-slate-600">{s.sex}</td>
                    <td className="py-2.5 px-2 text-slate-600">{s.school}</td>
                    <td className="py-2.5 px-2 text-center font-mono">{s.G1}</td>
                    <td className="py-2.5 px-2 text-center font-mono font-semibold">{s.G2}</td>
                    <td className="py-2.5 px-2 text-center font-mono">
                      <span className={s.grade_velocity < 0 ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                        {s.grade_velocity > 0 ? `+${s.grade_velocity}` : s.grade_velocity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-800 font-semibold">{s.calibrated_risk_prob}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{s.pofr_score}</td>
                    <td className="py-2.5 px-3 text-center">
                      {s.selected_for_support ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Selected (Top 20%)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] text-slate-400 bg-slate-100">
                          Unselected
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

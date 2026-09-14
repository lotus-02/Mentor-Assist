import React, { useState } from 'react';
import { 
  Sliders, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Calendar, 
  GraduationCap,
  TrendingDown,
  RefreshCw,
  User
} from 'lucide-react';
import { api } from '../services/api';

export default function SimulatorTab({ 
  students = [],
  onNavigateTab,
  onLoadDemo
}) {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || 'STU-0001');
  const [studyTime, setStudyTime] = useState(2);
  const [absences, setAbsences] = useState(6);
  const [gradeG2, setGradeG2] = useState(9);
  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);

  if (students.length === 0) {
    return (
      <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center animate-fadeIn min-h-[420px] flex flex-col items-center justify-center space-y-5 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
          <Sliders className="w-8 h-8" />
        </div>
        <div className="max-w-md space-y-1.5">
          <h3 className="text-xl font-bold text-slate-900">No Students Loaded for Simulation (0 Data)</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            The counterfactual simulator requires student records. Upload a student CSV file in Tab 1 (or load the demo preset) 
            to test What-If intervention scenarios on individual students.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('batch')}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20"
            >
              <span>Go to Tab 1: Upload CSV</span>
            </button>
          )}
          {onLoadDemo && (
            <button
              onClick={onLoadDemo}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-all shadow-xs"
            >
              <span>Load 395 Benchmark Records</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  const handleStudentSelect = (id) => {
    setSelectedStudentId(id);
    const stu = students.find((s) => s.id === id);
    if (stu) {
      setStudyTime(stu.studytime || 2);
      setAbsences(stu.absences || 4);
      setGradeG2(stu.G2 || 10);
      setSimResult(null);
    }
  };

  const runSimulation = async () => {
    if (!currentStudent) return;
    setLoading(true);
    try {
      const res = await api.simulateIntervention(
        currentStudent,
        parseInt(studyTime),
        parseInt(absences),
        parseInt(gradeG2)
      );
      setSimResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
          <Sliders className="w-4 h-4" />
          <span>Counselor Decision Support</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Interactive "What-If" Student Risk Simulator
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Simulate counterfactual interventions: adjust weekly study hours, attendance recovery, 
          and targeted tutoring to assess real-time risk mitigation and ranking impact.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Controls Column */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
              Select Student to Simulate
            </label>
            <div className="flex items-center space-x-3">
              <select
                value={selectedStudentId}
                onChange={(e) => handleStudentSelect(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 font-mono font-semibold"
              >
                {students.slice(0, 50).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} — Rank #{s.rank} | Sex: {s.sex} | School: {s.school} | G1: {s.G1} | G2: {s.G2} ({s.risk_tier})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {currentStudent && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-medium">Gender & School</span>
                <span className="font-bold text-slate-800">{currentStudent.sex === 'F' ? 'Female' : 'Male'}, {currentStudent.school}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-medium">Baseline G1 / G2</span>
                <span className="font-mono font-bold text-slate-800">{currentStudent.G1} / {currentStudent.G2}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-medium">Calibrated Risk</span>
                <span className="font-mono font-bold text-amber-600">{currentStudent.calibrated_risk_prob}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-medium">POFR Rank Score</span>
                <span className="font-mono font-bold text-blue-600">{currentStudent.pofr_score}</span>
              </div>
            </div>
          )}

          {/* Intervention Sliders */}
          <div className="space-y-5 pt-4 border-t border-slate-100">
            {/* Study Time */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center space-x-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>Weekly Study Time:</span>
                </span>
                <span className="font-mono font-bold text-blue-600">
                  {studyTime === 1 ? '< 2 hours/wk' : studyTime === 2 ? '2 to 5 hours/wk' : studyTime === 3 ? '5 to 10 hours/wk' : '> 10 hours/wk'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={studyTime}
                onChange={(e) => setStudyTime(e.target.value)}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Absences */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>Absence Reduction Goal:</span>
                </span>
                <span className="font-mono font-bold text-amber-600">{absences} days</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={absences}
                onChange={(e) => setAbsences(e.target.value)}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
            </div>

            {/* Target G2 Improvement */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span className="flex items-center space-x-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Target Second Period Grade (G2):</span>
                </span>
                <span className="font-mono font-bold text-emerald-600">{gradeG2} / 20</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={gradeG2}
                onChange={(e) => setGradeG2(e.target.value)}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>
          </div>

          <button
            onClick={runSimulation}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Computing Risk Trajectory...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run Counterfactual Intervention Simulation</span>
              </>
            )}
          </button>
        </div>

        {/* Results Column */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              Simulated Outcome & Risk Shift
            </h3>

            {simResult ? (
              <div className="space-y-5">
                {/* Risk Shift Comparison */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Predicted Calibrated Risk:</span>
                    <span className={`font-mono font-bold text-xs ${
                      simResult.simulated_risk < simResult.original_risk ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      {simResult.original_risk} → {simResult.simulated_risk}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">POFR Rank Utility:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {simResult.original_pofr_score} → {simResult.simulated_pofr_score}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Risk Delta:</span>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                      simResult.risk_change_pct < 0 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {simResult.risk_change_pct}%
                    </span>
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Personalized Academic Counselor Plan</span>
                  </h4>
                  <ul className="space-y-2">
                    {simResult.actionable_recommendations.map((rec, idx) => (
                      <li key={idx} className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-200/80 text-xs text-slate-700 leading-snug">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                Adjust the intervention parameters on the left and click "Run Counterfactual Intervention Simulation" to preview outcomes.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

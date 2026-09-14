import React from 'react';
import { 
  Award, 
  CheckCircle2, 
  TrendingUp, 
  ShieldAlert, 
  Scale, 
  Compass, 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Legend, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

export default function ScorecardTab({ 
  compareData, 
  isPofrMode, 
  setIsPofrMode, 
  loading,
  cohortCount = 0,
  onNavigateTab,
  onLoadDemo
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-mono">Evaluating 100-Point Benchmark Dimensions...</p>
        </div>
      </div>
    );
  }

  if (!compareData || cohortCount === 0) {
    return (
      <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center animate-fadeIn min-h-[420px] flex flex-col items-center justify-center space-y-5 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
          <Award className="w-8 h-8" />
        </div>
        <div className="max-w-md space-y-1.5">
          <h3 className="text-xl font-bold text-slate-900">No Benchmark Scorecard Calculated (0 Data)</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            The scorecard begins with <strong>0 data</strong>. Upload a student CSV dataset in Tab 1 (or load the demo preset) 
            to calculate the exact 100-point benchmark metrics, radar trade-off diagrams, and group recalls.
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

  const activeEval = isPofrMode ? compareData?.pofr_eval : (compareData?.base_eval || compareData?.pofr_eval);
  const baseEval = compareData?.base_eval || compareData?.pofr_eval;
  const pofrEval = compareData?.pofr_eval;

  if (!activeEval || !pofrEval) {
    return null;
  }

  const getDimensionPts = (evalObj, dimIdx, maxPts) => {
    if (!evalObj || !evalObj.dimensions || !evalObj.dimensions[dimIdx]) return 0;
    return (evalObj.dimensions[dimIdx].earned_pts / maxPts) * 100;
  };

  // Prepare Radar / Comparison Chart Data
  const radarData = [
    {
      subject: 'Overall Recall (40)',
      base: getDimensionPts(baseEval, 0, 40),
      pofr: getDimensionPts(pofrEval, 0, 40),
      fullMark: 100,
    },
    {
      subject: 'Worst-Group R_min (25)',
      base: getDimensionPts(baseEval, 1, 25),
      pofr: getDimensionPts(pofrEval, 1, 25),
      fullMark: 100,
    },
    {
      subject: 'Fairness Utility (20)',
      base: getDimensionPts(baseEval, 2, 20),
      pofr: getDimensionPts(pofrEval, 2, 20),
      fullMark: 100,
    },
    {
      subject: 'Calibration (10)',
      base: getDimensionPts(baseEval, 3, 10),
      pofr: getDimensionPts(pofrEval, 3, 10),
      fullMark: 100,
    },
    {
      subject: 'Governance (5)',
      base: getDimensionPts(baseEval, 4, 5),
      pofr: getDimensionPts(pofrEval, 4, 5),
      fullMark: 100,
    },
  ];

  const dimensionIcons = [TrendingUp, ShieldAlert, Scale, Compass, Award];
  const comparisons = compareData?.comparisons || [];
  const scoreDelta = comparisons.length > 0 && comparisons[0].delta !== undefined
    ? comparisons[0].delta 
    : Math.round((pofrEval.total_score - (baseEval?.total_score || pofrEval.total_score)) * 100) / 100;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Banner with Toggle & Score Headline */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1.5">
              <Zap className="w-4 h-4" />
              <span>Executive Benchmark Scorecard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              100-Point Fair Student Prioritization Evaluator
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Strictly audits top <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono border border-blue-100">⌈0.20 N⌉</code> budget selection, 
              worst-group equity, Isotonic probability calibration, and zero-leakage compliance.
            </p>
          </div>

          {/* Switcher Toggle Control */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setIsPofrMode(false)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                !isPofrMode
                  ? 'bg-white text-rose-700 border border-rose-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Standard Base Model
            </button>
            <button
              onClick={() => setIsPofrMode(true)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                isPofrMode
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>POFR-Ed Optimized Ranker</span>
            </button>
          </div>
        </div>

        {/* Big Total Score Display */}
        <div className="mt-7 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="flex items-center space-x-5">
            <div className={`w-24 h-24 rounded-2xl flex flex-col items-center justify-center p-2 border ${
              isPofrMode 
                ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-xs' 
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              <span className="text-3xl font-black font-sans tracking-tight">
                {activeEval.total_score}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                / 100 PTS
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  {isPofrMode ? 'POFR-Ed Optimized Score' : 'Standard Baseline Score'}
                </h3>
                {isPofrMode && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 rounded border border-blue-200">
                    {scoreDelta >= 0 ? `+${scoreDelta}` : scoreDelta} PTS GAIN
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-snug">
                {isPofrMode 
                  ? 'Pareto frontier post-processing achieved maximum composite utility without sacrificing overall recall.'
                  : 'Uncalibrated baseline suffers from subgroup disparity and lower worst-group recall floor.'}
              </p>
            </div>
          </div>

          {/* Delta Highlights */}
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {comparisons.slice(1).map((comp, idx) => {
              const isPositive = comp.delta > 0 && comp.metric_name !== 'Demographic Fairness Gap';
              const isGapReduced = comp.metric_name === 'Demographic Fairness Gap' && comp.delta < 0;
              return (
                <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[11px] text-slate-500 block truncate font-medium">{comp.metric_name}</span>
                  <div className="flex items-baseline space-x-1.5 mt-1">
                    <span className="text-base font-bold text-slate-900 font-sans">
                      {isPofrMode ? comp.pofr_model : comp.base_model}{comp.unit === '%' ? '%' : ''}
                    </span>
                    {isPofrMode && (
                      <span className={`text-[10px] font-bold flex items-center ${
                        isPositive || isGapReduced ? 'text-emerald-600' : 'text-slate-500'
                      }`}>
                        {comp.delta > 0 ? `+${comp.delta}` : comp.delta}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5 uppercase tracking-wider font-semibold">{comp.impact}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5 Official Metric Dimension Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {activeEval.dimensions.map((dim, idx) => {
          const Icon = dimensionIcons[idx];
          const pct = Math.min(100, Math.round((dim.earned_pts / dim.max_pts) * 100));
          return (
            <div 
              key={idx} 
              className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all duration-300 flex flex-col justify-between hover:border-blue-300"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {dim.earned_pts} / {dim.max_pts} pts
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">{dim.dimension_name}</h4>
                <div className="mt-2 flex items-baseline space-x-2">
                  <span className="text-xl font-bold font-sans text-blue-600">{dim.metric_label}</span>
                  <span className="text-xs text-slate-400">rate</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{dim.description}</p>
              </div>

              {/* Progress bar */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-medium">
                  <span>Utility Efficiency</span>
                  <span className="font-mono font-bold text-slate-700">{pct}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      pct >= 85 ? 'bg-emerald-500' : pct >= 65 ? 'bg-blue-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Analytics: Radar Chart & Comparative Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Radar Chart: Multidimensional Trade-off */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Pareto Frontier Trade-Off Diagram</h3>
              <p className="text-xs text-slate-500">Comparing Base Ensemble vs POFR-Ed across all 5 evaluation dimensions</p>
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              Normalized (0-100%)
            </span>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" />
                <Radar 
                  name="Standard Base Model" 
                  dataKey="base" 
                  stroke="#f43f5e" 
                  fill="#f43f5e" 
                  fillOpacity={0.25} 
                />
                <Radar 
                  name="POFR-Ed Optimized" 
                  dataKey="pofr" 
                  stroke="#2563eb" 
                  fill="#2563eb" 
                  fillOpacity={0.35} 
                />
                <Legend 
                  wrapperStyle={{ fontSize: 12, paddingTop: 10 }} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 8, fontSize: '11px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subgroup Recall Comparison Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Subgroup Recall Floor Lifting</h3>
              <p className="text-xs text-slate-500">How POFR raises recall for minority/disadvantaged groups</p>
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-500">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span>Base</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                <span>POFR-Ed</span>
              </span>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    group: 'Female (F)',
                    Base: Math.round((baseEval?.recalls_by_group?.sex_F ?? 0) * 100),
                    'POFR-Ed': Math.round((pofrEval?.recalls_by_group?.sex_F ?? 0) * 100),
                  },
                  {
                    group: 'Male (M)',
                    Base: Math.round((baseEval?.recalls_by_group?.sex_M ?? 0) * 100),
                    'POFR-Ed': Math.round((pofrEval?.recalls_by_group?.sex_M ?? 0) * 100),
                  },
                  {
                    group: 'Gabriel Pereira (GP)',
                    Base: Math.round((baseEval?.recalls_by_group?.school_GP ?? 0) * 100),
                    'POFR-Ed': Math.round((pofrEval?.recalls_by_group?.school_GP ?? 0) * 100),
                  },
                  {
                    group: 'Mousinho da Silveira (MS)',
                    Base: Math.round((baseEval?.recalls_by_group?.school_MS ?? 0) * 100),
                    'POFR-Ed': Math.round((pofrEval?.recalls_by_group?.school_MS ?? 0) * 100),
                  },
                ]}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="group" stroke="#cbd5e1" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis stroke="#cbd5e1" domain={[0, 100]} unit="%" tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip 
                  formatter={(val) => [`${val}%`, 'Recall']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 8, fontSize: '11px' }}
                />
                <Bar dataKey="Base" fill="#f87171" radius={[4, 4, 0, 0]} />
                <Bar dataKey="POFR-Ed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}

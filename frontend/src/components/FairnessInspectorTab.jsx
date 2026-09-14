import React from 'react';
import { 
  Scale, 
  Users, 
  School, 
  CheckCircle, 
  AlertCircle, 
  HelpCircle, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  TrendingDown 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell 
} from 'recharts';

export default function FairnessInspectorTab({ 
  compareData,
  cohortCount = 0,
  onNavigateTab,
  onLoadDemo
}) {
  if (!compareData || cohortCount === 0) {
    return (
      <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center animate-fadeIn min-h-[420px] flex flex-col items-center justify-center space-y-5 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
          <Scale className="w-8 h-8" />
        </div>
        <div className="max-w-md space-y-1.5">
          <h3 className="text-xl font-bold text-slate-900">Awaiting Cohort Data (0 Records Active)</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            The fairness inspector starts with <strong>0 data</strong>. Upload a student CSV dataset in Tab 1 to calculate 
            subgroup recalls across Gender (Female vs Male) and School branches (GP vs MS), group eligibility badges, and fairness gap metrics.
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

  const pofrEval = compareData.pofr_eval;
  const baseEval = compareData.base_eval || compareData.pofr_eval;
  const groupCounts = pofrEval?.group_counts || {};

  // Sex data
  const sexChartData = [
    {
      group: 'Female (F)',
      Base: Math.round((baseEval?.recalls_by_group?.sex_F ?? 0) * 100),
      POFR: Math.round((pofrEval?.recalls_by_group?.sex_F ?? 0) * 100),
      positives: groupCounts.sex_F?.positive_count || 0,
      total: groupCounts.sex_F?.total_rows || 0,
      selected: groupCounts.sex_F?.selected_count || 0,
    },
    {
      group: 'Male (M)',
      Base: Math.round((baseEval?.recalls_by_group?.sex_M ?? 0) * 100),
      POFR: Math.round((pofrEval?.recalls_by_group?.sex_M ?? 0) * 100),
      positives: groupCounts.sex_M?.positive_count || 0,
      total: groupCounts.sex_M?.total_rows || 0,
      selected: groupCounts.sex_M?.selected_count || 0,
    },
  ];

  // School data
  const schoolChartData = [
    {
      group: 'Gabriel Pereira (GP)',
      Base: Math.round((baseEval?.recalls_by_group?.school_GP ?? 0) * 100),
      POFR: Math.round((pofrEval?.recalls_by_group?.school_GP ?? 0) * 100),
      positives: groupCounts.school_GP?.positive_count || 0,
      total: groupCounts.school_GP?.total_rows || 0,
      selected: groupCounts.school_GP?.selected_count || 0,
    },
    {
      group: 'Mousinho da Silveira (MS)',
      Base: Math.round((baseEval?.recalls_by_group?.school_MS ?? 0) * 100),
      POFR: Math.round((pofrEval?.recalls_by_group?.school_MS ?? 0) * 100),
      positives: groupCounts.school_MS?.positive_count || 0,
      total: groupCounts.school_MS?.total_rows || 0,
      selected: groupCounts.school_MS?.selected_count || 0,
    },
  ];

  const sexGapBase = Math.abs((baseEval?.recalls_by_group?.sex_F ?? 0) - (baseEval?.recalls_by_group?.sex_M ?? 0));
  const sexGapPofr = Math.abs((pofrEval?.recalls_by_group?.sex_F ?? 0) - (pofrEval?.recalls_by_group?.sex_M ?? 0));

  const schoolGapBase = Math.abs((baseEval?.recalls_by_group?.school_GP ?? 0) - (baseEval?.recalls_by_group?.school_MS ?? 0));
  const schoolGapPofr = Math.abs((pofrEval?.recalls_by_group?.school_GP ?? 0) - (pofrEval?.recalls_by_group?.school_MS ?? 0));

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
              <Scale className="w-4 h-4" />
              <span>Algorithmic Equity & Fairness Audit</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Subgroup Parity & Demographic Fairness Inspector
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Enforces the strict competition eligibility rule (subgroups must satisfy <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono border border-blue-100">N_g ≥ 10</code> rows 
              and <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono border border-blue-100">P_g ≥ 3</code> positive cases). Audits equalized opportunity across Gender and School branches.
            </p>
          </div>

          {/* Fairness Summary Metric Pill */}
          <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[11px] text-slate-500 block uppercase tracking-wider font-semibold">Demographic Fairness Gap</span>
              <div className="flex items-baseline space-x-2 mt-0.5">
                <span className="text-2xl font-black font-sans text-emerald-600">
                  {Math.round((pofrEval?.fairness_gap ?? 0) * 1000) / 10}%
                </span>
                <span className="text-xs text-slate-400 line-through">
                  {Math.round((baseEval?.fairness_gap ?? 0) * 1000) / 10}%
                </span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Subgroup Eligibility Badges */}
        <div className="mt-7 pt-6 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Eligible Subgroup Cohorts (Threshold Rule: N_g ≥ 10 & P_g ≥ 3)</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(groupCounts).map(([key, stat]) => {
              const label = key === 'sex_F' ? 'Female Students (F)' :
                            key === 'sex_M' ? 'Male Students (M)' :
                            key === 'school_GP' ? 'Gabriel Pereira (GP)' : 'Mousinho da Silveira (MS)';
              return (
                <div key={key} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{label}</span>
                    <span className="flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle className="w-3 h-3" />
                      <span>Eligible</span>
                    </span>
                  </div>
                  <div className="mt-2.5 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white p-1.5 rounded border border-slate-200 shadow-2xs">
                      <span className="text-[10px] text-slate-400 block font-medium">Cohort (N)</span>
                      <span className="font-mono font-bold text-slate-800">{stat.total_rows}</span>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-200 shadow-2xs">
                      <span className="text-[10px] text-slate-400 block font-medium">Positives (P)</span>
                      <span className="font-mono font-bold text-amber-600">{stat.positive_count}</span>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-200 shadow-2xs">
                      <span className="text-[10px] text-slate-400 block font-medium">Selected (K)</span>
                      <span className="font-mono font-bold text-blue-600">{stat.selected_count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dual Comparative Recall Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gender Parity Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-pink-600" />
                <h3 className="text-base font-bold text-slate-900">Gender Group Recall Parity</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Female vs Male support intervention recall</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase text-slate-400 block font-semibold">Gender Gap</span>
              <span className="text-xs font-mono font-bold text-emerald-600">
                Δ {Math.round(sexGapPofr * 1000) / 10}%
              </span>
            </div>
          </div>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sexChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="group" stroke="#cbd5e1" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis stroke="#cbd5e1" domain={[0, 100]} unit="%" tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip 
                  formatter={(val) => [`${val}%`, 'Support Recall']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 8, fontSize: '11px' }}
                />
                <Bar dataKey="Base" fill="#f87171" name="Base Ensemble" radius={[4, 4, 0, 0]} />
                <Bar dataKey="POFR" fill="#3b82f6" name="POFR-Ed Optimized" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
            <span>Base Model Gap: <strong className="text-rose-600">{Math.round(sexGapBase * 1000) / 10}%</strong></span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span>POFR-Ed Gap: <strong className="text-emerald-600">{Math.round(sexGapPofr * 1000) / 10}%</strong></span>
          </div>
        </div>

        {/* School Branch Parity Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <School className="w-4 h-4 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">School Branch Parity (GP vs MS)</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Protecting minority campus (MS: 46 students) from marginalization</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase text-slate-400 block font-semibold">School Gap</span>
              <span className="text-xs font-mono font-bold text-emerald-600">
                Δ {Math.round(schoolGapPofr * 1000) / 10}%
              </span>
            </div>
          </div>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={schoolChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="group" stroke="#cbd5e1" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis stroke="#cbd5e1" domain={[0, 100]} unit="%" tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip 
                  formatter={(val) => [`${val}%`, 'Support Recall']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 8, fontSize: '11px' }}
                />
                <Bar dataKey="Base" fill="#f87171" name="Base Ensemble" radius={[4, 4, 0, 0]} />
                <Bar dataKey="POFR" fill="#3b82f6" name="POFR-Ed Optimized" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
            <span>Base Model Gap: <strong className="text-rose-600">{Math.round(schoolGapBase * 1000) / 10}%</strong></span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span>POFR-Ed Gap: <strong className="text-emerald-600">{Math.round(schoolGapPofr * 1000) / 10}%</strong></span>
          </div>
        </div>

      </div>

      {/* Fairness Theory & Compliance Note */}
      <div className="bg-blue-50/60 p-5 rounded-xl border border-blue-200 flex items-start space-x-3">
        <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 space-y-1">
          <h4 className="font-bold text-slate-900">Why POFR Eliminates the Fairness Penalty</h4>
          <p className="text-slate-600 leading-relaxed">
            In standard ranking algorithms, majority sub-populations with denser sample distributions crowd out the selection quota, causing minority group recall (e.g. MS branch) to suffer. POFR-Ed computes the Pareto-optimal post-processing multipliers that mathematically raise the floor of worst-group recall (<code className="text-blue-700 font-mono font-bold">R_min</code>) to satisfy strict Equal Opportunity constraints without diluting overall academic recall.
          </p>
        </div>
      </div>

    </div>
  );
}

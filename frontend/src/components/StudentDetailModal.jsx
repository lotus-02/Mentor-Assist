import React from 'react';
import { 
  X, 
  User, 
  GraduationCap, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Calendar, 
  ShieldCheck,
  Compass
} from 'lucide-react';

export default function StudentDetailModal({ student, onClose }) {
  if (!student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden border border-slate-200 shadow-2xl bg-white">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-slate-900 font-mono">{student.id}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  student.selected_for_support 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {student.selected_for_support ? 'Priority Support Candidate' : 'Standard Monitoring'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Rank #{student.rank} • Cohort Prioritization Profile
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors border border-slate-200/80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
              <span className="text-[10px] uppercase text-slate-400 font-semibold block">Calibrated Risk</span>
              <span className="text-lg font-mono font-bold text-amber-600 block mt-0.5">{student.calibrated_risk_prob}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
              <span className="text-[10px] uppercase text-slate-400 font-semibold block">POFR Rank Utility</span>
              <span className="text-lg font-mono font-bold text-blue-600 block mt-0.5">{student.pofr_score}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
              <span className="text-[10px] uppercase text-slate-400 font-semibold block">Grade Velocity</span>
              <span className={`text-lg font-mono font-bold block mt-0.5 ${
                student.grade_velocity < 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}>
                {student.grade_velocity > 0 ? `+${student.grade_velocity}` : student.grade_velocity}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
              <span className="text-[10px] uppercase text-slate-400 font-semibold block">Risk Tier</span>
              <span className="text-xs font-bold text-slate-800 block mt-1.5">{student.risk_tier}</span>
            </div>
          </div>

          {/* Academic Track Record */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center space-x-1.5">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>Academic Performance Details</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] font-medium">First Period Grade (G1)</span>
                <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">{student.G1} / 20</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] font-medium">Second Period Grade (G2)</span>
                <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">{student.G2} / 20</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] font-medium">Academic Distress Index</span>
                <span className="font-mono font-bold text-amber-600 text-sm mt-0.5 block">{student.risk_index}</span>
              </div>
            </div>
          </div>

          {/* Demographic & Institutional Context */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center space-x-1.5">
              <Compass className="w-4 h-4 text-blue-600" />
              <span>Demographic & Institutional Context</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] font-medium">School</span>
                <span className="font-bold text-slate-800 block mt-0.5">{student.demographic_tags?.School || student.school}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] font-medium">Gender</span>
                <span className="font-bold text-slate-800 block mt-0.5">{student.demographic_tags?.Gender || student.sex}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] font-medium">Age</span>
                <span className="font-bold text-slate-800 block mt-0.5">{student.age} years old</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] font-medium">Living Area</span>
                <span className="font-bold text-slate-800 block mt-0.5">{student.demographic_tags?.Address || 'Urban'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] font-medium">Effort Ratio</span>
                <span className="font-mono font-bold text-slate-800 block mt-0.5">{student.effort_ratio}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] font-medium">Guardian</span>
                <span className="font-bold text-slate-800 block mt-0.5">{student.demographic_tags?.Guardian || 'Mother'}</span>
              </div>
            </div>
          </div>

          {/* POFR Prioritization Justification */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-slate-700">
            <span className="text-blue-700 font-bold block mb-1">Counselor Recommendation & Fair Priority Justification</span>
            <p className="leading-relaxed text-slate-600">
              {student.selected_for_support 
                ? `Student ${student.id} qualifies within the strictly bounded 20% institutional support capacity. Evaluated with calibrated distress probability ${student.calibrated_risk_prob}, POFR post-processing prioritizes this student to ensure equitable resource allocation across ${student.school} branch and ${student.sex === 'F' ? 'female' : 'male'} student cohorts.`
                : `Student ${student.id} exhibits manageable academic risk indicators (calibrated risk: ${student.calibrated_risk_prob}) and is placed in standard ongoing advisory tracking to reserve high-intensity interventions for critical priority candidates.`}
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors border border-slate-300 shadow-2xs"
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );
}

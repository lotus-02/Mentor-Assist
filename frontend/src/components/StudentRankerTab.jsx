import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Sliders, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ArrowUpDown, 
  Download, 
  Info, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  UserCheck,
  UploadCloud,
  ArrowRight,
  Database,
  Clock,
  ShieldAlert,
  User,
  Bell,
  Activity,
  Check,
  ExternalLink,
  BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export default function StudentRankerTab({ 
  rankedStudents = [], 
  onSelectStudent,
  budgetPct = 0.20,
  setBudgetPct,
  loading = false,
  onNavigateTab,
  onLoadDemo
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSex, setFilterSex] = useState('ALL');
  const [filterSchool, setFilterSchool] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterIndicator, setFilterIndicator] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [assignedStudents, setAssignedStudents] = useState({});

  const totalCohort = rankedStudents.length;
  const budgetCount = Math.ceil(budgetPct * totalCohort);

  // If 0 data, show clean empty state
  if (totalCohort === 0) {
    return (
      <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center animate-fadeIn min-h-[420px] flex flex-col items-center justify-center space-y-5 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
          <UploadCloud className="w-8 h-8" />
        </div>
        <div className="max-w-md space-y-1.5">
          <h3 className="text-xl font-bold text-slate-900">No Student Cohort Loaded (0 Data)</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            The ranker starts with <strong>0 data</strong>. Upload your fresh student CSV roster in Tab 1 to calculate exactly 
            who needs to be <strong>prioritized first</strong> and who can be <strong>supported later</strong>.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('batch')}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Go to Tab 1: Upload CSV</span>
            </button>
          )}
          {onLoadDemo && (
            <button
              onClick={onLoadDemo}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-all shadow-xs"
            >
              <Database className="w-4 h-4 text-blue-600" />
              <span>Load 395 Benchmark Records</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Count priority tiers
  const priority1Count = budgetCount; // strictly top 20%
  const priority2Count = Math.min(totalCohort - budgetCount, budgetCount);
  const priority3Count = Math.max(0, totalCohort - (priority1Count + priority2Count));

  // Count risk levels across the entire active cohort
  const highRiskCount = useMemo(() => {
    return rankedStudents.filter(s => (s.calibrated_risk_prob || 0) >= 0.5).length;
  }, [rankedStudents]);

  const mediumRiskCount = useMemo(() => {
    return rankedStudents.filter(s => {
      const p = s.calibrated_risk_prob || 0;
      return p >= 0.25 && p < 0.5;
    }).length;
  }, [rankedStudents]);

  const lowRiskCount = useMemo(() => {
    return rankedStudents.filter(s => (s.calibrated_risk_prob || 0) < 0.25).length;
  }, [rankedStudents]);

  // Helper to determine student indicators
  const getIndicators = (s) => {
    const list = [];
    if ((s.absences !== undefined && s.absences >= 6) || (s.risk_index && s.risk_index > 0.6)) {
      list.push({ label: 'Attendance', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' });
    }
    if ((s.G2 !== undefined && s.G2 < 10) || (s.grade_velocity !== undefined && s.grade_velocity < 0)) {
      list.push({ label: 'Grades', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' });
    }
    if ((s.failures !== undefined && s.failures > 0) || (s.studytime !== undefined && s.studytime < 2)) {
      list.push({ label: 'Behavior', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' });
    }
    if (s.higher === 'no' || (s.Medu !== undefined && s.Medu <= 2)) {
      list.push({ label: 'Socioeconomic', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' });
    }
    if (list.length === 0) {
      list.push({ label: 'Stable', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' });
    }
    return list;
  };

  // Helper for suggested intervention
  const getSuggestedIntervention = (s) => {
    if (s.calibrated_risk_prob >= 0.65) return '1-on-1 Tutoring';
    if (s.absences >= 8) return 'Attendance Advisory';
    if (s.failures > 0) return 'Academic Counseling';
    if (s.higher === 'no') return 'Career & Social Work';
    return 'Peer Mentoring';
  };

  // Filter and search
  const filteredStudents = useMemo(() => {
    return rankedStudents.filter((student) => {
      const matchesSearch = student.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSex = filterSex === 'ALL' || student.sex === filterSex;
      const matchesSchool = filterSchool === 'ALL' || student.school === filterSchool;
      
      const riskProb = student.calibrated_risk_prob || 0;
      let matchesPriority = true;
      if (filterPriority === 'FIRST') {
        matchesPriority = student.selected_for_support;
      } else if (filterPriority === 'LATER') {
        matchesPriority = !student.selected_for_support;
      } else if (filterPriority === 'HIGH') {
        matchesPriority = riskProb >= 0.5;
      } else if (filterPriority === 'MEDIUM') {
        matchesPriority = riskProb >= 0.25 && riskProb < 0.5;
      } else if (filterPriority === 'LOW') {
        matchesPriority = riskProb < 0.25;
      }

      let matchesIndicator = true;
      if (filterIndicator !== 'ALL') {
        const inds = getIndicators(student);
        matchesIndicator = inds.some(i => i.label.toLowerCase() === filterIndicator.toLowerCase());
      }

      return matchesSearch && matchesSex && matchesSchool && matchesPriority && matchesIndicator;
    });
  }, [rankedStudents, searchTerm, filterSex, filterSchool, filterPriority, filterIndicator]);

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  const exportFilteredCsv = () => {
    const headers = ['Rank', 'ID', 'Priority_Order', 'Priority_Tier', 'School', 'Sex', 'Age', 'G1', 'G2', 'Grade_Velocity', 'Risk_Index', 'Calibrated_Prob', 'POFR_Score', 'Selected_For_Support'];
    const rows = filteredStudents.map(s => [
      s.rank, s.id, s.priority_order || (s.selected_for_support ? 'First' : 'Later'), s.priority_tier || (s.selected_for_support ? 'Priority 1 (First)' : 'Priority 3 (Later)'), s.school, s.sex, s.age, s.G1, s.G2, s.grade_velocity, s.risk_index, s.calibrated_risk_prob, s.pofr_score, s.selected_for_support ? 'YES' : 'NO'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pofr_ed_prioritized_students_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAssignSupport = (id) => {
    setAssignedStudents(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Grade/School breakdown chart data
  const schoolBreakdown = useMemo(() => {
    const gpStudents = rankedStudents.filter(s => s.school === 'GP');
    const msStudents = rankedStudents.filter(s => s.school === 'MS');
    
    return [
      {
        name: 'School GP (Urban)',
        total: gpStudents.length,
        selected: gpStudents.filter(s => s.selected_for_support).length,
        highRisk: gpStudents.filter(s => (s.calibrated_risk_prob || 0) >= 0.5).length
      },
      {
        name: 'School MS (Rural)',
        total: msStudents.length,
        selected: msStudents.filter(s => s.selected_for_support).length,
        highRisk: msStudents.filter(s => (s.calibrated_risk_prob || 0) >= 0.5).length
      },
      {
        name: 'Grade 10 (Age ≤16)',
        total: rankedStudents.filter(s => (s.age || 16) <= 16).length,
        selected: rankedStudents.filter(s => (s.age || 16) <= 16 && s.selected_for_support).length,
        highRisk: rankedStudents.filter(s => (s.age || 16) <= 16 && (s.calibrated_risk_prob || 0) >= 0.5).length
      },
      {
        name: 'Grade 11-12 (Age >16)',
        total: rankedStudents.filter(s => (s.age || 17) > 16).length,
        selected: rankedStudents.filter(s => (s.age || 17) > 16 && s.selected_for_support).length,
        highRisk: rankedStudents.filter(s => (s.age || 17) > 16 && (s.calibrated_risk_prob || 0) >= 0.5).length
      }
    ];
  }, [rankedStudents]);

  // High priority alerts (top flagged students)
  const highPriorityAlerts = useMemo(() => {
    return rankedStudents
      .filter(s => (s.calibrated_risk_prob || 0) >= 0.5)
      .slice(0, 3);
  }, [rankedStudents]);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Priority Allocation Cards (Who needs help FIRST vs NEXT vs LATER) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tier 1: First */}
        <div className="p-4 rounded-2xl bg-white border border-blue-200/80 shadow-xs flex items-start space-x-3.5 transition-all">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
              Prioritize First (Immediate Support)
            </span>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="text-2xl font-black font-sans text-slate-900">{priority1Count}</span>
              <span className="text-xs text-slate-500 font-medium">students (Strict 20% Budget)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Rank #1 to #{priority1Count}: Highest POFR risk and distress. Guaranteed academic intervention seats.
            </p>
          </div>
        </div>

        {/* Tier 2: Next */}
        <div className="p-4 rounded-2xl bg-white border border-amber-200/80 shadow-xs flex items-start space-x-3.5 transition-all">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
              Prioritize Next (Secondary Advisory)
            </span>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="text-2xl font-black font-sans text-slate-900">{priority2Count}</span>
              <span className="text-xs text-slate-500 font-medium">students (Next 20%)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Rank #{priority1Count + 1} to #{priority1Count + priority2Count}: Borderline distress. First in line if tutoring capacity expands.
            </p>
          </div>
        </div>

        {/* Tier 3: Later */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start space-x-3.5 transition-all">
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 flex-shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
              Support Later (Routine Tracking)
            </span>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="text-2xl font-black font-sans text-slate-900">{priority3Count}</span>
              <span className="text-xs text-slate-500 font-medium">students</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Rank #{priority1Count + priority2Count + 1} to #{totalCohort}: Stable or low risk indicators; placed on standard classroom monitoring.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Case Prioritization & Allocation Table (Left) + Alerts & Updates Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 8/9 Columns: Main Prioritization Table */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          
          {/* Header & Controls */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Case Prioritization & Allocation
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Filter by criteria or risk score to assign support. Ranked #1 down to #{totalCohort}.
                </p>
              </div>

              {/* Strict Budget Quota Controls */}
              <div className="flex items-center space-x-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                <span className="font-semibold text-slate-600">Budget Quota:</span>
                <span className="font-mono font-bold text-blue-600">
                  {Math.round(budgetPct * 100)}% ({budgetCount} Seats)
                </span>
                <input 
                  type="range"
                  min="0.05"
                  max="0.40"
                  step="0.05"
                  value={budgetPct}
                  onChange={(e) => setBudgetPct(parseFloat(e.target.value))}
                  className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                {/* Search */}
                <div className="relative flex-1 sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search student by ID..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* Priority & Risk Filter (With High, Medium, Low options) */}
                <select
                  value={filterPriority}
                  onChange={(e) => { setFilterPriority(e.target.value); setCurrentPage(1); }}
                  className="bg-slate-50 hover:bg-white border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                >
                  <option value="ALL">All Priorities ({totalCohort})</option>
                  <option value="FIRST">Prioritize First (Top 20%)</option>
                  <option value="LATER">Support Later</option>
                  <option value="HIGH">High Risk ({highRiskCount})</option>
                  <option value="MEDIUM">Medium Risk ({mediumRiskCount})</option>
                  <option value="LOW">Low Risk ({lowRiskCount})</option>
                </select>

                {/* School Filter */}
                <select
                  value={filterSchool}
                  onChange={(e) => { setFilterSchool(e.target.value); setCurrentPage(1); }}
                  className="bg-slate-50 hover:bg-white border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="ALL">All Schools</option>
                  <option value="GP">GP (Gabriel Pereira)</option>
                  <option value="MS">MS (Mousinho)</option>
                </select>

                {/* Indicator Filter */}
                <select
                  value={filterIndicator}
                  onChange={(e) => { setFilterIndicator(e.target.value); setCurrentPage(1); }}
                  className="bg-slate-50 hover:bg-white border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="ALL">All Indicators</option>
                  <option value="Attendance">Attendance Issues</option>
                  <option value="Grades">Grade Drop</option>
                  <option value="Behavior">Behavior / Study</option>
                  <option value="Socioeconomic">Socioeconomic Need</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-500">
                  Showing <strong>{filteredStudents.length}</strong> of {totalCohort}
                </span>
                <button
                  onClick={exportFilteredCsv}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors shadow-2xs"
                >
                  <Download className="w-3 h-3 text-slate-500" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Quick-Filter Risk & Priority Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-medium mr-1">Quick Filter:</span>
              <button
                onClick={() => { setFilterPriority('ALL'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterPriority === 'ALL'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                All ({totalCohort})
              </button>
              <button
                onClick={() => { setFilterPriority('HIGH'); setCurrentPage(1); }}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterPriority === 'HIGH'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>High Risk ({highRiskCount})</span>
              </button>
              <button
                onClick={() => { setFilterPriority('MEDIUM'); setCurrentPage(1); }}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterPriority === 'MEDIUM'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Medium Risk ({mediumRiskCount})</span>
              </button>
              <button
                onClick={() => { setFilterPriority('LOW'); setCurrentPage(1); }}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterPriority === 'LOW'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Low Risk ({lowRiskCount})</span>
              </button>
              <button
                onClick={() => { setFilterPriority('FIRST'); setCurrentPage(1); }}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterPriority === 'FIRST'
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                }`}
              >
                <span>Prioritize First (Top 20%)</span>
              </button>
              <button
                onClick={() => { setFilterPriority('LATER'); setCurrentPage(1); }}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterPriority === 'LATER'
                    ? 'bg-slate-700 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                }`}
              >
                <span>Support Later</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-3">Key Indicators</th>
                    <th className="py-3 px-3">Overall Risk Score</th>
                    <th className="py-3 px-3">Suggested Intervention</th>
                    <th className="py-3 px-3 text-center">Rank</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-10 text-center text-slate-400">
                        No students match the current filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((student) => {
                      const isSelected = student.selected_for_support;
                      const indicators = getIndicators(student);
                      const intervention = getSuggestedIntervention(student);
                      const riskProb = student.calibrated_risk_prob || 0;
                      const isHighRisk = riskProb >= 0.5;
                      const isMediumRisk = riskProb >= 0.25 && riskProb < 0.5;
                      const isAssigned = assignedStudents[student.id];

                      return (
                        <tr 
                          key={student.id}
                          className={`transition-colors hover:bg-slate-50/80 ${
                            isSelected ? 'bg-blue-50/20' : ''
                          }`}
                        >
                          {/* Student Info with Avatar */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] ${
                                isSelected 
                                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {student.id.replace('STU-', '').slice(0, 2)}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block font-mono text-xs">
                                  {student.id}
                                </span>
                                <span className="text-[11px] text-slate-400 block">
                                  School {student.school} • Age {student.age || 16} • {student.sex === 'F' ? 'Female' : 'Male'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Key Indicators (Multi-colored pastel pills from image) */}
                          <td className="py-3.5 px-3">
                            <div className="flex flex-wrap gap-1 max-w-[180px]">
                              {indicators.map((ind, i) => (
                                <span 
                                  key={i} 
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${ind.bg} ${ind.text} ${ind.border}`}
                                >
                                  {ind.label}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Overall Risk Score (Pill + Score / 10) */}
                          <td className="py-3.5 px-3">
                            <div className="flex flex-col space-y-1">
                              <div>
                                {isHighRisk ? (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                                    <span>High ({(riskProb * 10).toFixed(1)} / 10)</span>
                                  </span>
                                ) : isMediumRisk ? (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                                    <span>Medium ({(riskProb * 10).toFixed(1)} / 10)</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                    <span>Low ({(riskProb * 10).toFixed(1)} / 10)</span>
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                G1: {student.G1} | G2: {student.G2} ({student.grade_velocity > 0 ? `+${student.grade_velocity}` : student.grade_velocity})
                              </span>
                            </div>
                          </td>

                          {/* Suggested Intervention */}
                          <td className="py-3.5 px-3">
                            <span className="text-xs font-semibold text-slate-700 block">
                              {intervention}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              POFR Score: <strong className="text-blue-600">{student.pofr_score}</strong>
                            </span>
                          </td>

                          {/* Rank Badge */}
                          <td className="py-3.5 px-3 text-center">
                            <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-mono font-bold ${
                              isSelected 
                                ? 'bg-blue-100 text-blue-800' 
                                : student.rank <= budgetCount * 2
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              #{student.rank}
                            </span>
                            <span className="block text-[9px] text-slate-400 mt-0.5">
                              {isSelected ? 'Priority 1' : student.rank <= budgetCount * 2 ? 'Priority 2' : 'Priority 3'}
                            </span>
                          </td>

                          {/* Action Buttons (Matching image: Assign Support + View Details) */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleAssignSupport(student.id)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center space-x-1 ${
                                  isAssigned 
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                              >
                                {isAssigned ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>Assigned</span>
                                  </>
                                ) : (
                                  <span>Assign Support</span>
                                )}
                              </button>

                              <button
                                onClick={() => onSelectStudent(student)}
                                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-all shadow-2xs"
                              >
                                View Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center space-x-3">
                <div>
                  Page <strong className="text-slate-900">{currentPage}</strong> of <strong className="text-slate-900">{totalPages}</strong>
                  <span className="text-slate-400 ml-1.5">({filteredStudents.length} matching students)</span>
                </div>

                {/* Page Size Selector */}
                <div className="flex items-center space-x-1 pl-2 border-l border-slate-200">
                  <span className="text-[11px] text-slate-400">Rows:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    className="bg-white border border-slate-200 text-slate-700 rounded px-1.5 py-0.5 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value={12}>12 / page</option>
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Jump directly to any page */}
                {totalPages > 1 && (
                  <div className="flex items-center space-x-1 mr-1">
                    <span className="text-[11px] text-slate-400">Jump to:</span>
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 1 && val <= totalPages) {
                          setCurrentPage(val);
                        }
                      }}
                      className="w-12 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-center text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 shadow-2xs cursor-pointer"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 shadow-2xs cursor-pointer"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4/3 Columns: Alerts & Updates Sidebar (From Reference Image) */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <span>Alerts & Updates</span>
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                Live Feed
              </span>
            </div>

            {/* Recent High-Priority Flags Card */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700 block">Recent High-Priority Flags</span>
              <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/80 text-xs space-y-2">
                <div className="flex items-start space-x-2 text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span className="font-semibold text-xs leading-snug">
                    {highPriorityAlerts.length} students flagged with critical attendance or academic dip.
                  </span>
                </div>
                <div className="space-y-1.5 pt-1">
                  {highPriorityAlerts.map((s) => (
                    <div 
                      key={s.id} 
                      onClick={() => onSelectStudent(s)}
                      className="p-2 rounded-lg bg-white border border-rose-100 flex items-center justify-between text-[11px] cursor-pointer hover:bg-rose-50/50 transition-colors"
                    >
                      <span className="font-mono font-bold text-slate-800">{s.id}</span>
                      <span className="font-semibold text-rose-700">{s.school} • G2: {s.G2}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* System Updates Timeline */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-semibold text-slate-700 block">System Updates</span>
              <div className="relative pl-4 space-y-4 text-xs border-l-2 border-blue-100 ml-1.5">
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 absolute -left-[21px] top-1 border-2 border-white" />
                  <p className="font-bold text-slate-800 text-[11px]">Algorithm run completed</p>
                  <p className="text-[10px] text-slate-400">Fresh Pareto optimization computed with zero leakage.</p>
                </div>
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 absolute -left-[21px] top-1 border-2 border-white" />
                  <p className="font-bold text-slate-800 text-[11px]">Capacity alert: 20% quota active</p>
                  <p className="text-[10px] text-slate-400">{budgetCount} seats filled out of {totalCohort} enrolled.</p>
                </div>
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute -left-[21px] top-1 border-2 border-white" />
                  <p className="font-bold text-slate-800 text-[11px]">District audit compliance ready</p>
                  <p className="text-[10px] text-slate-400">Demographic parity & Brier score certified.</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2">
              <button
                onClick={() => onNavigateTab && onNavigateTab('simulator')}
                className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
              >
                <span>Run What-If Policy Simulation</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* SECTION: Resource Allocation vs. Student Needs Across Grade Levels (Matching Image Bottom Chart) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Resource Allocation vs. Student Needs Across Cohorts</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparison between total enrolled students, top 20% allocated seats, and high-risk students across school divisions.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs text-slate-500">
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-sm bg-blue-500" />
              <span>Total Enrolled</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span>Allocated (20%)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-sm bg-rose-400" />
              <span>High Risk</span>
            </span>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={schoolBreakdown} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} stroke="#cbd5e1" />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} stroke="#cbd5e1" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderRadius: '12px', 
                  border: '1px solid #e2e8f0', 
                  fontSize: '11px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                }} 
              />
              <Bar dataKey="total" fill="#93c5fd" radius={[4, 4, 0, 0]} name="Total Enrolled" />
              <Bar dataKey="selected" fill="#3b82f6" radius={[4, 4, 0, 0]} name="20% Allocated" />
              <Bar dataKey="highRisk" fill="#f87171" radius={[4, 4, 0, 0]} name="High Risk" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}

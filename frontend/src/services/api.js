import axios from 'axios';

// Default to relative /api or localhost:8000
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

export const api = {
  getHealth: async () => {
    const res = await client.get('/api/health');
    return res.data;
  },

  getModelInfo: async () => {
    const res = await client.get('/api/model-info');
    return res.data;
  },

  compareModels: async (budgetPct = 0.20) => {
    const res = await client.get(`/api/compare-models?budget_pct=${budgetPct}`);
    return res.data;
  },

  getBenchmarkDataset: async (limit = null) => {
    const url = limit ? `/api/benchmark-dataset?limit=${limit}` : '/api/benchmark-dataset';
    const res = await client.get(url);
    return res.data;
  },

  predictCohort: async (students, budgetPct = 0.20, fairnessWeight = 1.0) => {
    const res = await client.post('/api/predict', {
      students,
      budget_pct: budgetPct,
      fairness_weight: fairnessWeight,
    });
    return res.data;
  },

  predictCsv: async (file, budgetPct = 0.20, usePofr = true) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('budget_pct', budgetPct.toString());
    formData.append('use_pofr', usePofr.toString());
    
    // Do NOT set Content-Type manually, let browser set boundary
    const res = await client.post('/api/predict/csv', formData, {
      headers: { 'Content-Type': undefined },
    });
    return res.data;
  },

  evaluateDataset: async (file = null, budgetPct = 0.20) => {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('budget_pct', budgetPct.toString());
      const res = await client.post('/api/evaluate', formData, {
        headers: { 'Content-Type': undefined },
      });
      return res.data;
    } else {
      const res = await client.post('/api/evaluate', { budget_pct: budgetPct });
      return res.data;
    }
  },

  simulateIntervention: async (student, studytime = null, absences = null, G2 = null) => {
    const res = await client.post('/api/simulate-intervention', {
      student,
      modified_studytime: studytime,
      modified_absences: absences,
      modified_G2: G2,
    });
    return res.data;
  }
};

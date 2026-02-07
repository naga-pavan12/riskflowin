export type RiskLevel = 'low' | 'watch' | 'severe';
export type ComponentType = 'SERVICE' | 'MATERIAL' | 'INFRA';

export interface MonthRisk {
  month: string;
  status: RiskLevel;
  probability: number;
  expectedShortfall: number;
  p80Shortfall: number;
  scheduleDebt: number; // New
  deferredCost: number; // New
  drivers: RiskDriver[];
}

export interface RiskDriver {
  id: string;
  name: string;
  component: ComponentType;
  riskContribution: number;
  impactContribution: number;
  description: string;
}

export interface RecommendedAction {
  id: string;
  title: string;
  category: string;
  targetMonths: string[];
  reason: string;
  impact: {
    redMonths: number;
    worstP80: number;
    probability: number;
  };
}

// Sample data
export const monthsData: MonthRisk[] = [
  {
    month: 'Jan 2025',
    status: 'low',
    probability: 12.5,
    expectedShortfall: 0.8,
    p80Shortfall: 2.3,
    scheduleDebt: 0,
    deferredCost: 0,
    drivers: [
      { id: '1', name: 'Cloud Infrastructure', component: 'INFRA', riskContribution: 0.3, impactContribution: 0.4, description: 'AWS cost overrun' },
      { id: '2', name: 'External API Services', component: 'SERVICE', riskContribution: 0.2, impactContribution: 0.3, description: 'Third-party rate increases' }
    ]
  },
  {
    month: 'Feb 2025',
    status: 'low',
    probability: 18.2,
    expectedShortfall: 1.2,
    p80Shortfall: 3.1,
    scheduleDebt: 0,
    deferredCost: 0,
    drivers: [
      { id: '1', name: 'Engineering Contractors', component: 'SERVICE', riskContribution: 0.4, impactContribution: 0.5, description: 'Scope expansion' },
      { id: '2', name: 'Cloud Infrastructure', component: 'INFRA', riskContribution: 0.3, impactContribution: 0.3, description: 'Peak usage period' }
    ]
  },
  {
    month: 'Mar 2025',
    status: 'watch',
    probability: 42.8,
    expectedShortfall: 3.5,
    p80Shortfall: 7.2,
    scheduleDebt: 0,
    deferredCost: 0,
    drivers: [
      { id: '1', name: 'Hardware Components', component: 'MATERIAL', riskContribution: 0.6, impactContribution: 0.7, description: 'Supply chain delays' },
      { id: '2', name: 'Engineering Contractors', component: 'SERVICE', riskContribution: 0.5, impactContribution: 0.6, description: 'Extended timelines' }
    ]
  },
  {
    month: 'Apr 2025',
    status: 'watch',
    probability: 51.3,
    expectedShortfall: 4.8,
    p80Shortfall: 9.5,
    scheduleDebt: 0,
    deferredCost: 0,
    drivers: [
      { id: '1', name: 'Hardware Components', component: 'MATERIAL', riskContribution: 0.7, impactContribution: 0.8, description: 'Vendor delays' },
      { id: '2', name: 'Data Center Costs', component: 'INFRA', riskContribution: 0.4, impactContribution: 0.5, description: 'Capacity expansion' }
    ]
  },
  {
    month: 'May 2025',
    status: 'watch',
    probability: 63.4,
    expectedShortfall: 6.2,
    p80Shortfall: 11.8,
    scheduleDebt: 0,
    deferredCost: 0,
    drivers: [
      { id: '1', name: 'Engineering Contractors', component: 'SERVICE', riskContribution: 0.8, impactContribution: 0.9, description: 'Peak demand period' },
      { id: '2', name: 'Hardware Components', component: 'MATERIAL', riskContribution: 0.6, impactContribution: 0.7, description: 'Component shortages' }
    ]
  },
  {
    month: 'Jun 2025',
    status: 'watch',
    probability: 58.9,
    expectedShortfall: 5.5,
    p80Shortfall: 10.2,
    scheduleDebt: 0,
    deferredCost: 0,
    drivers: [
      { id: '1', name: 'Engineering Contractors', component: 'SERVICE', riskContribution: 0.7, impactContribution: 0.8, description: 'Resource constraints' },
      { id: '2', name: 'Cloud Infrastructure', component: 'INFRA', riskContribution: 0.5, impactContribution: 0.6, description: 'Scale requirements' }
    ]
  },
  {
    month: 'Jul 2025',
    status: 'severe',
    probability: 72.1,
    expectedShortfall: 8.3,
    p80Shortfall: 14.5,
    scheduleDebt: 0,
    deferredCost: 0,
    drivers: [
      { id: '1', name: 'Engineering Contractors', component: 'SERVICE', riskContribution: 0.9, impactContribution: 1.0, description: 'Critical milestone' },
      { id: '2', name: 'Hardware Components', component: 'MATERIAL', riskContribution: 0.7, impactContribution: 0.8, description: 'Procurement gap' }
    ]
  },
  {
    month: 'Aug 2025',
    status: 'severe',
    probability: 78.0,
    expectedShortfall: 9.8,
    p80Shortfall: 12.5,
    scheduleDebt: 0,
    deferredCost: 0,
    drivers: [
      { id: '1', name: 'Engineering Contractors', component: 'SERVICE', riskContribution: 1.0, impactContribution: 1.0, description: 'Peak hiring needs' },
      { id: '2', name: 'Data Center Costs', component: 'INFRA', riskContribution: 0.8, impactContribution: 0.9, description: 'Infrastructure rollout' },
      { id: '3', name: 'Hardware Components', component: 'MATERIAL', riskContribution: 0.6, impactContribution: 0.7, description: 'Long lead times' }
    ]
  },
  {
    month: 'Sep 2025',
    status: 'watch',
    probability: 61.7,
    expectedShortfall: 6.5,
    p80Shortfall: 11.0,
    scheduleDebt: 0,
    deferredCost: 0,
    drivers: [
      { id: '1', name: 'Engineering Contractors', component: 'SERVICE', riskContribution: 0.8, impactContribution: 0.9, description: 'Project ramp-down' },
      { id: '2', name: 'Cloud Infrastructure', component: 'INFRA', riskContribution: 0.6, impactContribution: 0.7, description: 'Optimization needed' }
    ]
  },
  {
    month: 'Oct 2025',
    status: 'watch',
    probability: 47.2,
    expectedShortfall: 4.2,
    p80Shortfall: 8.8,
    scheduleDebt: 0,
    deferredCost: 0,
    drivers: [
      { id: '1', name: 'Hardware Components', component: 'MATERIAL', riskContribution: 0.6, impactContribution: 0.7, description: 'Inventory build' },
      { id: '2', name: 'External API Services', component: 'SERVICE', riskContribution: 0.4, impactContribution: 0.5, description: 'Usage patterns' }
    ]
  },
  {
    month: 'Nov 2025',
    status: 'watch',
    probability: 38.5,
    expectedShortfall: 2.9,
    p80Shortfall: 6.5,
    scheduleDebt: 0,
    deferredCost: 0,
    drivers: [
      { id: '1', name: 'Cloud Infrastructure', component: 'INFRA', riskContribution: 0.5, impactContribution: 0.6, description: 'Cost optimization' },
      { id: '2', name: 'Engineering Contractors', component: 'SERVICE', riskContribution: 0.4, impactContribution: 0.5, description: 'Reduced demand' }
    ]
  },
  {
    month: 'Dec 2025',
    status: 'low',
    probability: 22.3,
    expectedShortfall: 1.5,
    p80Shortfall: 4.2,
    scheduleDebt: 0,
    deferredCost: 0,
    drivers: [
      { id: '1', name: 'External API Services', component: 'SERVICE', riskContribution: 0.3, impactContribution: 0.4, description: 'Year-end adjustments' },
      { id: '2', name: 'Cloud Infrastructure', component: 'INFRA', riskContribution: 0.2, impactContribution: 0.3, description: 'Stable operations' }
    ]
  }
];

export const topDrivers: RiskDriver[] = [
  {
    id: '1',
    name: 'Engineering Contractors',
    component: 'SERVICE',
    riskContribution: 0.92,
    impactContribution: 0.95,
    description: 'Peak hiring needs and scope expansion'
  },
  {
    id: '2',
    name: 'Hardware Components',
    component: 'MATERIAL',
    riskContribution: 0.78,
    impactContribution: 0.82,
    description: 'Supply chain delays and long lead times'
  },
  {
    id: '3',
    name: 'Data Center Costs',
    component: 'INFRA',
    riskContribution: 0.65,
    impactContribution: 0.71,
    description: 'Infrastructure expansion requirements'
  },
  {
    id: '4',
    name: 'Cloud Infrastructure',
    component: 'INFRA',
    riskContribution: 0.54,
    impactContribution: 0.58,
    description: 'AWS cost variability and scaling needs'
  },
  {
    id: '5',
    name: 'External API Services',
    component: 'SERVICE',
    riskContribution: 0.42,
    impactContribution: 0.45,
    description: 'Third-party rate increases'
  }
];

export const recommendedActions: RecommendedAction[] = [
  {
    id: '1',
    title: 'Pre-hire contractors for Aug-Sep peak',
    category: 'Capacity Planning',
    targetMonths: ['Jul 2025', 'Aug 2025', 'Sep 2025'],
    reason: 'Reduces probability of shortage during critical milestone',
    impact: {
      redMonths: -2,
      worstP80: -4.8,
      probability: -18.5
    }
  },
  {
    id: '2',
    title: 'Accelerate hardware procurement by 6 weeks',
    category: 'Supply Chain',
    targetMonths: ['Mar 2025', 'Apr 2025', 'May 2025'],
    reason: 'Mitigates vendor delays and component shortages',
    impact: {
      redMonths: -1,
      worstP80: -3.2,
      probability: -12.3
    }
  },
  {
    id: '3',
    title: 'Negotiate fixed-rate cloud commitment',
    category: 'Infrastructure',
    targetMonths: ['All months'],
    reason: 'Eliminates AWS cost variability',
    impact: {
      redMonths: 0,
      worstP80: -1.8,
      probability: -8.7
    }
  },
  {
    id: '4',
    title: 'Add ₹15Cr buffer to Q3 allocation',
    category: 'Budget',
    targetMonths: ['Jul 2025', 'Aug 2025', 'Sep 2025'],
    reason: 'Provides direct coverage for worst-case scenarios',
    impact: {
      redMonths: -3,
      worstP80: -12.5,
      probability: -25.0
    }
  },
  {
    id: '5',
    title: 'Lock multi-vendor contracts for hardware',
    category: 'Supply Chain',
    targetMonths: ['Apr 2025', 'May 2025', 'Jun 2025'],
    reason: 'Reduces dependency on single vendor',
    impact: {
      redMonths: -1,
      worstP80: -2.5,
      probability: -9.2
    }
  },
  {
    id: '6',
    title: 'Defer non-critical infrastructure to Q4',
    category: 'Scope',
    targetMonths: ['May 2025', 'Jun 2025', 'Jul 2025'],
    reason: 'Frees up budget during high-risk period',
    impact: {
      redMonths: -1,
      worstP80: -3.1,
      probability: -11.8
    }
  }
];

// Summary stats
export const summaryStats = {
  overallRisk: 'severe' as RiskLevel,
  worstMonth: 'Aug 2025',
  worstProbability: 78.0,
  worstP80: 12.5,
  totalExposure: 86.5,
  expectedShortfall: 54.2,
  redMonths: 6,
  spentToDate: 142.5,
  remainingCap: 87.5,
  totalBudget: 230.0
};

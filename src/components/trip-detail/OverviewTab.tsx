import React from 'react';
import { Trip, Member, Expense, TripCalculationResult } from '../../types';
import { formatINR, paiseToRupees } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { Button } from '../common/Button';
import { PillBadge } from '../common/PillBadge';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import {
  Receipt,
  Users,
  TrendingUp,
  Award,
  CreditCard,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export interface OverviewTabProps {
  trip: Trip;
  members: Member[];
  expenses: Expense[];
  calculation: TripCalculationResult;
  onAddExpense: () => void;
  onNavigateToExpenses: () => void;
  onNavigateToSettlement: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Fuel: '#FDE047',
  Transport: '#38BDF8',
  Food: '#F97316',
  Accommodation: '#A855F7',
  'Tickets and activities': '#EC4899',
  Shopping: '#10B981',
  Groceries: '#84CC16',
  Other: '#94A3B8',
};

const PALETTE = ['#FDE047', '#38BDF8', '#F97316', '#A855F7', '#EC4899', '#10B981', '#84CC16', '#94A3B8'];

export const OverviewTab: React.FC<OverviewTabProps> = ({
  trip,
  members,
  expenses,
  calculation,
  onAddExpense,
  onNavigateToExpenses,
  onNavigateToSettlement,
}) => {
  const memberMap = new Map<string, Member>();
  members.forEach((m) => memberMap.set(m.id, m));

  // Highest spending member
  let highestPayerName = 'None';
  let highestPaidPaise = 0;
  for (const summary of Object.values(calculation.memberSummaries)) {
    if (summary.totalPaidPaise > highestPaidPaise) {
      highestPaidPaise = summary.totalPaidPaise;
      highestPayerName = summary.name;
    }
  }

  // Largest single expense
  let largestExpense: Expense | null = null;
  for (const exp of expenses) {
    if (!largestExpense || exp.amountPaise > largestExpense.amountPaise) {
      largestExpense = exp;
    }
  }

  // Chart 1: Spending by Member (Rupees)
  const spendingByMemberData = Object.values(calculation.memberSummaries).map((s) => ({
    name: s.name,
    amount: paiseToRupees(s.totalPaidPaise),
    formattedAmount: formatINR(s.totalPaidPaise),
  }));

  // Chart 2: Category Breakdown
  const categoryMap = new Map<string, number>();
  for (const exp of expenses) {
    const prev = categoryMap.get(exp.category) || 0;
    categoryMap.set(exp.category, prev + exp.amountPaise);
  }
  const categoryData = Array.from(categoryMap.entries()).map(([cat, paise]) => ({
    name: cat,
    value: paiseToRupees(paise),
    paise,
    formatted: formatINR(paise),
    color: CATEGORY_COLORS[cat] || '#CBD5E1',
  }));

  // Chart 3: Spending Over Time (sorted by date)
  const dateMap = new Map<string, number>();
  for (const exp of expenses) {
    const prev = dateMap.get(exp.expenseDate) || 0;
    dateMap.set(exp.expenseDate, prev + exp.amountPaise);
  }
  const timelineData = Array.from(dateMap.entries())
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, paise]) => ({
      date: formatDate(date),
      rawDate: date,
      amount: paiseToRupees(paise),
      formatted: formatINR(paise),
    }));

  // Chart 4: Spent vs Consumed Share (Grouped Bar Chart)
  const comparisonData = Object.values(calculation.memberSummaries).map((s) => ({
    name: s.name,
    'Spent (₹)': paiseToRupees(s.totalPaidPaise),
    'Consumed Share (₹)': paiseToRupees(s.totalFairSharePaise),
    net: formatINR(s.netBalancePaise),
  }));

  return (
    <div className="space-y-8">
      {/* 6 Key Financial Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
        {/* Total Expenses */}
        <div className="glass-panel rounded-2xl sm:rounded-[28px] p-3.5 sm:p-5 space-y-1.5 sm:space-y-2 border border-white/10 hover:border-white/20 transition-all min-w-0">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider truncate">Total Spent</span>
            <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FDE047] shrink-0" />
          </div>
          <div className="text-base sm:text-xl lg:text-2xl font-black text-[#FDE047] truncate">
            {formatINR(calculation.totalTripPaise)}
          </div>
          <span className="text-[10px] text-neutral-400 block truncate">Whole trip expenditure</span>
        </div>

        {/* Members */}
        <div className="glass-panel rounded-2xl sm:rounded-[28px] p-3.5 sm:p-5 space-y-1.5 sm:space-y-2 border border-white/10 hover:border-white/20 transition-all min-w-0">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider truncate">Members</span>
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 shrink-0" />
          </div>
          <div className="text-base sm:text-xl lg:text-2xl font-black text-white truncate">
            {members.length}
          </div>
          <span className="text-[10px] text-neutral-400 block truncate">Active participants</span>
        </div>

        {/* Expenses Count */}
        <div className="glass-panel rounded-2xl sm:rounded-[28px] p-3.5 sm:p-5 space-y-1.5 sm:space-y-2 border border-white/10 hover:border-white/20 transition-all min-w-0">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider truncate">Items Logged</span>
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 shrink-0" />
          </div>
          <div className="text-base sm:text-xl lg:text-2xl font-black text-white truncate">
            {expenses.length}
          </div>
          <span className="text-[10px] text-neutral-400 block truncate">Individual receipts</span>
        </div>

        {/* Highest Payer */}
        <div className="glass-panel rounded-2xl sm:rounded-[28px] p-3.5 sm:p-5 space-y-1.5 sm:space-y-2 border border-white/10 hover:border-white/20 transition-all min-w-0">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider truncate">Top Spender</span>
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
          </div>
          <div className="text-sm sm:text-base lg:text-lg font-bold text-white truncate" title={highestPayerName}>
            {highestPayerName}
          </div>
          <span className="text-[10px] text-neutral-400 block font-mono truncate">
            {formatINR(highestPaidPaise)} paid
          </span>
        </div>

        {/* Largest Single Expense */}
        <div className="glass-panel rounded-2xl sm:rounded-[28px] p-3.5 sm:p-5 space-y-1.5 sm:space-y-2 border border-white/10 hover:border-white/20 transition-all min-w-0">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider truncate">Largest Bill</span>
            <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />
          </div>
          <div className="text-sm sm:text-base lg:text-lg font-bold text-white truncate" title={largestExpense?.title || 'None'}>
            {largestExpense ? formatINR(largestExpense.amountPaise) : '₹0'}
          </div>
          <span className="text-[10px] text-neutral-400 block truncate">
            {largestExpense?.title || 'None recorded'}
          </span>
        </div>

        {/* Settlement Status */}
        <div className="glass-panel rounded-2xl sm:rounded-[28px] p-3.5 sm:p-5 space-y-1.5 sm:space-y-2 border border-white/10 hover:border-white/20 transition-all min-w-0">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider truncate">Status</span>
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
          </div>
          <div className="text-sm sm:text-base lg:text-lg font-bold text-white truncate">
            {calculation.isFullySettled ? (
              <span className="text-emerald-400">Settled</span>
            ) : (
              <span className="text-rose-400">{formatINR(calculation.totalDebtPaise)}</span>
            )}
          </div>
          <span className="text-[10px] text-neutral-400 block truncate">
            {calculation.settlementTransfers.length} payments needed
          </span>
        </div>
      </div>

      {/* CHARTS GRID */}
      {expenses.length === 0 ? (
        <div className="glass-panel rounded-[32px] p-12 text-center space-y-4 border border-white/10">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-yellow-300">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-lg font-bold text-white">No Expense Analytics Yet</h3>
            <p className="text-xs text-neutral-400">
              Add fuel, dining, or ticket expenses to visualize spending breakdowns and member shares.
            </p>
          </div>
          <Button variant="cyber" size="sm" onClick={onAddExpense} icon={<Plus className="w-4 h-4" />}>
            Add First Expense
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Chart 1: Spending by Member */}
          <div className="glass-panel rounded-2xl sm:rounded-[32px] p-4 sm:p-6 space-y-3 sm:space-y-4 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#FDE047]" />
                <h3 className="text-xs sm:text-sm uppercase tracking-wider font-bold text-white">
                  Actual Spending by Member
                </h3>
              </div>
              <span className="text-[11px] sm:text-xs text-neutral-400">Amount paid (₹)</span>
            </div>

            <div className="h-56 sm:h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingByMemberData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="name" stroke="#A3A3A3" fontSize={11} tickLine={false} />
                  <YAxis stroke="#A3A3A3" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171717',
                      borderColor: 'rgba(255,255,255,0.2)',
                      borderRadius: '16px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                    formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Paid']}
                  />
                  <Bar dataKey="amount" fill="#FDE047" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Category Breakdown (Donut) */}
          <div className="glass-panel rounded-2xl sm:rounded-[32px] p-4 sm:p-6 space-y-3 sm:space-y-4 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-[#FDE047]" />
                <h3 className="text-xs sm:text-sm uppercase tracking-wider font-bold text-white">
                  Expense Category Distribution
                </h3>
              </div>
              <span className="text-[11px] sm:text-xs text-neutral-400">{categoryData.length} categories</span>
            </div>

            <div className="h-56 sm:h-64 w-full flex items-center justify-center min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || PALETTE[index % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171717',
                      borderColor: 'rgba(255,255,255,0.2)',
                      borderRadius: '16px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                    formatter={(val, name) => [`₹${Number(val).toLocaleString('en-IN')}`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category Legend Pills */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-2">
              {categoryData.map((cat, idx) => (
                <div key={idx} className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-[11px] text-neutral-300">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span>{cat.name}:</span>
                  <span className="font-bold text-white font-mono">{cat.formatted}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 3: Spending Over Time */}
          <div className="glass-panel rounded-2xl sm:rounded-[32px] p-4 sm:p-6 space-y-3 sm:space-y-4 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#FDE047]" />
                <h3 className="text-xs sm:text-sm uppercase tracking-wider font-bold text-white">
                  Spending Over Time
                </h3>
              </div>
              <span className="text-[11px] sm:text-xs text-neutral-400">Daily expenses</span>
            </div>

            <div className="h-56 sm:h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="yellowGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FDE047" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#FDE047" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="date" stroke="#A3A3A3" fontSize={11} tickLine={false} />
                  <YAxis stroke="#A3A3A3" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171717',
                      borderColor: 'rgba(255,255,255,0.2)',
                      borderRadius: '16px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                    formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Spent']}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#FDE047"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#yellowGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Spent vs Consumed Share (Grouped Bar Chart) */}
          <div className="glass-panel rounded-2xl sm:rounded-[32px] p-4 sm:p-6 space-y-3 sm:space-y-4 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#FDE047]" />
                <h3 className="text-xs sm:text-sm uppercase tracking-wider font-bold text-white">
                  Spent vs Consumed Share
                </h3>
              </div>
              <span className="text-[11px] sm:text-xs text-neutral-400">Equity comparison</span>
            </div>

            <div className="h-56 sm:h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="name" stroke="#A3A3A3" fontSize={11} tickLine={false} />
                  <YAxis stroke="#A3A3A3" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171717',
                      borderColor: 'rgba(255,255,255,0.2)',
                      borderRadius: '16px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                    formatter={(val, name) => [`₹${Number(val).toLocaleString('en-IN')}`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="Spent (₹)" fill="#FDE047" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Consumed Share (₹)" fill="#38BDF8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Navigation Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <button
          onClick={onNavigateToExpenses}
          className="glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-[28px] text-left flex items-center justify-between group hover:border-[#FDE047]/50 transition-all cursor-pointer min-w-0"
        >
          <div className="space-y-1 min-w-0 pr-2">
            <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-neutral-400">
              Manage Expenses
            </span>
            <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-[#FDE047] transition-colors truncate">
              View All {expenses.length} Expense Records
            </h4>
            <p className="text-xs text-neutral-400 line-clamp-2">
              Add, edit, duplicate, or delete expenses with automatic recalculation.
            </p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center text-white group-hover:bg-[#FDE047] group-hover:text-black transition-all shrink-0">
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </button>

        <button
          onClick={onNavigateToSettlement}
          className="glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-[28px] text-left flex items-center justify-between group hover:border-emerald-500/50 transition-all cursor-pointer min-w-0"
        >
          <div className="space-y-1 min-w-0 pr-2">
            <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-neutral-400">
              Debt Resolution
            </span>
            <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
              {calculation.settlementTransfers.length} Transfers to Settle
            </h4>
            <p className="text-xs text-neutral-400 line-clamp-2">
              Review greedy debt-clearing plan and confirm final balances.
            </p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center text-white group-hover:bg-emerald-400 group-hover:text-black transition-all shrink-0">
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </button>
      </div>
    </div>
  );
};

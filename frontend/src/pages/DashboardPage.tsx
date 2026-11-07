import React from 'react';
import { 
  FileSpreadsheet, 
  AlertCircle, 
  ArrowUpRight, 
  UploadCloud, 
  GitCompare, 
  FileSearch, 
  DollarSign
} from 'lucide-react';
import { MetricCard } from '../components/ui/MetricCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CountUp } from '../components/ui/CountUp';
import { useReconciliation } from '../context/ReconciliationContext';
import { formatCurrency, formatNumber } from '../utils/cn';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { activeRun, investigations } = useReconciliation();

  // Volume & Reconciliation Rate
  const totalVolume = activeRun?.metrics.totalRecords || 1250;
  const matchRate = activeRun?.metrics.reconciliationPercentage || 96.4;
  const discrepanciesCount = activeRun?.metrics.discrepanciesCount || 45;
  const openInvestigationsCount = investigations.filter(i => i.status === 'OPEN' || i.status === 'UNDER_REVIEW').length;

  // Chart Data: 7-Day Velocity
  const velocityData = [
    { date: 'Nov 01', imported: 950, reconciled: 920 },
    { date: 'Nov 02', imported: 1100, reconciled: 1080 },
    { date: 'Nov 03', imported: 1050, reconciled: 1030 },
    { date: 'Nov 04', imported: 1300, reconciled: 1260 },
    { date: 'Nov 05', imported: 1400, reconciled: 1365 },
    { date: 'Nov 06', imported: 1200, reconciled: 1170 },
    { date: 'Nov 07', imported: 1250, reconciled: 1205 },
  ];

  // Chart Data: Discrepancy Breakdown
  const discrepancyBreakdown = [
    { name: 'Amount Mismatch', value: 18, color: '#D95C5C' }, // Crimson
    { name: 'Missing Payment', value: 14, color: '#E5A83B' }, // Amber
    { name: 'Missing Settlement', value: 8, color: '#8B70E8' }, // Lavender
    { name: 'Duplicate Record', value: 5, color: '#D6B66C' }, // Gold
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-navy-950 font-sans tracking-tight">
            Financial Reconciliation Overview
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Reconciliation Run #{activeRun?.runId || 'RUN-2026-901'} • Monitored Automated Batch
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary-navy"
            size="sm"
            onClick={() => onNavigate('/import')}
            leftIcon={<UploadCloud className="w-4 h-4 text-gold-500" />}
          >
            Import CSVs
          </Button>
          <Button
            variant="primary-gold"
            size="sm"
            onClick={() => onNavigate('/reconcile')}
            leftIcon={<GitCompare className="w-4 h-4" />}
          >
            Run Reconciliation
          </Button>
        </div>
      </div>

      {/* KPI 4-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Ingested Volume"
          value={<CountUp to={totalVolume} duration={1.8} />}
          subtitle="Transactions evaluated"
          icon={<FileSpreadsheet className="w-5 h-5" />}
          variant="navy"
          trend={{ value: '+4.8%', isPositive: true }}
          onClick={() => onNavigate('/import')}
        />
        <MetricCard
          title="Reconciliation Match Rate"
          value={<CountUp to={matchRate} decimals={1} suffix="%" duration={1.8} />}
          subtitle="Mathematical exact balance"
          icon={<DollarSign className="w-5 h-5" />}
          variant="emerald"
          trend={{ value: '+1.2%', isPositive: true }}
          onClick={() => onNavigate('/results')}
        />
        <MetricCard
          title="Active Discrepancies"
          value={<CountUp to={discrepanciesCount} duration={1.8} />}
          subtitle="Requires attention"
          icon={<AlertCircle className="w-5 h-5" />}
          variant="crimson"
          trend={{ value: '-3 cases', isPositive: true }}
          onClick={() => onNavigate('/results')}
        />
        <MetricCard
          title="Open Investigations"
          value={<CountUp to={openInvestigationsCount} duration={1.8} />}
          subtitle="Under analyst review"
          icon={<FileSearch className="w-5 h-5" />}
          variant="gold"
          onClick={() => onNavigate('/investigations')}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 7-Day Velocity Area Chart */}
        <Card variant="white" className="lg:col-span-8 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-navy-950 font-sans">
                7-Day Reconciliation Velocity
              </h2>
              <p className="text-xs text-slate-500">Volume imported vs. successfully balanced transactions</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-navy-800">
                <span className="w-2.5 h-2.5 rounded-full bg-navy-800" /> Imported
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Matched
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={velocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorImported" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#11182D" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#11182D" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReconciled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#26966B" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#26966B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#11182D', 
                    borderRadius: '8px', 
                    border: '1px solid #1E293B',
                    color: '#F8FAFC',
                    fontSize: '12px' 
                  }} 
                />
                <Area type="monotone" dataKey="imported" stroke="#11182D" strokeWidth={2} fillOpacity={1} fill="url(#colorImported)" />
                <Area type="monotone" dataKey="reconciled" stroke="#26966B" strokeWidth={2} fillOpacity={1} fill="url(#colorReconciled)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Discrepancy Breakdown Donut Chart */}
        <Card variant="white" className="lg:col-span-4 p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-navy-950 font-sans">
              Discrepancy Archetypes
            </h2>
            <p className="text-xs text-slate-500">Distribution across 45 flagged records</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={discrepancyBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {discrepancyBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#11182D', 
                    borderRadius: '8px', 
                    border: 'none',
                    color: '#F8FAFC',
                    fontSize: '11px' 
                  }} 
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle" 
                  formatter={(val) => <span className="text-xs text-slate-600 font-medium">{val}</span>} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Quick Action Navigation Dock */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          isInteractive 
          onClick={() => onNavigate('/import')} 
          className="p-4 bg-gradient-to-br from-white to-ivory-50 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-lg bg-navy-800 text-gold-500">
              <UploadCloud className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-gold-600 transition-colors" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-navy-950">1. Upload Files</h3>
          <p className="text-xs text-slate-500 mt-0.5">Ingest Orders, Payments & Settlements</p>
        </Card>

        <Card 
          isInteractive 
          onClick={() => onNavigate('/reconcile')} 
          className="p-4 bg-gradient-to-br from-white to-ivory-50 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-lg bg-gold-500 text-navy-950">
              <GitCompare className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-gold-600 transition-colors" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-navy-950">2. Run Engine</h3>
          <p className="text-xs text-slate-500 mt-0.5">Execute 3-way matching algorithm</p>
        </Card>

        <Card 
          isInteractive 
          onClick={() => onNavigate('/results')} 
          className="p-4 bg-gradient-to-br from-white to-ivory-50 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-lg bg-crimson-500 text-white">
              <AlertCircle className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-gold-600 transition-colors" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-navy-950">3. Review Discrepancies</h3>
          <p className="text-xs text-slate-500 mt-0.5">Inspect shortfalls & double charges</p>
        </Card>

        <Card 
          isInteractive 
          onClick={() => onNavigate('/reports')} 
          className="p-4 bg-gradient-to-br from-white to-ivory-50 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-lg bg-emerald-500 text-white">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-gold-600 transition-colors" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-navy-950">4. Export Reports</h3>
          <p className="text-xs text-slate-500 mt-0.5">Generate signed executive PDF summary</p>
        </Card>
      </div>

      {/* Recent Discrepancy Stream */}
      <Card variant="white" className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-navy-950 font-sans">
              Recent Discrepancies Requiring Investigation
            </h2>
            <p className="text-xs text-slate-500">Auto-detected variances from current run</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('/results')}
            rightIcon={<ArrowUpRight className="w-4 h-4" />}
          >
            View All Discrepancies
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Case ID</th>
                <th className="py-2.5 px-3">Discrepancy Type</th>
                <th className="py-2.5 px-3">Order ID</th>
                <th className="py-2.5 px-3 text-right">Variance</th>
                <th className="py-2.5 px-3">Explanation</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeRun?.discrepancies.slice(0, 4).map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-navy-950">
                    {item.investigationId || item.id}
                  </td>
                  <td className="py-3 px-3">
                    <Badge status={item.type} size="sm" />
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">{item.orderId}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-crimson-600">
                    {item.variance}
                  </td>
                  <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                    {item.explanation}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Button
                      variant="outline-gold"
                      size="sm"
                      onClick={() => onNavigate('/investigations')}
                    >
                      Investigate
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};


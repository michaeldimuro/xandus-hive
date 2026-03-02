import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  HardHat,
  Phone,
  DollarSign,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { LeadStage } from '../stores/leadsStore';

const STAGES: LeadStage[] = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

const STAGE_COLORS: Record<LeadStage, string> = {
  new: 'bg-blue-500',
  contacted: 'bg-violet-500',
  qualified: 'bg-cyan-500',
  proposal: 'bg-amber-500',
  won: 'bg-green-500',
  lost: 'bg-red-500',
};

const STAGE_LABELS: Record<LeadStage, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal',
  won: 'Won',
  lost: 'Lost',
};

interface SummaryData {
  leadsByStage: Record<LeadStage, number>;
  totalLeads: number;
  activeSubs: number;
  recentCallsCount: number;
  pipelineValue: number;
}

export default function ContractingOverviewPage() {
  const [data, setData] = useState<SummaryData>({
    leadsByStage: { new: 0, contacted: 0, qualified: 0, proposal: 0, won: 0, lost: 0 },
    totalLeads: 0,
    activeSubs: 0,
    recentCallsCount: 0,
    pipelineValue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      // Fetch leads
      const { data: leads } = await supabase.from('leads').select('stage, estimated_value');

      // Fetch active subcontractors
      const { count: subsCount } = await supabase
        .from('subcontractors')
        .select('*', { count: 'exact', head: true })
        .eq('availability', 'available');

      // Fetch recent calls (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: callsCount } = await supabase
        .from('voice_calls')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Calculate stats
      const leadsByStage: Record<LeadStage, number> = {
        new: 0,
        contacted: 0,
        qualified: 0,
        proposal: 0,
        won: 0,
        lost: 0,
      };
      let pipelineValue = 0;

      if (leads) {
        for (const lead of leads) {
          const stage = lead.stage as LeadStage;
          if (leadsByStage[stage] !== undefined) {
            leadsByStage[stage]++;
          }
          if (stage !== 'lost' && stage !== 'won' && lead.estimated_value) {
            pipelineValue += lead.estimated_value;
          }
        }
      }

      setData({
        leadsByStage,
        totalLeads: leads?.length || 0,
        activeSubs: subsCount || 0,
        recentCallsCount: callsCount || 0,
        pipelineValue,
      });
    } catch (error) {
      console.error('Error fetching contracting summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Leads',
      value: data.totalLeads,
      icon: Users,
      color: 'from-blue-500 to-indigo-600',
      bgGlow: 'bg-blue-500/10',
      link: '/synergy/leads',
    },
    {
      title: 'Pipeline Value',
      value: `$${data.pipelineValue.toLocaleString()}`,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600',
      bgGlow: 'bg-green-500/10',
      link: '/synergy/leads',
    },
    {
      title: 'Active Subs',
      value: data.activeSubs,
      icon: HardHat,
      color: 'from-purple-500 to-violet-600',
      bgGlow: 'bg-purple-500/10',
      link: '/synergy/subs',
    },
    {
      title: 'Recent Calls (30d)',
      value: data.recentCallsCount,
      icon: Phone,
      color: 'from-amber-500 to-orange-600',
      bgGlow: 'bg-amber-500/10',
      link: '/synergy/calls',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 gradient-accent rounded-xl flex items-center justify-center">
          <TrendingUp size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Synergy Contracting</h1>
          <p className="text-gray-400 text-sm">Pipeline, subcontractors, and voice operations</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link
            key={stat.title}
            to={stat.link}
            className="glass rounded-xl p-6 relative overflow-hidden hover:ring-1 hover:ring-indigo-500/30 transition-all group"
          >
            <div className={`absolute inset-0 ${stat.bgGlow} opacity-50`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}
                >
                  <stat.icon className="text-white" size={24} />
                </div>
                <ArrowRight
                  size={18}
                  className="text-gray-500 group-hover:text-indigo-400 transition-colors"
                />
              </div>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-gray-400 text-sm mt-1">{stat.title}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Leads by stage */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Leads by Stage</h2>
          <Link
            to="/synergy/leads"
            className="text-sm text-indigo-400 hover:text-indigo-300"
          >
            View pipeline
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {STAGES.map((stage) => (
            <div
              key={stage}
              className="bg-[#1a1a3a] rounded-lg p-3 border-l-4"
              style={{ borderLeftColor: 'transparent' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2.5 h-2.5 rounded-full ${STAGE_COLORS[stage]}`} />
                <span className="text-xs text-gray-400 font-medium">{STAGE_LABELS[stage]}</span>
              </div>
              <p className="text-2xl font-bold text-white">{data.leadsByStage[stage]}</p>
            </div>
          ))}
        </div>

        {/* Pipeline bar */}
        {data.totalLeads > 0 && (
          <div className="mt-4">
            <div className="h-3 bg-[#1a1a3a] rounded-full overflow-hidden flex">
              {STAGES.filter((s) => data.leadsByStage[s] > 0).map((stage) => (
                <div
                  key={stage}
                  className={`${STAGE_COLORS[stage]} transition-all`}
                  style={{
                    width: `${(data.leadsByStage[stage] / data.totalLeads) * 100}%`,
                  }}
                  title={`${STAGE_LABELS[stage]}: ${data.leadsByStage[stage]}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/synergy/leads"
          className="glass rounded-xl p-5 hover:ring-1 hover:ring-indigo-500/30 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users size={20} className="text-blue-400" />
              <span className="font-medium text-white">Leads Pipeline</span>
            </div>
            <ArrowRight
              size={18}
              className="text-gray-500 group-hover:text-indigo-400 transition-colors"
            />
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Track and manage leads through your sales pipeline
          </p>
        </Link>

        <Link
          to="/synergy/subs"
          className="glass rounded-xl p-5 hover:ring-1 hover:ring-indigo-500/30 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HardHat size={20} className="text-purple-400" />
              <span className="font-medium text-white">Subcontractors</span>
            </div>
            <ArrowRight
              size={18}
              className="text-gray-500 group-hover:text-indigo-400 transition-colors"
            />
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Manage your network of trade professionals
          </p>
        </Link>

        <Link
          to="/synergy/calls"
          className="glass rounded-xl p-5 hover:ring-1 hover:ring-indigo-500/30 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone size={20} className="text-amber-400" />
              <span className="font-medium text-white">Voice Calls</span>
            </div>
            <ArrowRight
              size={18}
              className="text-gray-500 group-hover:text-indigo-400 transition-colors"
            />
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Call logs, campaigns, and transcript management
          </p>
        </Link>
      </div>
    </div>
  );
}

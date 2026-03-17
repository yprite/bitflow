'use client';

import { useCallback, useEffect, useState } from 'react';
import OnchainAlertFeed from '@/components/onchain-alert-feed';
import OnchainEntityFlowCard from '@/components/onchain-entity-flow-card';
import OnchainMetricCard from '@/components/onchain-metric-card';
import type { OnchainSummaryData } from '@/lib/types';

interface AdminOnchainData {
  summary: OnchainSummaryData;
  pipeline: {
    nodeTipHeight: number | null;
    indexedHeight: number | null;
    lagBlocks: number | null;
    syncPercent: number | null;
    latestIndexedDay: string | null;
    updatedAt: string;
  };
}

function formatCount(value: number | null): string {
  if (value === null) return '—';
  return value.toLocaleString('ko-KR');
}

function formatPercent(value: number | null): string {
  if (value === null) return '—';
  return `${value.toFixed(2)}%`;
}

function formatDay(value: string | null): string {
  if (!value) return '—';

  return new Date(`${value}T00:00:00Z`).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  });
}

function StatusCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="dot-card p-4 space-y-2">
      <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-dot-muted">{label}</p>
      <p className="text-xl font-semibold text-dot-accent font-mono">{value}</p>
      <p className="text-[11px] text-dot-muted leading-relaxed">{hint}</p>
    </div>
  );
}

export default function AdminOnchainPage() {
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<AdminOnchainData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async (token: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/onchain', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        setAuthed(false);
        setError('인증 실패');
        return;
      }

      if (!res.ok) {
        throw new Error('API 오류');
      }

      const json: AdminOnchainData = await res.json();
      setData(json);
      setAuthed(true);
    } catch {
      setError('온체인 관리자 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = () => {
    if (!secret.trim()) return;
    sessionStorage.setItem('admin_token', secret);
    fetchData(secret);
  };

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_token');
    if (saved) {
      setSecret(saved);
      fetchData(saved);
    }
  }, [fetchData]);

  if (!authed) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="dot-card p-6 w-full max-w-xs space-y-4 dot-entrance dot-grid-sparse">
          <h1 className="text-xs font-semibold text-dot-accent uppercase tracking-wider text-center">
            Admin On-chain
          </h1>
          {error && <p className="text-dot-red text-xs text-center">{error}</p>}
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="관리자 비밀키"
            className="w-full border border-dot-border px-3 py-2 text-xs focus:border-dot-accent outline-none font-mono bg-white"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-dot-accent text-white py-2 text-xs font-semibold hover:bg-dot-accent/90 transition font-mono uppercase tracking-wider"
          >
            로그인
          </button>
        </div>
      </div>
    );
  }

  const summary = data?.summary;
  const visibleMetrics = summary?.metrics.filter((metric) => metric.latestValue !== null) ?? [];

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-sm font-semibold text-dot-sub uppercase tracking-wider">
            온체인 파이프라인
          </h1>
          <p className="text-xs text-dot-muted">
            node sync, indexed height, published stream 상태를 관리자 전용으로 확인합니다.
          </p>
        </div>
        <button
          onClick={() => secret && fetchData(secret)}
          disabled={loading}
          className="text-xs text-dot-sub hover:text-dot-accent transition px-2 py-1 border-2 border-dot-border hover:border-dot-accent disabled:opacity-50"
        >
          {loading ? '로딩...' : '새로고침'}
        </button>
      </div>

      {error && <p className="text-dot-red text-xs">{error}</p>}

      {data && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatusCard
            label="Node Tip"
            value={formatCount(data.pipeline.nodeTipHeight)}
            hint="bitcoind가 현재 알고 있는 메인넷 최신 블록 높이"
          />
          <StatusCard
            label="Indexed Height"
            value={formatCount(data.pipeline.indexedHeight)}
            hint="로컬 온체인 DB에 적재된 마지막 블록 높이"
          />
          <StatusCard
            label="Sync Progress"
            value={formatPercent(data.pipeline.syncPercent)}
            hint={`남은 블록 ${formatCount(data.pipeline.lagBlocks)}`}
          />
          <StatusCard
            label="Indexed Day"
            value={formatDay(data.pipeline.latestIndexedDay)}
            hint={`업데이트 ${formatDateTime(data.pipeline.updatedAt)}`}
          />
        </div>
      )}

      {visibleMetrics.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibleMetrics.map((metric) => (
            <OnchainMetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      ) : null}

      {summary ? (
        <div className="grid gap-3 xl:grid-cols-[1.05fr_0.95fr]">
          <OnchainEntityFlowCard flows={summary.entityFlows} />
          <OnchainAlertFeed alerts={summary.alerts} stats={summary.alertStats} />
        </div>
      ) : null}
    </div>
  );
}

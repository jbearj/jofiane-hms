import React, { useState, useEffect } from 'react';

function Overview() {
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('today');
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboardData(period);
  }, [period]);

  const fetchDashboardData = async (selectedPeriod) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const res = await fetch(`http://localhost:8080/api/admin/dashboard?period=${selectedPeriod}`);
      // const data = await res.json();
      await new Promise(resolve => setTimeout(resolve, 600));

      // Mock data — will be replaced by API response
      const data = {
        kpis: {
          totalRevenue: { value: 18420, trend: '+12%', trendDir: 'up', sub: 'vs last week' },
          occupancyRate: { value: 88.5, trend: '+3.2%', trendDir: 'up', sub: '106 / 120 rooms' },
          adr: { value: 165, trend: '+12', trendDir: 'up', sub: 'vs target' },
          revpar: { value: 146, trend: '+8%', trendDir: 'up', sub: 'month to date' }
        },
        revenueTrend: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          values: [9500, 12000, 16000, 18000, 14500, 17000, 15500],
          thisWeekTotal: 18420,
          lastWeekTotal: 16450,
          growth: '+12%'
        },
        departmentHealth: [
          { id: 1, dept: 'Front Desk', status: 'All clear', level: 'good' },
          { id: 2, dept: 'Housekeeping', status: '4 rooms pending', level: 'warning' },
          { id: 3, dept: 'Maintenance', status: '3 critical orders', level: 'critical' },
          { id: 4, dept: 'F&B', status: 'Fully staffed', level: 'good' }
        ],
        roomStatus: {
          total: 120,
          occupied: 78,
          vacant: 28,
          maintenance: 9,
          cleaning: 5
        },
        weeklyBookings: {
          data: [
            { day: 'Mon', count: 5 },
            { day: 'Tue', count: 7 },
            { day: 'Wed', count: 4 },
            { day: 'Thu', count: 8 },
            { day: 'Fri', count: 9 },
            { day: 'Sat', count: 10 },
            { day: 'Sun', count: 4 }
          ],
          total: 47,
          avgPerDay: 6.7
        }
      };

      setDashboardData(data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (isLoading || !dashboardData) {
    return (
      <section className="admin-tab-content active">
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '16px', fontWeight: '500' }}>Loading dashboard...</div>
        </div>
      </section>
    );
  }

  const { kpis, revenueTrend, departmentHealth, roomStatus, weeklyBookings } = dashboardData;

  // Calculate chart points from revenue trend data
  const maxRevenue = Math.max(...revenueTrend.values);
  const chartPoints = revenueTrend.values.map((val, i) => {
    const x = 60 + (i * 70);
    const y = 110 - ((val / maxRevenue) * 90);
    return { x, y };
  });
  const polylinePoints = chartPoints.map(p => `${p.x},${p.y}`).join(' ');
  const areaPath = `M${chartPoints[0].x},${chartPoints[0].y} ${chartPoints.map(p => `L${p.x},${p.y}`).join(' ')} L${chartPoints[chartPoints.length - 1].x},115 L${chartPoints[0].x},115 Z`;

  // Room status percentages for donut
  const roomPercentages = {
    occupied: (roomStatus.occupied / roomStatus.total) * 100,
    vacant: (roomStatus.vacant / roomStatus.total) * 100,
    maintenance: (roomStatus.maintenance / roomStatus.total) * 100,
    cleaning: (roomStatus.cleaning / roomStatus.total) * 100
  };

  // Weekly bookings max for bar height calculation
  const maxBooking = Math.max(...weeklyBookings.data.map(d => d.count));

  // Alert level to color mapping
  const levelColors = { good: '#4CAF50', warning: '#FFC107', critical: '#F44336' };

  return (
    <section className="admin-tab-content active">
      
      {/* PAGE HEADER + PERIOD FILTER */}
      <div className="page-header">
        <div className="left">
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Executive Dashboard</h2>
          <p>{today}</p>
        </div>
        <div className="right">
          <select
            className="floor-dropdown"
            style={{ minWidth: '140px' }}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
          <button className="btn btn-sm btn-outline-gold" onClick={() => fetchDashboardData(period)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
            Refresh
          </button>
        </div>
      </div>

      {/* KPI ROW — 4 Cards */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '22px' }}>
        <KpiCard label="TOTAL REVENUE" value={formatNumber(kpis.totalRevenue.value)} trend={kpis.totalRevenue.trend} trendDir={kpis.totalRevenue.trendDir} sub={kpis.totalRevenue.sub} />
        <KpiCard label="OCCUPANCY RATE" value={`${kpis.occupancyRate.value}%`} trend={kpis.occupancyRate.trend} trendDir={kpis.occupancyRate.trendDir} sub={kpis.occupancyRate.sub} />
        <KpiCard label="ADR (AVG DAILY RATE)" value={formatNumber(kpis.adr.value)} trend={kpis.adr.trend} trendDir={kpis.adr.trendDir} sub={kpis.adr.sub} />
        <KpiCard label="RevPAR" value={formatNumber(kpis.revpar.value)} trend={kpis.revpar.trend} trendDir={kpis.revpar.trendDir} sub={kpis.revpar.sub} />
      </div>

      {/* REVENUE AREA CHART — Full Width with Legend */}
      <div className="panel" style={{ marginBottom: '22px', padding: '28px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          
          {/* Chart Area */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="panel-header" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>Revenue Trend</h3>
            </div>
            <div style={{ position: 'relative', height: '180px' }}>
              <svg viewBox="0 0 560 140" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                {/* Grid Lines */}
                <line x1="40" y1="10" x2="540" y2="10" stroke="var(--border-light)" strokeDasharray="3 3" />
                <line x1="40" y1="45" x2="540" y2="45" stroke="var(--border-light)" strokeDasharray="3 3" />
                <line x1="40" y1="80" x2="540" y2="80" stroke="var(--border-light)" strokeDasharray="3 3" />
                <line x1="40" y1="115" x2="540" y2="115" stroke="var(--border-light)" strokeDasharray="3 3" />
                
                {/* Y-Axis Labels */}
                <text x="35" y="14" fontSize="10" fill="var(--text-muted)" textAnchor="end">{formatCompact(maxRevenue)}</text>
                <text x="35" y="49" fontSize="10" fill="var(--text-muted)" textAnchor="end">{formatCompact(maxRevenue * 0.66)}</text>
                <text x="35" y="84" fontSize="10" fill="var(--text-muted)" textAnchor="end">{formatCompact(maxRevenue * 0.33)}</text>
                <text x="35" y="119" fontSize="10" fill="var(--text-muted)" textAnchor="end">0</text>

                {/* Area Fill */}
                <path d={areaPath} fill="rgba(201,168,76,0.12)" />
                
                {/* Line */}
                <polyline points={polylinePoints} fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                
                {/* Data Points */}
                {chartPoints.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--bg-card)" stroke="var(--gold)" strokeWidth="2" />
                ))}

                {/* X-Axis Labels */}
                {revenueTrend.labels.map((label, i) => (
                  <text key={i} x={chartPoints[i].x} y="135" fontSize="10" fill="var(--text-muted)" textAnchor="middle">{label}</text>
                ))}
              </svg>
            </div>
          </div>

          {/* Right Legend / Stats */}
          <div style={{ width: '200px', paddingLeft: '32px', borderLeft: '1px solid var(--border-light)', marginLeft: '32px', display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '8px' }}>
            <div>
              <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>This Week</span>
              <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>{formatNumber(revenueTrend.thisWeekTotal)}</div>
            </div>
            <div>
              <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Week</span>
              <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-muted)', marginTop: '4px' }}>{formatNumber(revenueTrend.lastWeekTotal)}</div>
            </div>
            <div>
              <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Growth</span>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#2E7D32', marginTop: '4px' }}>{revenueTrend.growth}</div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW — 3 Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '22px' }}>
        
        {/* Panel 1: Departmental Alerts */}
        <div className="panel" style={{ padding: '24px 28px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)', marginBottom: '20px' }}>Dept. Health</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {departmentHealth.map((item) => (
              <AlertRow key={item.id} color={levelColors[item.level]} dept={item.dept} status={item.status} />
            ))}
          </div>
        </div>

        {/* Panel 2: Room Status Donut */}
        <div className="panel" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)', marginBottom: '20px', alignSelf: 'flex-start' }}>Room Status</h3>
          
          {/* Donut Chart */}
          <div style={{ position: 'relative', width: '150px', height: '150px', marginBottom: '20px' }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="18" cy="18" r="14" fill="none" stroke="#4a3728" strokeWidth="4" strokeDasharray={`${roomPercentages.occupied} ${100 - roomPercentages.occupied}`} strokeDashoffset="0" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#C9A84C" strokeWidth="4" strokeDasharray={`${roomPercentages.vacant} ${100 - roomPercentages.vacant}`} strokeDashoffset={`-${roomPercentages.occupied}`} />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray={`${roomPercentages.maintenance} ${100 - roomPercentages.maintenance}`} strokeDashoffset={`-${roomPercentages.occupied + roomPercentages.vacant}`} />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#E65100" strokeWidth="4" strokeDasharray={`${roomPercentages.cleaning} ${100 - roomPercentages.cleaning}`} strokeDashoffset={`-${roomPercentages.occupied + roomPercentages.vacant + roomPercentages.maintenance}`} />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{roomStatus.total}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>rooms</div>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', width: '100%' }}>
            <LegendDot color="#4a3728" label="Occupied" value={roomStatus.occupied} />
            <LegendDot color="#C9A84C" label="Vacant" value={roomStatus.vacant} />
            <LegendDot color="#3b82f6" label="Maintenance" value={roomStatus.maintenance} />
            <LegendDot color="#E65100" label="Cleaning" value={roomStatus.cleaning} />
          </div>
        </div>

        {/* Panel 3: Weekly Bookings Bar Chart */}
        <div className="panel" style={{ padding: '24px 28px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)', marginBottom: '20px' }}>Weekly Bookings</h3>
          
          {/* Bar Chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '140px', gap: '8px', paddingBottom: '24px', borderBottom: '1px solid var(--border-light)', position: 'relative' }}>
            {weeklyBookings.data.map((item, i) => (
              <BarItem key={i} label={item.day} height={(item.count / maxBooking) * 100} />
            ))}
          </div>

          {/* Summary */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>{weeklyBookings.total}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Avg/Day</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>{weeklyBookings.avgPerDay}</div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}

/* ============================================================
   HELPER FUNCTIONS
   ============================================================ */

function formatNumber(num) {
  return num.toLocaleString();
}

function formatCompact(num) {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */

function KpiCard({ label, value, trend, trendDir, sub }) {
  return (
    <div className="kpi-card">
      <span className="lbl">{label}</span>
      <span className="val">{value}</span>
      <span className="sub">
        <span className={trendDir === 'up' ? 'trend-up' : 'trend-down'} style={{ fontWeight: 'bold' }}>
          {trendDir === 'up' ? '▲' : '▼'} {trend}
        </span>
        {' '}{sub}
      </span>
    </div>
  );
}

function AlertRow({ color, dept, status }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 6px ${color}40` }}></span>
      <span style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)' }}>{dept}</span>
      <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>{status}</span>
    </div>
  );
}

function LegendDot({ color, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: color, flexShrink: 0 }}></span>
      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function BarItem({ label, height }) {
  const maxHeight = 120;
  const barH = (height / 100) * maxHeight;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '6px' }}>
      <div style={{ width: '100%', maxWidth: '28px', height: `${barH}px`, background: 'linear-gradient(180deg, var(--gold) 0%, #4a3728 100%)', borderRadius: '4px 4px 0 0', transition: 'height 0.3s ease' }}></div>
      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '500', position: 'absolute', bottom: '-20px' }}>{label}</span>
    </div>
  );
}

export default Overview;

import { useState, useEffect, useCallback } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './AnalyticsPanel.css';

const API_URL = 'http://localhost:8000/api/requests';
const COLORS = ['#4CAF50', '#2196F3', '#FFC107', '#9C27B0', '#00BCD4', '#FF5722', '#607D8B'];

function AnalyticsPanel() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      const data = await response.json();
      setTickets(data);
    } catch (err) {
      console.error('Ошибка загрузки аналитики:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return <div className="loading-analytics">Загрузка аналитики...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <h3>⚠️ Ошибка загрузки данных</h3>
          <p>{error}</p>
          <button onClick={fetchAnalytics} className="btn-retry">
            🔄 Повторить
          </button>
        </div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="no-data">
        <h3>📭 Нет данных для отображения</h3>
        <p>Обращения пока не добавлены в систему</p>
      </div>
    );
  }

  // Группировка по эмоциям
  const emotionDistribution = Object.entries(
    tickets.reduce((acc, t) => {
      acc[t.emotion] = (acc[t.emotion] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Группировка по устройствам
  const deviceDistribution = Object.entries(
    tickets.reduce((acc, t) => {
      acc[t.deviceType] = (acc[t.deviceType] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Группировка по датам
  const ticketsByDay = Object.entries(
    tickets.reduce((acc, t) => {
      acc[t.date] = (acc[t.date] || 0) + 1;
      return acc;
    }, {})
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => ({ day, count }));

  // Группировка по объектам
  const objectDistribution = Object.entries(
    tickets.reduce((acc, t) => {
      acc[t.object] = (acc[t.object] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const stats = [
    { label: 'Всего обращений', value: tickets.length, icon: '📊' },
    { label: 'Уникальных объектов', value: new Set(tickets.map((t) => t.object)).size, icon: '🏢' },
    { label: 'Типов устройств', value: new Set(tickets.map((t) => t.deviceType)).size, icon: '🔧' },
    { label: 'Дней записей', value: new Set(tickets.map((t) => t.date)).size, icon: '📅' },
  ];

  return (
    <div className="analytics-panel">
      <h2>📈 Аналитика обращений</h2>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <span className="stat-icon">{stat.icon}</span>
            <div className="stat-info">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <h3>Эмоции клиентов</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={emotionDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label
              >
                {emotionDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Типы устройств</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deviceDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#667eea" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card full-width">
          <h3>Динамика обращений по дням</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ticketsByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#4CAF50" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-card full-width">
        <h3>Объекты</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={objectDistribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#FF9800" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default AnalyticsPanel;

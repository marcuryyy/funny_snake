import { useState, useEffect, useCallback } from 'react';
import NewRequestModal from './NewRequestModal';
import './TicketsTable.css';

const API_URL = 'http://localhost:8000/api/requests';

const emotionIcons = {
  гнев: '😠',
  раздражение: '😤',
  тревога: '😰',
  разочарование: '😞',
  удивление: '😮',
  спокойствие: '😌',
};

function TicketsTable({ onTicketSelect }) {
  const [tickets, setTickets] = useState([]);
  const [filterEmotion, setFilterEmotion] = useState('all');
  const [filterDevice, setFilterDevice] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);

  const fetchTickets = useCallback(async () => {
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
      console.error('Ошибка загрузки обращений:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesEmotion = filterEmotion === 'all' || ticket.emotion === filterEmotion;
    const matchesDevice = filterDevice === 'all' || ticket.deviceType === filterDevice;
    const matchesSearch =
      ticket.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.object.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesEmotion && matchesDevice && matchesSearch;
  });

  const emotions = [...new Set(tickets.map((t) => t.emotion))];
  const devices = [...new Set(tickets.map((t) => t.deviceType))];

  const exportToCSV = () => {
    const headers = ['ID', 'ФИО', 'Объект', 'Телефон', 'Email', 'Устройство', 'Серийный номер', 'Эмоция', 'Проблема', 'Дата'];
    const rows = filteredTickets.map((t) => [
      t.id,
      t.fullName,
      t.object,
      t.phone,
      t.email,
      t.deviceType,
      t.serialNumbers,
      t.emotion,
      t.issue,
      t.date,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `requests_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleNewRequestSuccess = () => {
    fetchTickets();
    setIsNewRequestModalOpen(false);
  };

  if (loading) {
    return <div className="loading">Загрузка обращений...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <h3>⚠️ Ошибка загрузки данных</h3>
          <p>{error}</p>
          <button onClick={fetchTickets} className="btn-retry">
            🔄 Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tickets-table-container">
      <div className="tickets-header">
        <h2>Обращения</h2>
        <div className="header-actions">
          <button className="btn-new" onClick={() => setIsNewRequestModalOpen(true)}>
            + Новое обращение
          </button>
          <button className="btn-refresh" onClick={fetchTickets}>
            🔄 Обновить
          </button>
          <button className="btn-export" onClick={exportToCSV}>
            📥 Выгрузить CSV
          </button>
        </div>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="🔍 Поиск по ФИО, объекту или проблеме..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select value={filterEmotion} onChange={(e) => setFilterEmotion(e.target.value)}>
          <option value="all">Все эмоции</option>
          {emotions.map((emotion) => (
            <option key={emotion} value={emotion}>
              {emotion}
            </option>
          ))}
        </select>
        <select value={filterDevice} onChange={(e) => setFilterDevice(e.target.value)}>
          <option value="all">Все устройства</option>
          {devices.map((device) => (
            <option key={device} value={device}>
              {device}
            </option>
          ))}
        </select>
      </div>

      <div className="tickets-table-wrapper">
        <table className="tickets-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Дата</th>
              <th>ФИО</th>
              <th>Объект</th>
              <th>Телефон</th>
              <th>Email</th>
              <th>Устройство</th>
              <th>Серийный номер</th>
              <th>Эмоция</th>
              <th>Проблема</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((ticket) => (
              <tr key={ticket.id} onClick={() => onTicketSelect && onTicketSelect(ticket)}>
                <td className="id-cell">#{ticket.id}</td>
                <td className="date-cell">{ticket.date}</td>
                <td className="name-cell">{ticket.fullName}</td>
                <td>{ticket.object}</td>
                <td>{ticket.phone || '—'}</td>
                <td>{ticket.email || '—'}</td>
                <td className="device-type-cell">{ticket.deviceType}</td>
                <td>{ticket.serialNumbers || '—'}</td>
                <td className="emotion-cell">
                  <span className="emotion-badge">
                    {emotionIcons[ticket.emotion] || '😐'} {ticket.emotion}
                  </span>
                </td>
                <td className="issue-cell" title={ticket.issue}>{ticket.issue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredTickets.length === 0 && (
        <div className="no-results">Нет обращений по заданным фильтрам</div>
      )}

      {isNewRequestModalOpen && (
        <NewRequestModal
          onClose={() => setIsNewRequestModalOpen(false)}
          onSuccess={handleNewRequestSuccess}
        />
      )}
    </div>
  );
}

export default TicketsTable;

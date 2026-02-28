import { useState, useEffect, useCallback } from 'react';
import TicketCard from './TicketCard';
import AddTicketModal from './AddTicketModal';
import './TicketsTable.css';

const API_URL = 'http://localhost:8000/api/requests';
const CSV_URL = 'http://localhost:8000/api/getCsv';

function TicketsTable({ onTicketSelect }) {
  const [tickets, setTickets] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filterEmotion, setFilterEmotion] = useState('');
  const [filterDevice, setFilterDevice] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableEmotions, setAvailableEmotions] = useState([]);
  const [availableDevices, setAvailableDevices] = useState([]);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', limit);
      
      if (searchTerm) {
        params.set('full_name', searchTerm);
      }
      if (filterEmotion) {
        params.set('emotion', filterEmotion);
      }
      if (filterDevice) {
        params.set('device_type', filterDevice);
      }
      if (dateFrom) {
        params.set('date_from', dateFrom);
      }
      if (dateTo) {
        params.set('date_to', dateTo);
      }

      const response = await fetch(`${API_URL}?${params.toString()}`);
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
  }, [page, limit, filterEmotion, filterDevice, searchTerm, dateFrom, dateTo]);

  const fetchFilters = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}?page=1&limit=1000`);
      if (response.ok) {
        const data = await response.json();
        setAvailableEmotions([...new Set(data.map((t) => t.emotion))]);
        setAvailableDevices([...new Set(data.map((t) => t.deviceType))]);
      }
    } catch (err) {
      console.error('Ошибка загрузки фильтров:', err);
    }
  }, []);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleAddSuccess = () => {
    setShowAddModal(false);
    fetchTickets();
  };

  const exportToCSV = () => {
    const headers = ['ID', 'ФИО', 'Объект', 'Телефон', 'Email', 'Устройство', 'Серийный номер', 'Эмоция', 'Проблема', 'Дата'];
    const rows = filteredTickets.map((t) => [
      t.id,
      t.fullName,
      t.object,
      t.phone,
      t.email,
      t.deviceType,
      t.factoryNumber,
      t.emotion,
      t.issue,
      t.date,
    ]);

    const url = `${CSV_URL}?${params.toString()}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return <div className="loading">Загрузка обращений...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <h3>Ошибка загрузки данных</h3>
          <p>{error}</p>
          <button onClick={fetchTickets} className="btn-retry">
            Повторить
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
          <button className="btn-add" onClick={() => setShowAddModal(true)}>
            Добавить
          </button>
          <button className="btn-refresh" onClick={fetchTickets}>
            Обновить
          </button>
          <button className="btn-export" onClick={exportToCSV}>
            Выгрузить CSV
          </button>
        </div>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Поиск по ФИО..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="search-input"
        />
        <select 
          value={filterEmotion} 
          onChange={(e) => {
            setFilterEmotion(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Все эмоции</option>
          {availableEmotions.map((emotion) => (
            <option key={emotion} value={emotion}>
              {emotion}
            </option>
          ))}
        </select>
        <select 
          value={filterDevice} 
          onChange={(e) => {
            setFilterDevice(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Все устройства</option>
          {availableDevices.map((device) => (
            <option key={device} value={device}>
              {device}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
          className="date-input"
          placeholder="С даты"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
          className="date-input"
          placeholder="По дату"
        />
      </div>

      <div className="tickets-grid">
        {tickets.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} onSelect={onTicketSelect} />
        ))}
      </div>

      {tickets.length === 0 && (
        <div className="no-results">Нет обращений по заданным фильтрам</div>
      )}

      <div className="pagination">
        <button 
          className="btn-page" 
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Назад
        </button>
        <span className="page-info">Страница {page}</span>
        <button 
          className="btn-page"
          onClick={() => setPage(p => p + 1)}
          disabled={tickets.length < limit}
        >
          Вперёд
        </button>
      </div>

      {showAddModal && (
        <AddTicketModal onClose={() => setShowAddModal(false)} onAddSuccess={handleAddSuccess} />
      )}
    </div>
  );
}

export default TicketsTable;

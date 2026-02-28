import { useState, useEffect, useCallback, useRef } from 'react';
import AddTicketModal from './AddTicketModal';
import './TicketsTable.css';

const API_URL = 'http://localhost:8000/api/requests';
const CSV_URL = 'http://localhost:8000/api/getCsv';
const EXCEL_URL = 'http://localhost:8000/api/getExcel';

const EMOTION_FILTERS = [
  { value: '', label: 'Все эмоции' },
  { value: 'нейтральное', label: 'Нейтральное' },
  { value: 'негативное', label: 'Негативное' },
  { value: 'позитивное', label: 'Позитивное' },
];

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
  const [availableDevices, setAvailableDevices] = useState([]);
  const [viewMode, setViewMode] = useState('table');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportButtonRef = useRef(null);

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

  const getExportParams = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('full_name', searchTerm);
    if (filterEmotion) params.set('emotion', filterEmotion);
    if (filterDevice) params.set('device_type', filterDevice);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    return params.toString();
  };

  const exportToCSV = () => {
    const params = getExportParams();
    const url = `${CSV_URL}?${params}`;
    window.open(url, '_blank');
    setShowExportMenu(false);
  };

  const exportToExcel = () => {
    const params = getExportParams();
    const url = `${EXCEL_URL}?${params}`;
    window.open(url, '_blank');
    setShowExportMenu(false);
  };

  const toggleExportMenu = () => {
    setShowExportMenu(!showExportMenu);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportButtonRef.current && !exportButtonRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

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
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              Таблица
            </button>
            <button
              className={`toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
            >
              Карточки
            </button>
          </div>
          <button className="btn-add" onClick={() => setShowAddModal(true)}>
            Добавить
          </button>
          <button className="btn-refresh" onClick={fetchTickets}>
            Обновить
          </button>
          <div className="export-dropdown" ref={exportButtonRef}>
            <button className="btn-export" onClick={toggleExportMenu}>
              Экспорт
            </button>
            {showExportMenu && (
              <div className="export-menu">
                <button className="export-menu-item" onClick={exportToCSV}>
                  CSV
                </button>
                <button className="export-menu-item" onClick={exportToExcel}>
                  Excel
                </button>
              </div>
            )}
          </div>
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
          {EMOTION_FILTERS.map((emotion) => (
            <option key={emotion.value} value={emotion.value}>
              {emotion.label}
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

      {viewMode === 'table' ? (
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
                <th>Заводской номер</th>
                <th>Эмоция</th>
                <th>Проблема</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => onTicketSelect && onTicketSelect(ticket)}
                  className="table-row-clickable"
                >
                  <td className="id-cell">#{ticket.id}</td>
                  <td className="date-cell">{ticket.date}</td>
                  <td className="name-cell">{ticket.fullName}</td>
                  <td>{ticket.object}</td>
                  <td>{ticket.phone || '—'}</td>
                  <td>{ticket.email || '—'}</td>
                  <td>{ticket.deviceType}</td>
                  <td>{ticket.factoryNumber || '—'}</td>
                  <td>
                    <span className="emotion-badge">{ticket.emotion}</span>
                  </td>
                  <td className="issue-cell" title={ticket.issue}>
                    {ticket.issue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="tickets-grid">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="ticket-card"
              onClick={() => onTicketSelect && onTicketSelect(ticket)}
            >
              <div className="ticket-header">
                <span className="emotion-badge">{ticket.emotion}</span>
              </div>
              <h3 className="ticket-issue">{ticket.issue}</h3>
              <p className="ticket-name">{ticket.fullName}</p>
              <p className="ticket-object">{ticket.object}</p>
              <div className="ticket-footer">
                {ticket.phone && <span className="ticket-phone">{ticket.phone}</span>}
                <span className="ticket-date">{ticket.date}</span>
              </div>
            </div>
          ))}
        </div>
      )}

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

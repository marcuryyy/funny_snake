import { useState } from 'react';
import './TicketDetail.css';

const STATUS_OPTIONS = [
  { value: 'new', label: 'Новый', color: '#1976d2' },
  { value: 'in_progress', label: 'В работе', color: '#f57c00' },
  { value: 'closed', label: 'Закрыт', color: '#388e3c' },
];

function TicketDetail({ ticket, onClose }) {
  const [response, setResponse] = useState(ticket.response || '');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(ticket.status || 'new');

  const currentStatus = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    // Здесь будет API вызов для обновления статуса
    console.log('Статус изменён на:', newStatus);
  };

  const handleSendResponse = async () => {
    if (!response.trim()) {
      alert('Введите текст ответа');
      return;
    }

    setSending(true);
    try {
      // Здесь будет отправка ответа через API
      await new Promise((resolve) => setTimeout(resolve, 500));
      alert(`Ответ отправлен клиенту ${ticket.fullName}`);
      onClose();
    } catch (error) {
      console.error('Ошибка отправки ответа:', error);
      alert('Ошибка при отправке ответа');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="ticket-detail-overlay" onClick={onClose}>
      <div className="ticket-detail" onClick={(e) => e.stopPropagation()}>
        <div className="ticket-detail-header">
          <h2>Обращение #{ticket.id}</h2>
          <button className="btn-close" onClick={onClose} disabled={sending}>
            Закрыть
          </button>
        </div>

        <div className="ticket-status-bar">
          <span className="status-label">Статус:</span>
          <div className="status-selector">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`status-option ${status === opt.value ? 'active' : ''}`}
                style={{ borderColor: opt.color }}
                onClick={() => handleStatusChange(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span 
            className="status-badge-detail" 
            style={{ backgroundColor: currentStatus.color }}
          >
            {currentStatus.label}
          </span>
        </div>

        <div className="ticket-info-grid">
          <div className="info-item full-width">
            <label>ФИО:</label>
            <span>{ticket.fullName}</span>
          </div>
          <div className="info-item">
            <label>Объект:</label>
            <span>{ticket.object}</span>
          </div>
          <div className="info-item">
            <label>Телефон:</label>
            <span>{ticket.phone || '—'}</span>
          </div>
          <div className="info-item">
            <label>Email:</label>
            <span>{ticket.email || '—'}</span>
          </div>
          <div className="info-item">
            <label>Устройство:</label>
            <span>{ticket.deviceType}</span>
          </div>
          <div className="info-item">
            <label>Серийный номер:</label>
            <span>{ticket.serialNumbers || '—'}</span>
          </div>
          <div className="info-item">
            <label>Эмоция:</label>
            <span className="emotion-badge-detail">{ticket.emotion}</span>
          </div>
          <div className="info-item">
            <label>Дата:</label>
            <span>{ticket.date}</span>
          </div>
          <div className="info-item full-width">
            <label>Проблема:</label>
            <span className="issue-text">{ticket.issue}</span>
          </div>
        </div>

        <div className="response-section">
          <h3>Ответ клиенту</h3>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Введите ответ клиенту..."
            rows={6}
            className="response-textarea"
            disabled={sending}
          />
          <div className="action-buttons">
            <button
              className="btn-send"
              onClick={handleSendResponse}
              disabled={sending || !response.trim()}
            >
              {sending ? 'Отправка...' : 'Отправить ответ'}
            </button>
            <button
              className="btn-secondary"
              onClick={onClose}
              disabled={sending}
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketDetail;

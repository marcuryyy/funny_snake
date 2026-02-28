import { useState } from 'react';
import './TicketDetail.css';

function TicketDetail({ ticket, onClose }) {
  const [response, setResponse] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendResponse = async () => {
    if (!response.trim()) {
      alert('Введите текст ответа');
      return;
    }

    setSending(true);
    try {
      // Здесь будет отправка ответа через API
      // Пока просто имитируем отправку
      await new Promise((resolve) => setTimeout(resolve, 500));
      alert(`Ответ отправлен клиенту ${ticket.fullName}`);
      setResponse('');
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
            ✕
          </button>
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
            <span>{ticket.factoryNumber || '—'}</span>
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
          <h3>📝 Ответ клиенту</h3>
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
              {sending ? '⏳ Отправка...' : '✉️ Отправить ответ'}
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

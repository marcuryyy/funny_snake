import { useState } from 'react';
import './AddTicketModal.css';

const API_URL = 'http://localhost:8000/api/requests';

const EMOTION_OPTIONS = [
  { value: 'гнев', label: 'Гнев' },
  { value: 'раздражение', label: 'Раздражение' },
  { value: 'тревога', label: 'Тревога' },
  { value: 'разочарование', label: 'Разочарование' },
  { value: 'удивление', label: 'Удивление' },
  { value: 'спокойствие', label: 'Спокойствие' },
];

function AddTicketModal({ onClose, onAddSuccess }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    fullName: '',
    object: '',
    phone: '',
    email: '',
    factoryNumber: '',
    deviceType: '',
    emotion: 'спокойствие',
    issue: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.object || !formData.issue) {
      setError('Заполните обязательные поля (ФИО, Объект, Проблема)');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }

      onAddSuccess();
    } catch (err) {
      console.error('Ошибка создания обращения:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-ticket-overlay" onClick={onClose}>
      <div className="add-ticket-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Новое обращение</h2>
          <button className="btn-close" onClick={onClose} disabled={submitting}>
            Закрыть
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-ticket-form">
          {error && <div className="form-error">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Дата *</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fullName">ФИО *</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Иванов Иван Иванович"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="object">Объект *</label>
              <input
                type="text"
                id="object"
                name="object"
                value={formData.object}
                onChange={handleChange}
                placeholder="Название объекта"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Телефон</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+7 (999) 000-00-00"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@mail.ru"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="deviceType">Тип устройства</label>
              <input
                type="text"
                id="deviceType"
                name="deviceType"
                value={formData.deviceType}
                onChange={handleChange}
                placeholder="Например: Тепловизор"
              />
            </div>
            <div className="form-group">
              <label htmlFor="factoryNumber">Серийный номер</label>
              <input
                type="text"
                id="factoryNumber"
                name="factoryNumber"
                value={formData.factoryNumber}
                onChange={handleChange}
                placeholder="Заводской номер"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Эмоция *</label>
              <div className="emotion-selector">
                {EMOTION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`emotion-option ${formData.emotion === option.value ? 'selected' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, emotion: option.value }))}
                  >
                    <span className="emotion-label">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="issue">Проблема *</label>
              <textarea
                id="issue"
                name="issue"
                value={formData.issue}
                onChange={handleChange}
                placeholder="Опишите проблему..."
                rows={5}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={submitting}>
              Отмена
            </button>
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTicketModal;

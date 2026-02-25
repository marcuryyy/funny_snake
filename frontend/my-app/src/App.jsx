import React, { useState, useEffect } from 'react';

const emptyForm = {
  date: '',
  fullName: '',
  object: '',
  phone: '',
  email: '',
  serialNumbers: '',
  deviceType: '',
  emotion: '',
  issue: ''
};

export default function RequestsTable() {
  const [records, setRecords] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/requests');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Получены данные:", data);
      setRecords(data);
    } catch (error) {
      console.error("Ошибка при загрузке данных:", error);
      setRecords([]); 
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка сохранения: ${response.status}`);
      }

      const createdRecord = await response.json();
      
      setRecords([...records, createdRecord]);
      setFormData(emptyForm); 
    } catch (error) {
      console.error("Ошибка при сохранении данных:", error);
      alert("Не удалось сохранить запись. Проверьте консоль.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Журнал обращений</h2>
      <div style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h3>Добавить новую запись</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
          <input type="text" name="fullName" placeholder="ФИО" value={formData.fullName} onChange={handleInputChange} required />
          <input type="text" name="object" placeholder="Объект" value={formData.object} onChange={handleInputChange} required />
          <input type="tel" name="phone" placeholder="Телефон" value={formData.phone} onChange={handleInputChange} />
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} />
          <input type="text" name="serialNumbers" placeholder="Заводские номера" value={formData.serialNumbers} onChange={handleInputChange} />
          <input type="text" name="deviceType" placeholder="Тип приборов" value={formData.deviceType} onChange={handleInputChange} />
          <select name="emotion" value={formData.emotion} onChange={handleInputChange} required>
            <option value="" disabled>Эмоциональный окрас</option>
            <option value="Позитивный">Позитивный</option>
            <option value="Нейтральный">Нейтральный</option>
            <option value="Негативный">Негативный</option>
            <option value="Агрессивный">Агрессивный</option>
          </select>
          <input type="text" name="issue" placeholder="Суть вопроса" value={formData.issue} onChange={handleInputChange} style={{ flexGrow: 1 }} required />
          
          <button type="submit" style={{ padding: '5px 15px', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '3px' }}>
            Добавить
          </button>
        </form>
      </div>

      {loading ? (
        <p>Загрузка данных...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ backgroundColor: '#080303ff', borderBottom: '2px solid #ddd', color: '#fff' }}>
                <th style={thStyle}>Дата</th>
                <th style={thStyle}>ФИО</th>
                <th style={thStyle}>Объект</th>
                <th style={thStyle}>Телефон</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Заводские номера</th>
                <th style={thStyle}>Тип приборов</th>
                <th style={thStyle}>Эмоциональный окрас</th>
                <th style={thStyle}>Суть вопроса</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ ...tdStyle, textAlign: 'center', color: '#777', fontStyle: 'italic' }}>
                    Нет записей. Добавьте первую запись выше.
                  </td>
                </tr>
              ) : (
                records.map((record, index) => (
                  <tr key={record.id || index} style={{ borderBottom: '1px solid #eee', hover: { backgroundColor: '#f9f9f9' } }}>
                    <td style={tdStyle}>{record.date || record.req_date ? new Date(record.date || record.req_date).toLocaleDateString() : '-'}</td>
                    <td style={tdStyle}>{record.fullName || record.full_name || '-'}</td>
                    <td style={tdStyle}>{record.object || record.object_name || '-'}</td>
                    <td style={tdStyle}>{record.phone || '-'}</td>
                    <td style={tdStyle}>{record.email || '-'}</td>
                    <td style={tdStyle}>{record.serialNumbers || record.serial_numbers || '-'}</td>
                    <td style={tdStyle}>{record.deviceType || record.device_type || '-'}</td>
                    <td style={tdStyle}>{record.emotion || '-'}</td>
                    <td style={tdStyle}>{record.issue || record.question_summary || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle = { padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' };
const tdStyle = { padding: '12px', border: '1px solid #ddd' };
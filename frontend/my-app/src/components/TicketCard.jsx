import './TicketCard.css';

function TicketCard({ ticket, onSelect }) {
  const emotionColors = {
    гнев: 'emotion-angry',
    раздражение: 'emotion-annoyed',
    тревога: 'emotion-worried',
    разочарование: 'emotion-disappointed',
    удивление: 'emotion-surprised',
    спокойствие: 'emotion-calm',
  };

  const emotionIcons = {
    гнев: '😠',
    раздражение: '😤',
    тревога: '😰',
    разочарование: '😞',
    удивление: '😮',
    спокойствие: '😌',
  };

  return (
    <div className={`ticket-card ${emotionColors[ticket.emotion] || ''}`} onClick={() => onSelect(ticket)}>
      <div className="ticket-header">
        <span className="emotion-badge">
          {emotionIcons[ticket.emotion] || '😐'} {ticket.emotion}
        </span>
        <span className="device-type">{ticket.deviceType}</span>
      </div>
      <h3 className="ticket-issue">{ticket.issue}</h3>
      <p className="ticket-name">👤 {ticket.fullName}</p>
      <p className="ticket-object">📍 {ticket.object}</p>
      <div className="ticket-footer">
        {ticket.phone && <span className="ticket-phone">📞 {ticket.phone}</span>}
        <span className="ticket-date">{ticket.date}</span>
      </div>
    </div>
  );
}

export default TicketCard;

import './TicketCard.css';

function TicketCard({ ticket, onSelect }) {
  return (
    <div className="ticket-card" onClick={() => onSelect(ticket)}>
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
  );
}

export default TicketCard;

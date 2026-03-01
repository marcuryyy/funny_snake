import { NavLink } from 'react-router-dom';
import { Mail, BarChart3 } from 'lucide-react';
import logo from '../assets/logo.svg';
import './Sidebar.css';

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src={logo} alt="Эрис" className="logo" />
        <h1>Эрис Support</h1>
        <p>Система обработки обращений</p>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Mail size={20} />
          <span>Обращения</span>
        </NavLink>

        <NavLink
          to="/analytics"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <BarChart3 size={20} />
          <span>Аналитика</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="avatar"></div>
          <div>
            <p className="user-name">Оператор</p>
            <p className="user-status">Онлайн</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;

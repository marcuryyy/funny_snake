import { NavLink } from 'react-router-dom';
import { Mail, BarChart3 } from 'lucide-react';
import logo from '../assets/logo.svg';
import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <img src={logo} alt="Эрис" className="logo" />
        <span className="site-name">Эрис Support</span>
      </div>

      <nav className="header-nav">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Mail size={18} />
          <span>Обращения</span>
        </NavLink>

        <NavLink
          to="/analytics"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <BarChart3 size={18} />
          <span>Аналитика</span>
        </NavLink>
      </nav>

      <div className="header-right">
        <span className="user-status">Оператор</span>
      </div>
    </header>
  );
}

export default Header;

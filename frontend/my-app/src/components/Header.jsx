import { NavLink, useNavigate } from 'react-router-dom';
import { Mail, BarChart3, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.svg';
import './Header.css';

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
        {user && <span className="user-status">{user.username}</span>}
        <button className="logout-button" onClick={handleLogout} title="Выйти">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

export default Header;

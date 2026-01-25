/* eslint-disable prettier/prettier */
import { Link } from "react-router-dom";
import icon from '../assets/logo/icon.png';
import ThemeToggle from "./ThemeToggle";

function Header() {
  return (
    <header className="app-header">
      <nav className="logo">
        <Link to="/home" className="logo-link">
          <img src={icon} alt="ugo logo" className="logo-image" />
          <span className="logo-text">uGo Nepal Student Management App</span>
        </Link>
      </nav>
      <nav className="actions header-actions">
        <div className="action">
          <Link to="/home" className="action-btn">Home</Link>
        </div>
        <div className="action">
          <Link to="/add-student" className="action-btn">Add Student</Link>
        </div>
        <div className="action">
          <Link to="/import" className="action-btn">Import Excel</Link>
        </div>
        <ThemeToggle />
      </nav>
    </header>
  );
}
export default Header;
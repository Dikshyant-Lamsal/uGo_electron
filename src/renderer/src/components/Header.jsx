/* eslint-disable prettier/prettier */
import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="app-header">
      <nav className="actions header-actions">
        <div className="action">
          <Link to="/home" className="action-btn">Home</Link>
        </div>
        <div className="action">
          <Link to="/add-student" className="action-btn">Add Student</Link>
        </div>
        <div className="action">
          <Link to="/test" className="action-btn">Test Backend</Link>
        </div>
      </nav>
    </header>
  );
}
export default Header;
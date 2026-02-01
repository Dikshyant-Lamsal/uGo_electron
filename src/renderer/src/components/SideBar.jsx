/* eslint-disable prettier/prettier */
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import icon from '../assets/logo/icon.png';

export default function Sidebar({ onThemeToggle, currentTheme }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    const toggleMobileSidebar = () => {
        setIsMobileOpen(!isMobileOpen);
    };

    const closeMobileSidebar = () => {
        setIsMobileOpen(false);
    };

    const navItems = [
        { path: '/', icon: '🏠', label: 'Home' },
        { path: '/records', icon: '📋', label: 'Records' },
        { path: '/add-student', icon: '➕', label: 'Add Student' },
        { path: '/import', icon: "📥", label: 'Import Records' },
        { path: '/statistics', icon: "📊", label: 'Statistics' },
    ];

    return (
        <>
            {/* Sidebar */}
            <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
                {/* Sidebar Header */}
                <div className="sidebar-header">
                    <a href="/" className="sidebar-logo">
                        <img 
                            src={icon} 
                            alt="Logo" 
                            className="sidebar-logo-image"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                        <span className="sidebar-logo-text">Student Portal</span>
                    </a>
                    <button 
                        className="sidebar-toggle"
                        onClick={toggleSidebar}
                        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {isCollapsed ? '▶' : '◀'}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    <ul className="sidebar-nav-list">
                        {navItems.map((item) => (
                            <li key={item.path} className="sidebar-nav-item">
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `sidebar-nav-link ${isActive ? 'active' : ''}`
                                    }
                                    onClick={closeMobileSidebar}
                                >
                                    <span className="sidebar-nav-icon">{item.icon}</span>
                                    <span className="sidebar-nav-text">{item.label}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Sidebar Footer */}
                <div className="sidebar-footer">
                    <button 
                        className="theme-toggle"
                        onClick={onThemeToggle}
                        title="Toggle theme"
                    >
                        <span>{currentTheme === 'dark' ? '🌙' : '☀️'}</span>
                        <span className="theme-toggle-text">
                            {currentTheme === 'dark' ? 'Dark' : 'Light'}
                        </span>
                    </button>
                </div>
            </aside>

            {/* Mobile Sidebar Toggle Button */}
            <button
                className="mobile-sidebar-toggle"
                onClick={toggleMobileSidebar}
                title="Toggle sidebar"
            >
                ☰
            </button>

            {/* Overlay for mobile */}
            <div 
                className={`sidebar-overlay ${isMobileOpen ? 'active' : ''}`}
                onClick={closeMobileSidebar}
            />
        </>
    );
}
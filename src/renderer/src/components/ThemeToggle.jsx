/* eslint-disable prettier/prettier */
import React from 'react';
import { useTheme } from '../components/ThemeContext';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
    );
};

export default ThemeToggle;
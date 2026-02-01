import Home from './pages/Home'
import AddStudent from './pages/AddStudent'
import EditStudent from './pages/EditStudent'
import TestBackend from './components/TestBackend'
import View from './pages/RecordView'
import ImportStudents from './components/ImportStudents'
import Sidebar from './components/SideBar'
import Statistics from './pages/Statistics'
import Records from './pages/Records'
import { ThemeProvider, useTheme } from './components/ThemeContext'
import { HashRouter, Route, Routes } from 'react-router-dom'
import Header from './components/Header'

function AppContent() {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <Sidebar onThemeToggle={toggleTheme} currentTheme={theme} />
      

      <div id="root">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/add-student" element={<AddStudent />} />
          <Route path="/edit-student" element={<EditStudent />} />
          <Route path="/records" element={<Records />} />
          <Route path="/records/:id" element={<View />} />
          <Route path="/edit/:id" element={<EditStudent />} />
          <Route path="/test" element={<TestBackend />} />
          <Route path="/import" element={<ImportStudents />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </ThemeProvider>
  )
}

export default App;
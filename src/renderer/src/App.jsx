import Home from './pages/Home'
import AddStudent from './pages/AddStudent'
import EditStudent from './pages/EditStudent'
import TestBackend from './components/TestBackend'
import View from './pages/RecordView'
import ImportStudents from './components/ImportStudents'
import { ThemeProvider, useTheme } from './components/ThemeContext'
import { HashRouter, Route, Routes } from 'react-router-dom'
import Header from './components/Header'

function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/add-student" element={<AddStudent />} />
          <Route path="/edit-student" element={<EditStudent />} />
          <Route path="/records" element={<Home />} />
          <Route path="/records/:id" element={<View />} />
          <Route path="/edit/:id" element={<EditStudent />} />
          <Route path="/test" element={<TestBackend />} />
          <Route path="/import" element={<ImportStudents />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  )
}

export default App

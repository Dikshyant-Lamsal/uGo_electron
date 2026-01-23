import Home from './pages/Home'
import AddStudent from './pages/AddStudent'
import EditStudent from './pages/EditStudent'
import TestBackend from './components/TestBackend'
import View from './pages/RecordView'
import UploadFile from './components/UploadFile'
import { HashRouter, Route, Routes } from 'react-router-dom'
import Header from './components/Header'

function App() {
  return (
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
        <Route path="/upload-file" element={<UploadFile />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </HashRouter>
  )
}

export default App

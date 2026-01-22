import Home from './pages/Home'
import AddStudent from './pages/AddStudent'
import EditStudent from './pages/EditStudent'
import View from './pages/RecordView'
import { HashRouter, Route, Routes } from 'react-router-dom'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/add-student" element={<AddStudent />} />
        <Route path="/edit-student" element={<EditStudent />} />
        <Route path="/records" element={<Home />} />
        <Route path="/records/:id" element={<View />} />
        <Route path="/edit/:id" element={<EditStudent />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </HashRouter>
  )
}

export default App

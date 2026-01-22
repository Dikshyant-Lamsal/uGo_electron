/* eslint-disable prettier/prettier */
import { useState } from 'react';
import Header from './Header.jsx';

function TestBackend() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const testGetStudents = async () => {
        setLoading(true);
        const res = await window.api.excel.getStudents({ page: 1, limit: 5 });
        setResult(JSON.stringify(res, null, 2));
        setLoading(false);
    };

    const testGetStats = async () => {
        setLoading(true);
        const res = await window.api.excel.getStats();
        setResult(JSON.stringify(res, null, 2));
        setLoading(false);
    };

    const testAddStudent = async () => {
        setLoading(true);
        const res = await window.api.excel.addStudent({
            Full_Name: "Test Student " + Date.now(),
            District: "Test District",
            Program: "Test Program",
            Source_Sheet: "C1"
        });
        setResult(JSON.stringify(res, null, 2));
        setLoading(false);
    };

    return (
        <div className="test-backend-page">
            <Header />
            <h1>Backend API Test Page</h1>

            <div className="test-backend-buttons">
                <button onClick={testGetStudents} disabled={loading}>
                    Test Get Students
                </button>
                <button onClick={testGetStats} disabled={loading}>
                    Test Get Stats
                </button>
                <button onClick={testAddStudent} disabled={loading}>
                    Test Add Student
                </button>
            </div>

            {loading && <p className="test-backend-loading">Loading...</p>}

            {result && <pre className="test-backend-result">{result}</pre>}
        </div>
    );
}

export default TestBackend;

/* eslint-disable prettier/prettier */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import studentAPI from '../api/studentApi';

function ImportStudents() {
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState(null);
    const [sourceSheet, setSourceSheet] = useState('C1');
    const [importing, setImporting] = useState(false);

    // ✅ FIXED: Opens the file dialog
    const getFilePath = async () => {
        try {
            const filePath = await window.api.excel.getPath();
            if (!filePath) return;

            setSelectedFile({
                path: filePath,
                name: filePath.split(/[\\/]/).pop()
            });
        } catch (error) {
            alert('Error selecting file: ' + error.message);
        }
    };

    // ✅ FIXED: Single handleImport with proper navigation
    const handleImport = async () => {
        if (!selectedFile) {
            alert('Please select a file first');
            return;
        }

        if (!window.confirm(`Import students from "${selectedFile.name}" as ${sourceSheet}?`)) {
            return;
        }

        setImporting(true);

        try {
            console.log('Importing from file:', selectedFile.path, 'Sheet:', sourceSheet);

            const result = await studentAPI.importFile(selectedFile.path, sourceSheet);

            if (result.success) {
                alert(`✅ Successfully imported ${result.imported} students!\n\nTotal students: ${result.total}`);

                // ✅ Navigate back with refresh flag
                navigate('/records', {
                    state: { refresh: Date.now() }
                });
            } else {
                alert('Failed to import: ' + result.error);
            }
        } catch (error) {
            alert('Import error: ' + error.message);
        } finally {
            setImporting(false);
        }
    };

    // ✅ FIXED: Proper back navigation
    const handleBack = () => {
        navigate('/records', {
            state: { fromImport: true }
        });
    };

    return (
        <div className="import-page">
            <Header />
            <button className="btn-back" onClick={handleBack}>
                ← Back
            </button>

            <div className="import-container">
                <h1>📥 Import Students from Excel</h1>

                <div className="import-instructions">
                    <h3>Instructions:</h3>
                    <ol>
                        <li>Prepare your Excel file with student data</li>
                        <li>Make sure it has columns matching the required fields</li>
                        <li>Click "Browse" to select the file</li>
                        <li>Choose the source cohort</li>
                        <li>Click "Import Students"</li>
                    </ol>
                </div>

                <div className="import-form">
                    <div className="form-section">
                        <h3>1. Select Excel File</h3>

                        <button
                            onClick={getFilePath}
                            className="file-select-button"
                            disabled={importing}
                        >
                            📁 Browse for Excel File
                        </button>

                        {selectedFile && (
                            <p className="selected-file">
                                ✅ Selected: {selectedFile.name}
                            </p>
                        )}
                    </div>

                    <div className="form-section">
                        <h3>2. Select Source Cohort</h3>
                        <div className="radio-group">
                            {['C1', 'C2', 'C3', 'ACC C1', 'ACC C2', 'Imported'].map(cohort => (
                                <label key={cohort} className="radio-option">
                                    <input
                                        type="radio"
                                        value={cohort}
                                        checked={sourceSheet === cohort}
                                        onChange={(e) => setSourceSheet(e.target.value)}
                                        disabled={importing}
                                    />
                                    <span>{cohort}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <button
                        className="btn-import"
                        onClick={handleImport}
                        disabled={!selectedFile || importing}
                    >
                        {importing ? '⏳ Importing...' : '📥 Import Students'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ImportStudents;
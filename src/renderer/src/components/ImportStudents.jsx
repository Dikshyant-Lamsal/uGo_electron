/* eslint-disable prettier/prettier */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import studentAPI from '../api/studentApi';
import { showInfo, showError, showSuccess, showConfirm, showWarning } from '../utils/dialog';

function ImportStudents() {
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState(null);
    const [sourceSheet, setSourceSheet] = useState('C1');
    const [importing, setImporting] = useState(false);
    const [availableCohorts, setAvailableCohorts] = useState(['C1', 'C2', 'C3']);
    const [showNewCohortInput, setShowNewCohortInput] = useState(false);
    const [newCohortName, setNewCohortName] = useState('');
    const [creatingCohort, setCreatingCohort] = useState(false);

    // Load available cohorts on mount
    useEffect(() => {
        loadCohorts();
    }, []);

    const loadCohorts = async () => {
        const result = await studentAPI.getCohorts();
        if (result.success && result.cohorts.length > 0) {
            setAvailableCohorts(result.cohorts);
        }
    };

    const getFilePath = async () => {
        try {
            const filePath = await globalThis.api.excel.getPath();
            if (!filePath) return;

            setSelectedFile({
                path: filePath,
                name: filePath.split(/[\\/]/).pop()
            });
        } catch (error) {
            await showError('Error selecting file: ' + error.message, 'File Selection Error');
        }
    };

    const handleAddCohort = async () => {
        if (!newCohortName.trim()) {
            await showWarning('Please enter a cohort name', 'Missing Cohort Name');
            return;
        }

        // Validate format
        if (!/^C\d+$/.test(newCohortName.trim().toUpperCase())) {
            await showWarning('Cohort name must be in format: C4, C5, C6, etc.', 'Invalid Format');
            return;
        }

        const cohortName = newCohortName.trim().toUpperCase();

        setCreatingCohort(true);
        const result = await studentAPI.addCohort(cohortName);

        if (result.success) {
            await showSuccess(`✅ Cohort ${cohortName} created successfully!`, 'Cohort Created');
            await loadCohorts(); // Reload cohorts list
            setSourceSheet(cohortName); // Select the new cohort
            setShowNewCohortInput(false);
            setNewCohortName('');
        } else {
            await showError(`Failed to create cohort: ${result.error}`, 'Creation Failed');
        }
        setCreatingCohort(false);
    };

    const handleImport = async () => {
        if (!selectedFile) {
            await showWarning('Please select a file first', 'No File Selected');
            return;
        }

        const confirmed = await showConfirm(
            `Import students from "${selectedFile.name}" as ${sourceSheet}?`,
            'Confirm Import'
        );

        if (!confirmed) {
            return;
        }

        setImporting(true);

        try {
            const result = await studentAPI.importFile(selectedFile.path, sourceSheet);

            if (result.success) {
                await showSuccess(
                    `✅ Successfully imported ${result.imported} students!\n\nTotal students: ${result.total}`,
                    'Import Successful'
                );

                navigate('/records', {
                    state: { refresh: Date.now() }
                });
            } else {
                await showError('Failed to import: ' + result.error, 'Import Failed');
            }
        } catch (error) {
            await showError('Import error: ' + error.message, 'Import Error');
        } finally {
            setImporting(false);
        }
    };

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
                        <li>Choose the source cohort or create a new one</li>
                        <li>Click "Import Students"</li>
                        <li><strong>Note:</strong> Student IDs will be auto-generated sequentially</li>
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
                            {availableCohorts.map(cohort => (
                                <label key={cohort} className="radio-option">
                                    <input
                                        type="radio"
                                        value={cohort}
                                        checked={sourceSheet === cohort}
                                        onChange={(e) => setSourceSheet(e.target.value)}
                                        disabled={importing || creatingCohort}
                                    />
                                    <span>{cohort}</span>
                                </label>
                            ))}
                        </div>

                        {/* Add New Cohort Button */}
                        {!showNewCohortInput && (
                            <button
                                onClick={() => setShowNewCohortInput(true)}
                                className="btn-add-cohort"
                                disabled={importing || creatingCohort}
                                style={{
                                    marginTop: '10px',
                                    padding: '8px 16px',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                ➕ Add New Cohort
                            </button>
                        )}

                        {/* New Cohort Input */}
                        {showNewCohortInput && (
                            <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #10b981' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#047857' }}>
                                    Create New Cohort:
                                </label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        value={newCohortName}
                                        onChange={(e) => setNewCohortName(e.target.value)}
                                        placeholder="e.g., C4, C5"
                                        disabled={creatingCohort}
                                        style={{
                                            flex: 1,
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            fontSize: '14px'
                                        }}
                                    />
                                    <button
                                        onClick={handleAddCohort}
                                        disabled={creatingCohort}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: '#10b981',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {creatingCohort ? '⏳ Creating...' : '✅ Create'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowNewCohortInput(false);
                                            setNewCohortName('');
                                        }}
                                        disabled={creatingCohort}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: '#6b7280',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        ✖ Cancel
                                    </button>
                                </div>
                                <p style={{ fontSize: '12px', color: '#047857', marginTop: '8px' }}>
                                    💡 Format: C followed by a number (e.g., C4, C5, C10)
                                </p>
                            </div>
                        )}

                        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                            💡 Student IDs will be generated automatically (e.g., UGO_C1_274, UGO_C2_275)
                        </p>
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
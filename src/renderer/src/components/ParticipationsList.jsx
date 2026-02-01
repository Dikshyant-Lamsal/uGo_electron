/* eslint-disable prettier/prettier */
import { useState, useEffect } from 'react';
import studentAPI from '../api/studentApi';
import { showSuccess, showError, showWarning, showConfirm } from '../utils/dialog';

function ParticipationsList({ studentId }) {
    const [participations, setParticipations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deletingIds, setDeletingIds] = useState(new Set());
    const [submittingForm, setSubmittingForm] = useState(false);

    useEffect(() => {
        if (studentId) {
            loadParticipations();
        }
    }, [studentId]);

    const loadParticipations = async () => {
        setLoading(true);
        const result = await studentAPI.getParticipations(studentId);
        if (result.success) {
            setParticipations(result.data);
        } else {
            console.error('Failed to load participations:', result.error);
        }
        setLoading(false);
    };

    const handleAdd = async (formData) => {
        setSubmittingForm(true);
        const result = await studentAPI.addParticipation({
            student_id: studentId,
            ...formData
        });

        if (result.success) {
            await showSuccess('✅ Participation added successfully!', 'Success');
            await loadParticipations();
            setShowAddForm(false);
        } else {
            await showError('❌ Failed to add participation: ' + result.error, 'Error');
        }
        setSubmittingForm(false);
    };

    const handleUpdate = async (id, formData) => {
        setSubmittingForm(true);
        const result = await studentAPI.updateParticipation(id, formData);

        if (result.success) {
            await showSuccess('✅ Participation updated successfully!', 'Success');
            await loadParticipations();
            setEditingId(null);
        } else {
            await showError('❌ Failed to update participation: ' + result.error, 'Error');
        }
        setSubmittingForm(false);
    };

    const handleDelete = async (id, eventName) => {
        const confirmed = await showConfirm(
            `Delete participation "${eventName}"?`,
            'Confirm Delete'
        );

        if (!confirmed) return;

        setDeletingIds(prev => new Set(prev).add(id));
        const result = await studentAPI.deleteParticipation(id);
        
        if (result.success) {
            await showSuccess('✅ Participation deleted!', 'Deleted');
            await loadParticipations();
        } else {
            await showError('❌ Failed to delete: ' + result.error, 'Error');
        }
        
        setDeletingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
    };

    if (loading) {
        return (
            <div className="participations-loading" style={{
                padding: '30px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '15px'
            }}>
                <div className="spinner" style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #f3f3f3',
                    borderTop: '4px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ color: '#666' }}>Loading participations...</p>
            </div>
        );
    }

    return (
        <div className="participations-section">
            <div className="participations-header">
                <h3>📋 Participations ({participations.length})</h3>
                {!showAddForm && (
                    <button
                        className="btn-add-participation"
                        onClick={() => setShowAddForm(true)}
                        disabled={submittingForm || editingId !== null}
                    >
                        ➕ Add Participation
                    </button>
                )}
            </div>

            {showAddForm && (
                <ParticipationForm
                    onSubmit={handleAdd}
                    onCancel={() => setShowAddForm(false)}
                    isSubmitting={submittingForm}
                />
            )}

            <div className="participations-list">
                {participations.length === 0 ? (
                    <div className="no-participations">
                        <p>No participations recorded yet.</p>
                        <p>Click "Add Participation" to get started.</p>
                    </div>
                ) : (
                    participations.map(p => {
                        const isDeleting = deletingIds.has(p.participation_id);
                        const isDisabled = isDeleting || submittingForm || (editingId !== null && editingId !== p.participation_id);
                        
                        return (
                            <div 
                                key={p.participation_id} 
                                className="participation-card"
                                style={{
                                    opacity: isDeleting ? 0.6 : 1,
                                    pointerEvents: isDisabled ? 'none' : 'auto'
                                }}
                            >
                                {editingId === p.participation_id ? (
                                    <ParticipationForm
                                        initialData={p}
                                        onSubmit={(data) => handleUpdate(p.participation_id, data)}
                                        onCancel={() => setEditingId(null)}
                                        isSubmitting={submittingForm}
                                    />
                                ) : (
                                    <>
                                        <div className="participation-header">
                                            <h4>{p.event_name}</h4>
                                            <span className="participation-type">{p.event_type}</span>
                                        </div>
                                        <div className="participation-details">
                                            <p><strong>📅 Date:</strong> {p.event_date}</p>
                                            <p><strong>👤 Role:</strong> {p.role}</p>
                                            <p><strong>⏱️ Hours:</strong> {p.hours}</p>
                                            {p.notes && (
                                                <p className="participation-notes">
                                                    <strong>📝 Notes:</strong> {p.notes}
                                                </p>
                                            )}
                                        </div>
                                        <div className="participation-actions">
                                            <button
                                                className="btn-edit"
                                                onClick={() => setEditingId(p.participation_id)}
                                                disabled={isDisabled}
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                className="btn-delete"
                                                onClick={() => handleDelete(p.participation_id, p.event_name)}
                                                disabled={isDisabled}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                {isDeleting ? (
                                                    <>
                                                        <div className="btn-spinner" style={{
                                                            width: '12px',
                                                            height: '12px',
                                                            border: '2px solid #ffffff',
                                                            borderTop: '2px solid transparent',
                                                            borderRadius: '50%',
                                                            animation: 'spin 0.8s linear infinite'
                                                        }}></div>
                                                        Deleting...
                                                    </>
                                                ) : (
                                                    <>🗑️ Delete</>
                                                )}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

function ParticipationForm({ initialData = {}, onSubmit, onCancel, isSubmitting = false }) {
    const [formData, setFormData] = useState({
        event_name: initialData.event_name || '',
        event_date: initialData.event_date || '',
        event_type: initialData.event_type || 'Workshop',
        role: initialData.role || 'Participant',
        hours: initialData.hours || 0,
        notes: initialData.notes || ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.event_name.trim()) {
            await showWarning('Please enter an event name', 'Missing Event Name');
            return;
        }
        if (!formData.event_date) {
            await showWarning('Please select a date', 'Missing Date');
            return;
        }

        onSubmit(formData);
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <form onSubmit={handleSubmit} className="participation-form">
            <div className="form-group">
                <label>Event Name *</label>
                <input
                    type="text"
                    placeholder="e.g., Tech Workshop 2024"
                    value={formData.event_name}
                    onChange={(e) => handleChange('event_name', e.target.value)}
                    required
                    disabled={isSubmitting}
                    style={{
                        opacity: isSubmitting ? 0.6 : 1,
                        cursor: isSubmitting ? 'not-allowed' : 'text'
                    }}
                />
            </div>

            <div className="form-group">
                <label>Date *</label>
                <input
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => handleChange('event_date', e.target.value)}
                    required
                    disabled={isSubmitting}
                    style={{
                        opacity: isSubmitting ? 0.6 : 1,
                        cursor: isSubmitting ? 'not-allowed' : 'text'
                    }}
                />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Event Type</label>
                    <select
                        value={formData.event_type}
                        onChange={(e) => handleChange('event_type', e.target.value)}
                        disabled={isSubmitting}
                        style={{
                            opacity: isSubmitting ? 0.6 : 1,
                            cursor: isSubmitting ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <option value="Workshop">Workshop</option>
                        <option value="Seminar">Seminar</option>
                        <option value="Conference">Conference</option>
                        <option value="Volunteer">Volunteer</option>
                        <option value="Competition">Competition</option>
                        <option value="Training">Training</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Role</label>
                    <select
                        value={formData.role}
                        onChange={(e) => handleChange('role', e.target.value)}
                        disabled={isSubmitting}
                        style={{
                            opacity: isSubmitting ? 0.6 : 1,
                            cursor: isSubmitting ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <option value="Participant">Participant</option>
                        <option value="Organizer">Organizer</option>
                        <option value="Volunteer">Volunteer</option>
                        <option value="Speaker">Speaker</option>
                        <option value="Facilitator">Facilitator</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Hours</label>
                    <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={formData.hours}
                        onChange={(e) => handleChange('hours', parseFloat(e.target.value) || 0)}
                        disabled={isSubmitting}
                        style={{
                            opacity: isSubmitting ? 0.6 : 1,
                            cursor: isSubmitting ? 'not-allowed' : 'text'
                        }}
                    />
                </div>
            </div>

            <div className="form-group">
                <label>Notes (optional)</label>
                <textarea
                    placeholder="Additional details about the participation..."
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows="3"
                    disabled={isSubmitting}
                    style={{
                        opacity: isSubmitting ? 0.6 : 1,
                        cursor: isSubmitting ? 'not-allowed' : 'text'
                    }}
                />
            </div>

            <div className="form-buttons">
                <button 
                    type="submit" 
                    className="btn-submit"
                    disabled={isSubmitting}
                    style={{
                        opacity: isSubmitting ? 0.6 : 1,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }}
                >
                    {isSubmitting ? (
                        <>
                            <div className="btn-spinner" style={{
                                width: '14px',
                                height: '14px',
                                border: '2px solid #ffffff',
                                borderTop: '2px solid transparent',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite'
                            }}></div>
                            {initialData.participation_id ? 'Updating...' : 'Adding...'}
                        </>
                    ) : (
                        <>✅ {initialData.participation_id ? 'Update' : 'Add'}</>
                    )}
                </button>
                <button 
                    type="button" 
                    onClick={onCancel} 
                    className="btn-cancel"
                    disabled={isSubmitting}
                    style={{
                        opacity: isSubmitting ? 0.6 : 1,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer'
                    }}
                >
                    ❌ Cancel
                </button>
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </form>
    );
}

export default ParticipationsList;
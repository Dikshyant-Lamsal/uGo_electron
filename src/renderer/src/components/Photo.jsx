/* eslint-disable prettier/prettier */
import { useState, useEffect } from 'react';
import studentAPI from '../api/studentApi';
import { showError, showSuccess, showConfirm, showWarning } from '../utils/dialog';
import icon from '../assets/logo/icon.png';

function Photo({ studentId, studentName, studentID, editable = false, onPhotoChange }) {
    const [photoUrl, setPhotoUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadPhoto();
    }, [studentId, studentID]);

    const loadPhoto = async () => {
        setLoading(true);
        setImageError(false);

        const photoIdentifier = studentID || studentId;

        console.log('📸 Loading photo for:', photoIdentifier);

        const result = await studentAPI.getPhotoPath(photoIdentifier);

        console.log('📸 Photo result:', result);

        if (result.success && result.path) {
            setPhotoUrl(result.path);
        } else {
            setPhotoUrl(null);
        }

        setLoading(false);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            await showWarning('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            await showWarning('Image must be smaller than 5MB');
            return;
        }

        const photoIdentifier = studentID || studentId;

        console.log('📤 Uploading photo for:', photoIdentifier);

        setUploading(true);
        const result = await studentAPI.savePhoto(photoIdentifier, file);

        if (result.success) {
            await showSuccess('Photo uploaded successfully!');
            await loadPhoto();
            if (onPhotoChange) onPhotoChange();
        } else {
            await showError('Failed to upload photo: ' + result.error);
        }
        setUploading(false);
    };

    const handleDelete = async () => {
        const confirmed = await showConfirm('Delete this photo?', 'Delete Photo');
        if (!confirmed) return;

        const photoIdentifier = studentID || studentId;
        
        setDeleting(true);
        const result = await studentAPI.deletePhoto(photoIdentifier);

        if (result.success) {
            await showSuccess('Photo deleted successfully!');
            setPhotoUrl(null);
            setImageError(false);
            if (onPhotoChange) onPhotoChange();
        } else {
            await showError('Failed to delete photo: ' + result.error);
        }
        setDeleting(false);
    };

    const handleImageError = () => {
        console.error('Image failed to load:', photoUrl);
        setImageError(true);
    };

    const isProcessing = uploading || deleting;

    if (loading) {
        return (
            <div className="photo-placeholder" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
            }}>
                <div className="spinner" style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #f3f3f3',
                    borderTop: '4px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <span style={{ fontSize: '14px', color: '#666' }}>Loading photo...</span>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="photo-wrapper">
            {/* Photo Display with Upload/Delete Overlay */}
            <div style={{ position: 'relative' }}>
                {photoUrl && !imageError ? (
                    <img
                        src={photoUrl}
                        alt={studentName}
                        className="student-photo"
                        onError={handleImageError}
                        style={{
                            opacity: isProcessing ? 0.5 : 1,
                            transition: 'opacity 0.3s'
                        }}
                    />
                ) : (
                    <div 
                        className="photo-placeholder"
                        style={{
                            opacity: isProcessing ? 0.5 : 1,
                            transition: 'opacity 0.3s'
                        }}
                    >
                        <img src={icon} alt="Placeholder" className="logo" />
                    </div>
                )}

                {/* Processing Overlay */}
                {isProcessing && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '8px',
                        gap: '8px'
                    }}>
                        <div className="spinner" style={{
                            width: '30px',
                            height: '30px',
                            border: '3px solid #e5e7eb',
                            borderTop: '3px solid #3b82f6',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <span style={{ fontSize: '13px', color: '#1f2937', fontWeight: '500' }}>
                            {uploading ? 'Uploading...' : 'Deleting...'}
                        </span>
                    </div>
                )}
            </div>

            {editable && (
                <div className="photo-actions">
                    <label 
                        className="btn-upload-photo"
                        style={{
                            opacity: isProcessing ? 0.6 : 1,
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            pointerEvents: isProcessing ? 'none' : 'auto'
                        }}
                    >
                        {photoUrl && !imageError ? '📷 Change Photo' : '📷 Upload Photo'}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                            disabled={isProcessing}
                        />
                    </label>
                    {photoUrl && !imageError && (
                        <button
                            className="btn-delete-photo"
                            onClick={handleDelete}
                            type="button"
                            disabled={isProcessing}
                            style={{
                                opacity: isProcessing ? 0.6 : 1,
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                            }}
                        >
                            {deleting ? (
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
                    )}
                </div>
            )}

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default Photo;
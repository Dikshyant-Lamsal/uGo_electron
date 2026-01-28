/* eslint-disable prettier/prettier */
// FIXED Photo Component with Placeholder
import { useState, useEffect } from 'react';
import studentAPI from '../api/studentApi';
import { showError, showSuccess, showConfirm, showWarning } from '../utils/dialog';
import icon from '../assets/logo/icon.png';

function Photo({ studentId, studentName, studentID, editable = false, onPhotoChange }) {
    const [photoUrl, setPhotoUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

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

        const result = await studentAPI.savePhoto(photoIdentifier, file);

        if (result.success) {
            await showSuccess('Photo uploaded successfully!');
            await loadPhoto();
            if (onPhotoChange) onPhotoChange();
        } else {
            await showError('Failed to upload photo: ' + result.error);
        }
    };

    const handleDelete = async () => {
        const confirmed = await showConfirm('Delete this photo?', 'Delete Photo');
        if (!confirmed) return;

        const photoIdentifier = studentID || studentId;
        const result = await studentAPI.deletePhoto(photoIdentifier);

        if (result.success) {
            await showSuccess('Photo deleted successfully!');
            setPhotoUrl(null);
            setImageError(false);
            if (onPhotoChange) onPhotoChange();
        } else {
            await showError('Failed to delete photo: ' + result.error);
        }
    };

    const handleImageError = () => {
        console.error('Image failed to load:', photoUrl);
        setImageError(true);
    };

    if (loading) {
        return (
            <div className="photo-placeholder">
                Loading photo...
            </div>
        );
    }

    return (
        <div className="photo-wrapper">
            {photoUrl && !imageError ? (
                <img
                    src={photoUrl}
                    alt={studentName}
                    className="student-photo"
                    onError={handleImageError}
                />
            ) : (
                <div className="photo-placeholder">
                    <img src={icon} alt="Placeholder" className="logo" />
                </div>
            )}

            {editable && (
                <div className="photo-actions">
                    <label className="btn-upload-photo">
                        {photoUrl && !imageError ? '📷 Change Photo' : '📷 Upload Photo'}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                    </label>
                    {photoUrl && !imageError && (
                        <button
                            className="btn-delete-photo"
                            onClick={handleDelete}
                            type="button"
                        >
                            🗑️ Delete
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default Photo;
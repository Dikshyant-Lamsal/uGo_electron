/* eslint-disable prettier/prettier */
import { useState, useEffect } from 'react';
import studentAPI from '../api/studentApi';
import { showError, showSuccess, showConfirm, showWarning } from '../utils/dialog';
import icon from '../assets/logo/icon.png';

function Photo({ studentId, studentName, studentID, editable = false, onPhotoChange }) {
    const [photoUrl, setPhotoUrl] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPhoto();
    }, [studentId]);

    const loadPhoto = async () => {
        setLoading(true);
        // Use Student_ID if available, otherwise fall back to database id
        const photoIdentifier = studentID || studentId;
        const result = await studentAPI.getPhotoPath(photoIdentifier);
        if (result.success) {
            setPhotoUrl(result.path);
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

        // Upload photo using Student_ID if available
        const photoIdentifier = studentID || studentId;
        const result = await studentAPI.savePhoto(photoIdentifier, file);
        if (result.success) {
            await showSuccess('Photo uploaded successfully!');
            loadPhoto(); // Reload photo
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
            if (onPhotoChange) onPhotoChange();
        } else {
            await showError('Failed to delete photo: ' + result.error);
        }
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
            {photoUrl ? (
                <img
                    src={photoUrl}
                    alt={studentName}
                    className="student-photo"
                />
            ) : (
                <div className="photo-placeholder">
                    <img src={icon} alt={studentName} className="logo" />
                </div>
            )}
            {editable && (
                <div className="photo-actions">
                    <label className="btn-upload-photo">
                        {photoUrl ? '📷 Change Photo' : '📷 Upload Photo'}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                    </label>
                    {photoUrl && (
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
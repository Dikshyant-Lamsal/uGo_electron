/* eslint-disable prettier/prettier */
import { useState, useEffect } from 'react';
import studentAPI from '../api/studentApi';

function Photo({ studentId, studentName, editable = false, onPhotoChange }) {
    const [photoUrl, setPhotoUrl] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPhoto();
    }, [studentId]);

    const loadPhoto = async () => {
        setLoading(true);
        const result = await studentAPI.getPhotoPath(studentId);

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
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be smaller than 5MB');
            return;
        }

        // Upload photo
        const result = await studentAPI.savePhoto(studentId, file);

        if (result.success) {
            alert('Photo uploaded successfully!');
            loadPhoto(); // Reload photo
            if (onPhotoChange) onPhotoChange();
        } else {
            alert('Failed to upload photo: ' + result.error);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this photo?')) return;

        const result = await studentAPI.deletePhoto(studentId);

        if (result.success) {
            alert('Photo deleted successfully!');
            setPhotoUrl(null);
            if (onPhotoChange) onPhotoChange();
        } else {
            alert('Failed to delete photo: ' + result.error);
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
                    No photo available
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
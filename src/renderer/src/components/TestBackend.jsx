/* eslint-disable prettier/prettier */
import { useState } from 'react';
import Header from './Header.jsx';

function TestBackend() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [photoUrl, setPhotoUrl] = useState(null);

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
        const timestamp = Date.now();
        const res = await window.api.excel.addStudent({
            Full_Name: "Test Student " + timestamp,
            District: "Test District",
            Address: "123 Test Street",
            Contact_Number: "9800000000",
            Father_Name: "Test Father",
            Father_Contact: "9811111111",
            Mother_Name: "Test Mother",
            Mother_Contact: "9822222222",
            Program: "Test Program",
            College: "Test College",
            Current_Year: "1st Year",
            Source_Sheet: "C1"
        });
        setResult(JSON.stringify(res, null, 2));
        setLoading(false);
    };

    const testPhotoPath = async () => {
        setLoading(true);
        setPhotoUrl(null);
        
        // Test getting photo path for a test image
        console.log('🧪 Testing photo path for test.jpg...');
        
        const res = await window.api.photos.getPhotoPath('test');
        console.log('📸 Photo path result:', res);
        
        if (res.success && res.path) {
            console.log('✅ Photo URL:', res.path);
            setPhotoUrl(res.path);
            setResult(JSON.stringify(res, null, 2));
        } else {
            console.log('❌ Photo not found');
            setResult(JSON.stringify(res, null, 2));
        }
        
        setLoading(false);
    };

    const testPhotoExists = async () => {
        setLoading(true);
        
        console.log('🧪 Checking if test.jpg exists...');
        const res = await window.api.photos.photoExists('test');
        console.log('📸 Photo exists result:', res);
        
        setResult(JSON.stringify(res, null, 2));
        setLoading(false);
    };

    const testPhotoUpload = async () => {
        setLoading(true);
        
        // Create a simple test image as base64
        const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        
        console.log('🧪 Uploading test photo...');
        const res = await window.api.photos.savePhoto({
            id: 'test',
            photoData: testImageBase64,
            extension: 'png'
        });
        
        console.log('📸 Upload result:', res);
        setResult(JSON.stringify(res, null, 2));
        
        if (res.success) {
            // Try to load the photo
            await testPhotoPath();
        }
        
        setLoading(false);
    };

    return (
        <div className="test-backend-page">
            
            <h1>Backend API Test Page</h1>
            
            <div className="test-backend-buttons">
                <h3>Excel API Tests</h3>
                <button onClick={testGetStudents} disabled={loading}>
                    Test Get Students
                </button>
                <button onClick={testGetStats} disabled={loading}>
                    Test Get Stats
                </button>
                <button onClick={testAddStudent} disabled={loading}>
                    Test Add Student (with Parents)
                </button>
            </div>

            <div className="test-backend-buttons" style={{ marginTop: '20px' }}>
                <h3>Photo API Tests</h3>
                <button onClick={testPhotoExists} disabled={loading}>
                    🔍 Check if test.jpg exists
                </button>
                <button onClick={testPhotoPath} disabled={loading}>
                    📸 Get test.jpg path
                </button>
                <button onClick={testPhotoUpload} disabled={loading}>
                    ⬆️ Upload test photo
                </button>
            </div>

            {loading && <p className="test-backend-loading">Loading...</p>}
            
            {photoUrl && (
                <div style={{ marginTop: '20px', padding: '20px', border: '2px solid #4CAF50', borderRadius: '8px' }}>
                    <h3>Photo Preview:</h3>
                    <p><strong>URL:</strong> {photoUrl}</p>
                    <img 
                        src={photoUrl} 
                        alt="Test" 
                        style={{ maxWidth: '200px', border: '1px solid #ccc' }}
                        onLoad={() => console.log('✅ Image loaded successfully!')}
                        onError={(e) => {
                            console.error('❌ Failed to load image:', photoUrl);
                            console.error('Error event:', e);
                        }}
                    />
                </div>
            )}
            
            {result && (
                <div style={{ marginTop: '20px' }}>
                    <h3>API Response:</h3>
                    <pre className="test-backend-result">{result}</pre>
                </div>
            )}
        </div>
    );
}

export default TestBackend;
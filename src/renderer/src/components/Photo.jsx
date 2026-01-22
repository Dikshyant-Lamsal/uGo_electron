/* eslint-disable prettier/prettier */
function Photo({ studentId, studentName }) {
    // Fix: Use backticks properly for template literal
    const photoUrl = new URL(`../assets/photos/${studentId}.jpg`, import.meta.url).href;
    
    return (
        <img 
            src={photoUrl} 
            alt={studentName} 
            className="student-photo"
            onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<div class="photo-placeholder">No photo available</div>';
            }}
        />
    );
}
export default Photo;
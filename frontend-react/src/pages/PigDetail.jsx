import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WeightChart from '../components/WeightChart';
import AddMetric from '../components/AddMetric';
import GuineaPigIcon from '../components/icons/GuineaPigIcon';
import './PigDetail.css';
import { API_BASE_URL, apiFetch } from '../api';

const PigDetail = () => {
    const { name } = useParams();
    const petName = decodeURIComponent(name);
    const navigate = useNavigate();

    const [pet, setPet] = useState(null);
    const [healthData, setHealthData] = useState([]);
    const [photoFiles, setPhotoFiles] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editDate, setEditDate] = useState('');
    const [profileImageFile, setProfileImageFile] = useState(null);
    const [profileImagePreview, setProfileImagePreview] = useState(null);
    const [profileImageError, setProfileImageError] = useState(false);
    const [previewError, setPreviewError] = useState(false);
    const profileImageInputRef = useRef(null);

    const fetchPet = useCallback(() => {
        apiFetch(`/pet/${encodeURIComponent(petName)}`)
            .then(res => res.ok ? res.json() : Promise.reject(new Error('Could not load pet')))
            .then(setPet)
            .catch(err => console.error('Error fetching pet:', err));
    }, [petName]);

    const fetchHealth = useCallback(() => {
        apiFetch(`/pet/getHealth?name=${encodeURIComponent(petName)}&type=weight`)
            .then(res => res.ok ? res.json() : Promise.reject(new Error('Could not load health data')))
            .then(setHealthData)
            .catch(err => console.error('Error fetching health:', err));
    }, [petName]);

    useEffect(() => {
        fetchPet();
        fetchHealth();
    }, [fetchPet, fetchHealth]);

    useEffect(() => {
        setProfileImageError(false);
    }, [pet?.profileImage]);

    const handleAddPhotos = async () => {
        if (photoFiles.length === 0) return;
        const fd = new FormData();
        photoFiles.forEach(file => fd.append('photos', file));
        const response = await apiFetch(`/pet/${encodeURIComponent(petName)}/photos`, {
            method: 'POST',
            body: fd
        });
        if (response.ok) {
            setPet(await response.json());
            setPhotoFiles([]);
        }
    };

    const handleProfileImageChange = (e) => {
        const file = e.target.files[0];
        setProfileImageFile(file);
        setProfileImagePreview(file ? URL.createObjectURL(file) : null);
        setPreviewError(false);
    };

    const handleSaveProfileImage = async () => {
        if (!profileImageFile) return;
        const fd = new FormData();
        fd.append('profileImage', profileImageFile);
        const response = await apiFetch(`/pet/${encodeURIComponent(petName)}/profileImage`, {
            method: 'POST',
            body: fd
        });
        if (response.ok) {
            setPet(await response.json());
            setProfileImageFile(null);
            setProfileImagePreview(null);
        }
    };

    const toDateInputValue = (dateStr) => {
        const d = new Date(dateStr);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const startEditingDate = (entry) => {
        setEditingId(entry._id);
        setEditDate(toDateInputValue(entry.createdAt));
    };

    const handleSaveDate = async (id) => {
        const [year, month, day] = editDate.split('-').map(Number);
        const localDate = new Date(year, month - 1, day);
        const response = await apiFetch(`/pet/metric/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ createdAt: localDate.toISOString() })
        });
        if (response.ok) {
            setEditingId(null);
            fetchHealth();
        }
    };

    const handleRemovePhoto = async (url) => {
        const response = await apiFetch(`/pet/${encodeURIComponent(petName)}/photos`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        if (response.ok) {
            setPet(await response.json());
        }
    };

    if (!pet) {
        return <div className="pig-detail-page"><p>Loading...</p></div>;
    }

    return (
        <div className="pig-detail-page">
            <button className="back-button" onClick={() => navigate('/dashboard')}>&larr; Back to Dashboard</button>

            <div className="pig-detail-header">
                <div className="pig-detail-photo-wrapper">
                    {profileImagePreview && previewError ? (
                        <div className="pig-detail-photo-pending">
                            <GuineaPigIcon size={100} className="pig-detail-photo-placeholder" />
                            <p className="preview-unavailable-note">
                                No preview for this file type, but it'll convert automatically when saved.
                            </p>
                        </div>
                    ) : profileImagePreview ? (
                        <img
                            src={profileImagePreview}
                            alt={pet.name}
                            className="pig-detail-photo"
                            onError={() => setPreviewError(true)}
                        />
                    ) : pet.profileImage && !profileImageError ? (
                        <img
                            src={`${API_BASE_URL}${pet.profileImage}`}
                            alt={pet.name}
                            className="pig-detail-photo"
                            onError={() => setProfileImageError(true)}
                        />
                    ) : (
                        <GuineaPigIcon size={100} className="pig-detail-photo-placeholder" />
                    )}
                    <div className="profile-image-controls">
                        <input
                            type="file"
                            accept="image/*"
                            ref={profileImageInputRef}
                            onChange={handleProfileImageChange}
                            className="profile-image-input-hidden"
                        />
                        <button onClick={() => profileImageInputRef.current.click()}>
                            Update Profile Picture
                        </button>
                        {profileImageFile && (
                            <button onClick={handleSaveProfileImage}>Save</button>
                        )}
                    </div>
                </div>
                <div>
                    <h1>{pet.name}</h1>
                    <p>Age: {pet.age} years</p>
                    <p>Color: {pet.color}</p>
                </div>
            </div>

            <div className="pig-detail-grid">
                <div className="pig-detail-chart">
                    {healthData.length > 0 ? (
                        <WeightChart data={healthData} petName={pet.name} />
                    ) : (
                        <p>No weight data logged yet.</p>
                    )}
                </div>
                <AddMetric petName={pet.name} onSuccess={fetchHealth} />
            </div>

            {healthData.length > 0 && (
                <div className="weight-log">
                    <h2>Weight Log</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Weight</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {healthData.map(entry => (
                                <tr key={entry._id}>
                                    <td>
                                        {editingId === entry._id ? (
                                            <input
                                                type="date"
                                                value={editDate}
                                                onChange={(e) => setEditDate(e.target.value)}
                                            />
                                        ) : (
                                            new Date(entry.createdAt).toLocaleDateString()
                                        )}
                                    </td>
                                    <td>{entry.value}{entry.unit}</td>
                                    <td>
                                        {editingId === entry._id ? (
                                            <>
                                                <button onClick={() => handleSaveDate(entry._id)}>Save</button>
                                                <button onClick={() => setEditingId(null)}>Cancel</button>
                                            </>
                                        ) : (
                                            <button onClick={() => startEditingDate(entry)}>Edit date</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="photo-gallery">
                <h2>Photos</h2>
                {pet.photos.length > 0 && (
                    <div className="photo-grid">
                        {pet.photos.map(url => (
                            <div className="photo-item" key={url}>
                                <img src={`${API_BASE_URL}${url}`} alt={pet.name} />
                                <button onClick={() => handleRemovePhoto(url)}>Remove</button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="photo-upload">
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => setPhotoFiles(Array.from(e.target.files))}
                    />
                    <button onClick={handleAddPhotos} disabled={photoFiles.length === 0}>Add Photos</button>
                </div>
            </div>
        </div>
    );
};

export default PigDetail;

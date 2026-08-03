import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GuineaPigIcon from './icons/GuineaPigIcon';
import './Dashboard.css';
import { API_BASE_URL, apiFetch } from '../api';

function Dashboard() {
    const [piggies, setPiggies] = useState([]);
    const [brokenImages, setBrokenImages] = useState(new Set());
    const navigate = useNavigate();

    useEffect(() => {
        apiFetch('/pet/all')
            .then((res) => res.ok ? res.json() : Promise.reject(new Error('Could not load pets')))
            .then((data) => setPiggies(data))
            .catch((err) => console.error('Error fetching pets:', err));
    }, []);

    const handleDelete = async (e, name) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete ${name}?`)) {
            try {
                const response = await apiFetch(`/pet/${encodeURIComponent(name)}`, { method: 'DELETE' });
                if (response.ok) {
                    setPiggies(piggies.filter(p => p.name !== name));
                }
            } catch (err) {
                console.error('Error deleting pet:', err);
            }
        }
    };

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <h1>Your Piggies</h1>
                <div className="quick-actions">
                    <button onClick={() => navigate('/create-pet')}>Add Pet +</button>
                    <button onClick={() => navigate('/add-metric')}>Add Weight +</button>
                </div>
            </div>

            {piggies.length === 0 ? (
                <div className="empty-state">
                    <GuineaPigIcon size={72} className="empty-state-icon" />
                    <p>No piggies yet. Add your first one!</p>
                </div>
            ) : (
                <div className="pig-grid">
                    {piggies.map(pig => (
                        <div
                            className="pig-card"
                            key={pig.name}
                            onClick={() => navigate(`/pigs/${encodeURIComponent(pig.name)}`)}
                        >
                            {pig.profileImage && !brokenImages.has(pig.name) ? (
                                <img
                                    src={`${API_BASE_URL}${pig.profileImage}`}
                                    alt={pig.name}
                                    className="pig-thumbnail"
                                    onError={() => setBrokenImages(prev => new Set(prev).add(pig.name))}
                                />
                            ) : (
                                <GuineaPigIcon size={56} className="pig-thumbnail-placeholder" />
                            )}
                            <h3>{pig.name}</h3>
                            <button className="delete-button" onClick={(e) => handleDelete(e, pig.name)}>
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Dashboard;

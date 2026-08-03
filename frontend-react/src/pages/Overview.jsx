import { useEffect, useState } from 'react';
import CombinedWeightChart from '../components/CombinedWeightChart';
import './Overview.css';
import { apiFetch } from '../api';

const Overview = () => {
    const [piggies, setPiggies] = useState([]);
    const [metrics, setMetrics] = useState([]);

    useEffect(() => {
        apiFetch('/pet/all')
            .then(res => res.ok ? res.json() : Promise.reject(new Error('Could not load pets')))
            .then(setPiggies)
            .catch(err => console.error('Error fetching pets:', err));

        apiFetch('/pet/getHealth?type=weight')
            .then(res => res.ok ? res.json() : Promise.reject(new Error('Could not load metrics')))
            .then(setMetrics)
            .catch(err => console.error('Error fetching metrics:', err));
    }, []);

    const series = piggies.map(pig => ({
        petName: pig.name,
        data: metrics.filter(m => m.petName === pig.name)
    }));

    return (
        <div className="overview-page">
            <h1>Weight Overview</h1>

            {metrics.length === 0 ? (
                <p>No weight data logged yet.</p>
            ) : (
                <CombinedWeightChart series={series} />
            )}

            {metrics.length > 0 && (
                <table className="metrics-table">
                    <thead>
                        <tr>
                            <th>Pig</th>
                            <th>Weight</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {metrics.map(m => (
                            <tr key={m._id}>
                                <td>{m.petName}</td>
                                <td>{m.value}{m.unit}</td>
                                <td>{new Date(m.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Overview;

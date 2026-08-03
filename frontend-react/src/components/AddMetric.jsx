import { useState } from 'react';
import './styles.css';
import { apiFetch } from '../api';

function AddMetric({ petName, onSuccess }) {
    const [metricData, setMetricData] = useState({
        Pet: petName || '',
        Type: 'weight',
        Value: '',
        Unit: 'g'
    });
    const petLocked = Boolean(petName);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await apiFetch('/pet/addMetric', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(metricData)
            });

            const data = await response.json();
            if (response.ok) {
                alert(`Weight added for ${metricData.Pet}!`);
                setMetricData({ ...metricData, Value: '' });
                onSuccess?.();
            } else {
                alert('Error adding weight: ' + (data.error || data.message));
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div className="form-container">
            <h2>Add Weight</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Pet Name:</label>
                    <input
                        type="text"
                        placeholder="e.g. Chunk"
                        value={metricData.Pet}
                        onChange={(e) => setMetricData({ ...metricData, Pet: e.target.value })}
                        disabled={petLocked}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Weight:</label>
                    <input
                        type="number"
                        placeholder="0"
                        value={metricData.Value}
                        onChange={(e) => setMetricData({ ...metricData, Value: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Unit:</label>
                    <select
                        value={metricData.Unit}
                        onChange={(e) => setMetricData({ ...metricData, Unit: e.target.value })}
                    >
                        <option value="g">grams (g)</option>
                        <option value="kg">kilograms (kg)</option>
                        <option value="lb">pounds (lb)</option>
                    </select>
                </div>

                <button type="submit" className="submit-btn">Save Weight</button>
            </form>
        </div>
    );
}

export default AddMetric;
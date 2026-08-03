import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';
import { apiFetch } from '../api';

function CreatePet() {
    const [formData, setFormData] = useState({
        Name: '',
        Color: '',
        Age: 0,
        imageFile: null
    });
    const [previewUrl, setPreviewUrl] = useState(null);
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFormData({ ...formData, imageFile: file });
        setPreviewUrl(file ? URL.createObjectURL(file) : null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const fd = new FormData();
            fd.append('Name', formData.Name);
            fd.append('Color', formData.Color);
            fd.append('Age', formData.Age);
            if (formData.imageFile) fd.append('profileImage', formData.imageFile);

            const response = await apiFetch('/pet/createPet', {
                method: 'POST',
                body: fd
            });

            const data = await response.json();
            if (response.ok) {
                navigate('/dashboard');
            } else {
                alert('Error creating pet: ' + (data.error || data.message));
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div className="form-container">
            <h2>Add a New Pet</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Name:</label>
                    <input
                        type="text"
                        onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Color:</label>
                    <input
                        type="text"
                        onChange={(e) => setFormData({...formData, Color: e.target.value})}
                    />
                </div>

                <div className="form-group">
                    <label>Age:</label>
                    <input
                        type="number"
                        onChange={(e) => setFormData({...formData, Age: e.target.value})}
                    />
                </div>

                <div className="form-group">
                    <label>Photo:</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} />
                    {previewUrl && <img src={previewUrl} alt="preview" className="image-preview" />}
                </div>

                <button type="submit" className="submit-btn">Create Pet</button>
            </form>
        </div>
    );
}

export default CreatePet;

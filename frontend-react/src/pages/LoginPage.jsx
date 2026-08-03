import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api';
import { useAuth } from '../context/AuthContext';


const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (response.ok) {
                login(data.token, data.username);
                navigate('/dashboard');
            } else {
                alert('Login failed: ' + (data.error || data.message));
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div className="login" style={{ padding: '20px' }}>
            <h1>Login</h1>
            <form onSubmit={handleSubmit}>
                <div className="username">
                    <label>Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        required
                    />
                </div>
                <div className="password">
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                    />
                </div>
                <div>
                    <button type="submit" style={{ marginTop: '10px' }}>Login</button>
                </div>
            </form>
        </div>
    );
 }

export default Login;
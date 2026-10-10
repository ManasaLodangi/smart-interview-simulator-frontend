import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createInterview } from '../services/api';

const StartInterview = () => {
    const navigate = useNavigate();
    const [jobRole, setJobRole] = useState('Software Developer');
    const [interviewType, setInterviewType] = useState('Technical');
    const [difficulty, setDifficulty] = useState('Medium');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        try {
            const data = { jobRole, interviewType, difficulty };
            const response = await createInterview(data);
            sessionStorage.setItem('activeInterviewId', response.id);
            navigate('/interview', { state: { interviewId: response.id } });
        } catch (err) {
            console.error('Failed to start interview:', err);
            if (err.response && err.response.data && err.response.data.message) {
                setError(`Unable to start the interview: ${err.response.data.message}`);
            } else {
                setError('Unable to start the interview. Please make sure the backend server is running.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="card" style={{ maxWidth: '500px' }}>
                <h2 style={{ marginTop: 0, marginBottom: '1.5rem', textAlign: 'center' }}>Start New Interview</h2>
                
                {error && <div className="alert alert-danger">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Job Role</label>
                        <select className="form-control" value={jobRole} onChange={(e) => setJobRole(e.target.value)} disabled={isLoading}>
                            <option>Software Developer</option>
                            <option>Data Scientist</option>
                            <option>Java Developer</option>
                            <option>Python Developer</option>
                            <option>Frontend Developer</option>
                            <option>Backend Developer</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Interview Type</label>
                        <select className="form-control" value={interviewType} onChange={(e) => setInterviewType(e.target.value)} disabled={isLoading}>
                            <option>Technical</option>
                            <option>HR</option>
                            <option>Behavioral</option>
                            <option>Mixed</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Difficulty</label>
                        <select className="form-control" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} disabled={isLoading}>
                            <option>Easy</option>
                            <option>Medium</option>
                            <option>Hard</option>
                        </select>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.8rem' }} disabled={isLoading}>
                        {isLoading ? 'Starting Interview...' : 'Start Interview'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default StartInterview;

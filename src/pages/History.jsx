import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInterviewHistory, getInterviewReport } from '../services/api';

const History = () => {
    const navigate = useNavigate();
    
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [loadingReportId, setLoadingReportId] = useState(null);

    const fetchHistory = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getInterviewHistory();
            setHistory(data);
        } catch (err) {
            console.error('Failed to fetch interview history:', err);
            setError('Unable to load interview history. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleViewReport = async (interviewId) => {
        setLoadingReportId(interviewId);
        try {
            const report = await getInterviewReport(interviewId);
            sessionStorage.setItem('viewingReportId', interviewId);
            navigate('/results', { state: { report }, replace: true });
        } catch (err) {
            console.error('Failed to fetch interview report:', err);
            alert('Unable to load the report. Please try again.');
        } finally {
            setLoadingReportId(null);
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Interview History</h2>
            
            {isLoading && (
                <div className="card text-center">
                    <h3>Loading history...</h3>
                    <p className="text-muted">Please wait while we retrieve your past interviews.</p>
                </div>
            )}

            {error && !isLoading && (
                <div className="alert alert-danger text-center">
                    <h3 style={{ marginTop: 0 }}>Error</h3>
                    <p>{error}</p>
                    <button className="btn btn-secondary" onClick={fetchHistory} style={{ marginTop: '1rem' }}>
                        Retry
                    </button>
                </div>
            )}

            {!isLoading && !error && history.length === 0 && (
                <div className="card text-center" style={{ backgroundColor: '#f8f9fa' }}>
                    <h3 style={{ margin: '0 0 1rem 0' }}>No Interviews Found</h3>
                    <p className="text-muted" style={{ marginBottom: '1.5rem' }}>You haven't completed any interviews yet.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/start-interview')}>Start an Interview</button>
                </div>
            )}
            
            {!isLoading && !error && history.length > 0 && (
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Job Role</th>
                                <th>Type</th>
                                <th>Difficulty</th>
                                <th>Date</th>
                                <th>Score</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((interview) => (
                                <tr key={interview.interviewId}>
                                    <td>{interview.jobRole}</td>
                                    <td>{interview.interviewType}</td>
                                    <td>{interview.difficulty}</td>
                                    <td>
                                        {new Date(interview.startTime).toLocaleDateString()}
                                    </td>
                                    <td style={{ fontWeight: 'bold', color: interview.status === 'COMPLETED' ? 'var(--success-color)' : 'var(--secondary-color)' }}>
                                        {interview.status === 'COMPLETED' ? interview.totalScore : '-'}
                                    </td>
                                    <td>
                                        <span className={`badge ${interview.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                                            {interview.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                                        </span>
                                    </td>
                                    <td>
                                        {interview.status === 'COMPLETED' ? (
                                            <button 
                                                className="btn btn-primary" 
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
                                                onClick={() => handleViewReport(interview.interviewId)}
                                                disabled={loadingReportId === interview.interviewId}
                                            >
                                                {loadingReportId === interview.interviewId ? 'Loading...' : 'View Report'}
                                            </button>
                                        ) : (
                                            <span className="text-muted" style={{ fontSize: '0.9rem' }}>N/A</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default History;

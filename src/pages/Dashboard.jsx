import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getInterviewHistory } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const authUserStr = sessionStorage.getItem('authUser');
    let user = { name: 'User' };
    try {
        if (authUserStr) user = JSON.parse(authUserStr);
    } catch(e) {}

    const fetchHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getInterviewHistory();
            setHistory(data);
        } catch (err) {
            console.error('Failed to load history', err);
            setError('Could not load statistics and history.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    // Calculate stats
    const totalInterviews = history.length;
    const completedInterviews = history.filter(i => i.status === 'COMPLETED');
    const inProgressInterviews = history.filter(i => i.status === 'IN_PROGRESS');
    
    let avgScore = '-';
    const scoredInterviews = completedInterviews.filter(i => i.totalScore !== null && i.totalScore !== undefined);
    if (scoredInterviews.length > 0) {
        const sum = scoredInterviews.reduce((acc, curr) => acc + curr.totalScore, 0);
        avgScore = Math.round(sum / scoredInterviews.length) + '%';
    }

    const recentInterviews = history.slice(0, 3);

    return (
        <div className="dashboard-container">
            <div className="welcome-section">
                <h1>Welcome back, {user.name}!</h1>
                <p>Ready to sharpen your technical and behavioral skills?</p>
                <Link to="/start-interview" className="btn cta-button">
                    Start New Interview
                </Link>
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-col">
                    <div className="card">
                        <h2>Your Statistics</h2>
                        {loading ? (
                            <div className="text-center text-muted" style={{ padding: '2rem 0' }}>Loading statistics...</div>
                        ) : error ? (
                            <div className="alert alert-danger">
                                <p>{error}</p>
                                <button className="btn btn-secondary" onClick={fetchHistory}>Retry</button>
                            </div>
                        ) : (
                            <div className="stats-grid">
                                <div className="stat-box">
                                    <div className="stat-value">{totalInterviews}</div>
                                    <div className="stat-label">Total</div>
                                </div>
                                <div className="stat-box">
                                    <div className="stat-value">{completedInterviews.length}</div>
                                    <div className="stat-label">Completed</div>
                                </div>
                                <div className="stat-box">
                                    <div className="stat-value">{inProgressInterviews.length}</div>
                                    <div className="stat-label">In Progress</div>
                                </div>
                                <div className="stat-box">
                                    <div className="stat-value">{avgScore}</div>
                                    <div className="stat-label">Avg Score</div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0 }}>Recent Interviews</h2>
                            <Link to="/history" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>View All History</Link>
                        </div>
                        
                        {loading ? (
                            <div className="text-center text-muted">Loading recent interviews...</div>
                        ) : error ? (
                            <div className="text-muted">Unavailable</div>
                        ) : recentInterviews.length === 0 ? (
                            <div className="text-center text-muted" style={{ padding: '2rem 0', background: 'var(--bg-main)', borderRadius: '6px' }}>
                                No interviews yet. Start one to see it here!
                            </div>
                        ) : (
                            <div className="recent-list">
                                {recentInterviews.map(interview => (
                                    <div key={interview.id} className="recent-item">
                                        <div>
                                            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{interview.jobRole}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                {interview.interviewType} • {interview.difficulty}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ marginBottom: '0.25rem' }}>
                                                {interview.status === 'COMPLETED' ? (
                                                    <span className="badge badge-success">Score: {interview.totalScore}%</span>
                                                ) : (
                                                    <span className="badge badge-warning">In Progress</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="dashboard-col">
                    <div className="card">
                        <h2>Features Overview</h2>
                        <ul className="features-list">
                            <li>?? <strong>AI-generated questions:</strong> Tailored to your role and difficulty.</li>
                            <li>?? <strong>Adaptive AI questioning:</strong> The AI adapts based on your previous answers.</li>
                            <li>?? <strong>AI answer evaluation:</strong> Get instant, detailed feedback.</li>
                            <li>??? <strong>Voice answers:</strong> Speak naturally using your microphone.</li>
                            <li>?? <strong>Interview reports:</strong> Comprehensive performance summaries.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

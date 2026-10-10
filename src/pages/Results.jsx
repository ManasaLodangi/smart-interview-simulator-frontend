import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { getInterviewReport } from '../services/api';

const Results = () => {
    const location = useLocation();
    
    const [report, setReport] = useState(location.state?.report || null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!report) {
            const storedId = sessionStorage.getItem('viewingReportId');
            if (storedId) {
                const fetchReport = async () => {
                    setIsLoading(true);
                    try {
                        const data = await getInterviewReport(storedId);
                        setReport(data);
                    } catch (err) {
                        console.error('Failed to recover report on refresh', err);
                        setError(true);
                    } finally {
                        setIsLoading(false);
                    }
                };
                fetchReport();
            } else {
                setError(true);
            }
        }
    }, [report]);

    if (isLoading) {
        return (
            <div className="card text-center" style={{ maxWidth: '800px', margin: '2rem auto' }}>
                <h3>Loading Report...</h3>
                <p className="text-muted">Please wait while we retrieve your interview results.</p>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="card text-center" style={{ maxWidth: '800px', margin: '2rem auto' }}>
                <h3 className="alert alert-danger" style={{ marginBottom: '1rem' }}>Report unavailable.</h3>
                <p className="text-muted" style={{ marginBottom: '2rem' }}>We could not find the active report. You may have refreshed without an active session.</p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <Link to="/" className="btn btn-primary">Back to Dashboard</Link>
                    <Link to="/history" className="btn btn-secondary">View History</Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <div className="text-center" style={{ marginBottom: '2rem' }}>
                <h1 style={{ color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>Final Interview Report</h1>
                <p className="text-muted" style={{ margin: 0, fontSize: '1.1rem' }}>Review your performance and AI feedback</p>
            </div>
            
            <div className="card">
                <h3 style={{ marginTop: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>Interview Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                    <div>
                        <strong className="text-muted" style={{ display: 'block', marginBottom: '0.2rem' }}>Job Role:</strong>
                        <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{report.jobRole}</div>
                    </div>
                    <div>
                        <strong className="text-muted" style={{ display: 'block', marginBottom: '0.2rem' }}>Interview Type:</strong>
                        <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{report.interviewType}</div>
                    </div>
                    <div>
                        <strong className="text-muted" style={{ display: 'block', marginBottom: '0.2rem' }}>Difficulty:</strong>
                        <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{report.difficulty}</div>
                    </div>
                    <div>
                        <strong className="text-muted" style={{ display: 'block', marginBottom: '0.2rem' }}>Duration:</strong>
                        <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                            {new Date(report.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(report.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                    </div>
                </div>
            </div>

            <div className="card text-center" style={{ backgroundColor: 'var(--bg-main)' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Overall Score</h3>
                <div style={{ fontSize: '4.5rem', fontWeight: '800', color: 'var(--success-color)', lineHeight: '1' }}>
                    {report.totalScore} <span style={{ fontSize: '2rem', color: 'var(--secondary-color)', fontWeight: '500' }}>/ 100</span>
                </div>
            </div>

            <div className="card">
                <h3 style={{ marginTop: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', color: 'var(--primary-color)' }}>Overall Feedback</h3>
                <p style={{ lineHeight: '1.8', whiteSpace: 'pre-line', fontSize: '1.05rem', margin: '1.5rem 0 0 0' }}>{report.overallFeedback}</p>
            </div>

            <div className="card">
                <h3 style={{ marginTop: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>Performance Summary</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginTop: '1.5rem' }}>
                    <div style={{ flex: '1', minWidth: '150px', padding: '1.5rem', backgroundColor: '#f1f8ff', borderRadius: '8px', textAlign: 'center', border: '1px solid #cce5ff' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#0366d6', marginBottom: '0.5rem' }}>{report.totalQuestions}</div>
                        <div style={{ color: '#586069', fontWeight: '500' }}>Total Questions</div>
                    </div>
                    <div style={{ flex: '1', minWidth: '150px', padding: '1.5rem', backgroundColor: '#f0fdf4', borderRadius: '8px', textAlign: 'center', border: '1px solid #d1e7dd' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#16a34a', marginBottom: '0.5rem' }}>{report.evaluatedQuestions}</div>
                        <div style={{ color: '#4b5563', fontWeight: '500' }}>Evaluated Questions</div>
                    </div>
                </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', margin: '2rem 0' }}>
                <Link to="/" className="btn btn-primary" style={{ padding: '0.8rem 1.5rem' }}>Back to Dashboard</Link>
                <Link to="/history" className="btn btn-secondary" style={{ padding: '0.8rem 1.5rem' }}>View History</Link>
            </div>
        </div>
    );
};

export default Results;

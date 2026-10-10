import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { generateFirstQuestion, submitAnswer, evaluateAnswer, generateAdaptiveQuestion, completeInterview } from '../services/api';

const Interview = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Recover ID from router state or fallback to session storage for refresh safety
    const stateInterviewId = location.state?.interviewId;
    const sessionInterviewId = sessionStorage.getItem('activeInterviewId');
    const interviewId = stateInterviewId || (sessionInterviewId ? Number(sessionInterviewId) : null);
    
    const [question, setQuestion] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const [answerText, setAnswerText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submittedAnswerId, setSubmittedAnswerId] = useState(null);
    
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [evalError, setEvalError] = useState(null);
    const [evaluation, setEvaluation] = useState(null);

        const [isGeneratingNext, setIsGeneratingNext] = useState(false);
    const [nextQuestionError, setNextQuestionError] = useState(null);

    const [showConfirmFinish, setShowConfirmFinish] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const [completeError, setCompleteError] = useState(null);

    // Voice recognition states
    const [isListening, setIsListening] = useState(false);
    const [speechError, setSpeechError] = useState(null);
    const recognitionRef = useRef(null);
    const [interimTranscript, setInterimTranscript] = useState('');
    
    // Prevent duplicate fetching in React StrictMode
    const hasFetched = useRef(false);

    const fetchQuestion = async () => {
        if (!interviewId) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await generateFirstQuestion(interviewId);
            setQuestion(response);
        } catch (err) {
            console.error('Failed to generate question:', err);
            setError('Unable to generate the interview question. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (interviewId && !hasFetched.current) {
            hasFetched.current = true;
            // Ensure session storage matches reality
            sessionStorage.setItem('activeInterviewId', interviewId);
            fetchQuestion();
        }
    }, [interviewId]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setSpeechError("Voice input is not supported in this browser. You can type your answer instead.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
            let currentInterim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    const finalSegment = event.results[i][0].transcript.trim();
                    setAnswerText(prev => prev + (prev ? ' ' : '') + finalSegment);
                } else {
                    currentInterim += event.results[i][0].transcript;
                }
            }
            setInterimTranscript(currentInterim);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                setSpeechError('Microphone access denied.');
            }
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
            setInterimTranscript('');
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
            setInterimTranscript('');
        }
    };

    const toggleListening = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            stopListening();
        } else {
            setSpeechError(null);
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (err) {
                console.error("Failed to start speech recognition:", err);
            }
        }
    };

    const handleAnswerSubmit = async () => {
        stopListening();
        if (!answerText.trim()) {
            setSubmitError('Please enter your answer before submitting.');
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const response = await submitAnswer(question.id, answerText.trim());
            setSubmittedAnswerId(response.id);
        } catch (err) {
            console.error('Failed to submit answer:', err);
            setSubmitError('Unable to submit your answer. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEvaluateAnswer = async () => {
        if (!submittedAnswerId) return;

        setIsEvaluating(true);
        setEvalError(null);

        try {
            const response = await evaluateAnswer(submittedAnswerId);
            setEvaluation(response);
        } catch (err) {
            console.error('Failed to evaluate answer:', err);
            setEvalError('Unable to evaluate your answer. Please try again.');
        } finally {
            setIsEvaluating(false);
        }
    };

    const handleNextQuestion = async () => {
        stopListening();
        if (!interviewId) return;

        setIsGeneratingNext(true);
        setNextQuestionError(null);

        try {
            const response = await generateAdaptiveQuestion(interviewId);
            setQuestion(response);
            setAnswerText('');
            setSubmittedAnswerId(null);
            setEvaluation(null);
            setSubmitError(null);
            setEvalError(null);
            setShowConfirmFinish(false);
            setCompleteError(null);
        } catch (err) {
            console.error('Failed to generate adaptive question:', err);
            setNextQuestionError('Unable to generate the next question. Please try again.');
        } finally {
            setIsGeneratingNext(false);
        }
    };

    const handleFinishInterview = async () => {
        stopListening();
        if (!interviewId) return;

        setIsCompleting(true);
        setCompleteError(null);

        try {
            const report = await completeInterview(interviewId);
            // Cleanup active interview and prime results
            sessionStorage.removeItem('activeInterviewId');
            sessionStorage.setItem('viewingReportId', report.interviewId);
            navigate('/results', { state: { report }, replace: true });
        } catch (err) {
            console.error('Failed to finish interview:', err);
            setCompleteError('Unable to complete the interview. Please try again.');
            setShowConfirmFinish(false);
        } finally {
            setIsCompleting(false);
        }
    };

    if (!interviewId) {
        return (
            <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                <h2>No Active Interview</h2>
                <p>We couldn't find an active interview session.</p>
                <Link to="/start-interview" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                    Start New Interview
                </Link>
            </div>
        );
    }

    if (isCompleting) {
        return (
            <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <h3>Generating your final interview report...</h3>
                    <p style={{ color: '#666' }}>Please wait while the AI calculates your final score and overall feedback.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>Interview in Progress</h2>
                <div style={{ padding: '0.5rem', backgroundColor: '#e8f4fd', borderRadius: '4px', border: '1px solid #b6d4fe', fontSize: '0.9rem' }}>
                    <span style={{ color: '#084298' }}>ID: {interviewId}</span>
                </div>
            </div>
            
            {isLoading && (
                <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <h3>Generating your interview question...</h3>
                    <p style={{ color: '#666' }}>Please wait while the AI analyzes the requirements.</p>
                </div>
            )}
            
            {error && !isLoading && (
                <div className="card" style={{ textAlign: 'center', padding: '2rem 1rem', border: '1px solid #f5c2c7', backgroundColor: '#f8d7da' }}>
                    <h3 style={{ color: '#842029', marginTop: 0 }}>Error</h3>
                    <p style={{ color: '#842029' }}>{error}</p>
                    <button className="btn btn-primary" onClick={fetchQuestion} style={{ marginTop: '1rem' }}>
                        Try Again
                    </button>
                </div>
            )}
            
            {question && !isLoading && !error && (
                <>
                    {isGeneratingNext ? (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', marginBottom: '1.5rem' }}>
                            <h3>Generating your next question...</h3>
                            <p style={{ color: '#666' }}>Please wait while the AI analyzes your previous answer.</p>
                        </div>
                    ) : (
                        <>
                            <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem', backgroundColor: '#fff', borderLeft: '4px solid #3498db' }}>
                                <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Question {question.questionOrder}</h3>
                                <p style={{ fontSize: '1.1rem', lineHeight: '1.5' }}>{question.questionText}</p>
                            </div>
                            
                            {submitError && (
                                <div style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #f5c2c7', backgroundColor: '#f8d7da', color: '#842029', borderRadius: '4px' }}>
                                    {submitError}
                                </div>
                            )}

                            {submittedAnswerId && !evaluation && (
                                <div style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #badbcc', backgroundColor: '#d1e7dd', color: '#0f5132', borderRadius: '4px' }}>
                                    Answer submitted successfully. (Answer ID: {submittedAnswerId})
                                </div>
                            )}

                            {completeError && (
                                <div style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #f5c2c7', backgroundColor: '#f8d7da', color: '#842029', borderRadius: '4px' }}>
                                    {completeError}
                                </div>
                            )}
                            
                                                        <div style={{ marginBottom: '1.5rem' }}>
                                {speechError && (
                                    <div style={{ padding: '0.5rem', marginBottom: '0.5rem', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '4px', fontSize: '0.9rem' }}>
                                        {speechError}
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                    <button 
                                        className="btn" 
                                        style={{ 
                                            backgroundColor: isListening ? '#dc3545' : '#6c757d', 
                                            color: 'white', 
                                            padding: '0.4rem 0.8rem', 
                                            fontSize: '0.9rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                        onClick={toggleListening}
                                        disabled={isSubmitting || submittedAnswerId !== null}
                                        type="button"
                                    >
                                        {isListening ? '?? Listening... (Click to Stop)' : '?? Start Voice Answer'}
                                    </button>
                                </div>
                                <textarea 
                                    rows="6" 
                                    style={{ 
                                        width: '100%', 
                                        padding: '1rem', 
                                        border: isListening ? '2px solid #dc3545' : '1px solid #ccc', 
                                        borderRadius: '4px',
                                        fontFamily: 'inherit',
                                        fontSize: '1rem',
                                        resize: 'vertical',
                                        backgroundColor: submittedAnswerId ? '#f8f9fa' : 'white',
                                        outline: 'none',
                                        transition: 'border 0.3s'
                                    }} 
                                    placeholder="Type your answer here or use the microphone..."
                                    value={answerText + (interimTranscript ? (answerText ? ' ' : '') + interimTranscript : '')}
                                    onChange={(e) => {
                                        setAnswerText(e.target.value);
                                    }}
                                    disabled={isSubmitting || submittedAnswerId !== null}
                                ></textarea>
                            </div>

                            {!submittedAnswerId && (
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={handleAnswerSubmit}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Submitting your answer...' : 'Submit Answer'}
                                    </button>
                                </div>
                            )}

                            {submittedAnswerId && !evaluation && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                                    {evalError && (
                                        <div style={{ padding: '1rem', border: '1px solid #f5c2c7', backgroundColor: '#f8d7da', color: '#842029', borderRadius: '4px' }}>
                                            {evalError}
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button 
                                            className="btn btn-primary" 
                                            onClick={handleEvaluateAnswer}
                                            disabled={isEvaluating}
                                            style={{ backgroundColor: '#2ecc71', color: '#fff' }}
                                        >
                                            {isEvaluating ? 'AI is evaluating your answer...' : 'Evaluate My Answer'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {evaluation && (
                                <div className="card" style={{ marginBottom: '2rem', border: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}>
                                    <h2 style={{ textAlign: 'center', margin: '0 0 1rem 0' }}>Overall Score</h2>
                                    <h1 style={{ textAlign: 'center', fontSize: '3rem', color: '#2ecc71', margin: '0 0 2rem 0' }}>
                                        {evaluation.score} / 100
                                    </h1>
                                    
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                                        <div style={{ flex: '1', minWidth: '150px', padding: '1rem', background: '#fff', borderRadius: '4px', border: '1px solid #eee' }}>
                                            <strong>Relevance:</strong> <span style={{ float: 'right' }}>{evaluation.relevanceScore}</span>
                                        </div>
                                        <div style={{ flex: '1', minWidth: '150px', padding: '1rem', background: '#fff', borderRadius: '4px', border: '1px solid #eee' }}>
                                            <strong>Correctness:</strong> <span style={{ float: 'right' }}>{evaluation.correctnessScore}</span>
                                        </div>
                                        <div style={{ flex: '1', minWidth: '150px', padding: '1rem', background: '#fff', borderRadius: '4px', border: '1px solid #eee' }}>
                                            <strong>Clarity:</strong> <span style={{ float: 'right' }}>{evaluation.clarityScore}</span>
                                        </div>
                                        <div style={{ flex: '1', minWidth: '150px', padding: '1rem', background: '#fff', borderRadius: '4px', border: '1px solid #eee' }}>
                                            <strong>Technical Depth:</strong> <span style={{ float: 'right' }}>{evaluation.technicalDepthScore}</span>
                                        </div>
                                        <div style={{ flex: '1', minWidth: '150px', padding: '1rem', background: '#fff', borderRadius: '4px', border: '1px solid #eee' }}>
                                            <strong>Communication:</strong> <span style={{ float: 'right' }}>{evaluation.communicationScore}</span>
                                        </div>
                                    </div>
                                    
                                    <h3 style={{ color: '#27ae60', borderBottom: '1px solid #ccc', paddingBottom: '0.5rem' }}>Strengths</h3>
                                    <p style={{ lineHeight: '1.6' }}>{evaluation.strengths}</p>
                                    
                                    <h3 style={{ color: '#c0392b', borderBottom: '1px solid #ccc', paddingBottom: '0.5rem', marginTop: '1.5rem' }}>Weaknesses</h3>
                                    <p style={{ lineHeight: '1.6' }}>{evaluation.weaknesses}</p>
                                    
                                    <h3 style={{ color: '#2980b9', borderBottom: '1px solid #ccc', paddingBottom: '0.5rem', marginTop: '1.5rem' }}>Improvement Suggestions</h3>
                                    <p style={{ lineHeight: '1.6', marginBottom: '2rem' }}>{evaluation.improvementSuggestions}</p>

                                    {nextQuestionError && (
                                        <div style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #f5c2c7', backgroundColor: '#f8d7da', color: '#842029', borderRadius: '4px' }}>
                                            {nextQuestionError}
                                        </div>
                                    )}

                                    {showConfirmFinish ? (
                                        <div style={{ padding: '1.5rem', backgroundColor: '#fff3cd', border: '1px solid #ffe69c', borderRadius: '4px', marginTop: '1.5rem' }}>
                                            <h4 style={{ margin: '0 0 1rem 0', color: '#664d03' }}>Finish Interview?</h4>
                                            <p style={{ color: '#664d03', marginBottom: '1rem' }}>Are you sure you want to finish the interview? You will not be able to continue answering questions after completing it.</p>
                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                <button className="btn btn-primary" style={{ backgroundColor: '#dc3545' }} onClick={handleFinishInterview}>Confirm / Finish</button>
                                                <button className="btn btn-secondary" onClick={() => setShowConfirmFinish(false)}>Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid #e0e0e0', paddingTop: '1.5rem' }}>
                                            <button 
                                                className="btn btn-primary" 
                                                onClick={handleNextQuestion}
                                                disabled={isGeneratingNext}
                                            >
                                                {isGeneratingNext ? 'Generating your next question...' : 'Next Question'}
                                            </button>
                                            <button 
                                                className="btn btn-secondary" 
                                                onClick={() => setShowConfirmFinish(true)} 
                                                style={{ marginLeft: 'auto', backgroundColor: '#dc3545' }}
                                                disabled={isGeneratingNext}
                                            >
                                                Finish Interview
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default Interview;


import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercept requests to add JWT token
api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const registerUser = async (data) => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
};

export const loginUser = async (data) => {
    const response = await api.post('/api/auth/login', data);
    return response.data;
};

export const createInterview = async (data) => {
    const response = await api.post('/api/interviews', data);
    return response.data;
};

export const generateFirstQuestion = async (interviewId) => {
    const response = await api.post(`/api/interviews/${interviewId}/generate-question`);
    return response.data;
};

export const generateAdaptiveQuestion = async (interviewId) => {
    const response = await api.post(`/api/interviews/${interviewId}/generate-adaptive-question`);
    return response.data;
};

export const submitAnswer = async (questionId, answerText) => {
    const response = await api.post('/api/answers', { questionId, answerText });
    return response.data;
};

export const evaluateAnswer = async (answerId) => {
    const response = await api.post(`/api/answers/${answerId}/evaluate`);
    return response.data;
};

export const completeInterview = async (interviewId) => {
    const response = await api.put(`/api/interviews/${interviewId}/complete`);
    return response.data;
};

export const getInterviewHistory = async () => {
    const response = await api.get('/api/interviews');
    return response.data;
};

export const getInterviewReport = async (interviewId) => {
    const response = await api.get(`/api/interviews/${interviewId}/report`);
    return response.data;
};

export default api;

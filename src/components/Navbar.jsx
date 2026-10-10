import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const token = sessionStorage.getItem('authToken');
    const authUserStr = sessionStorage.getItem('authUser');
    const isLoggedIn = !!token;
    
    let user = null;
    if (authUserStr) {
        try { user = JSON.parse(authUserStr); } catch (e) {}
    }

    const handleLogout = () => {
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('authUser');
        sessionStorage.removeItem('activeInterviewId');
        sessionStorage.removeItem('viewingReportId');
        navigate('/login');
    };

    return (
        <nav className="navbar" aria-label="Main Navigation">
            <div className="navbar-brand">
                <Link to={isLoggedIn ? "/" : "/login"}>Smart Interview Simulator</Link>
            </div>
            <div className="navbar-links">
                {isLoggedIn ? (
                    <>
                        <Link to="/">Dashboard</Link>
                        <Link to="/start-interview">Start Interview</Link>
                        <Link to="/history">History</Link>
                        <div className="navbar-user">
                            {user && <span className="user-greeting">Hi, {user.name}</span>}
                            <button className="logout-btn" onClick={handleLogout} aria-label="Logout">
                                Logout
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {location.pathname !== '/login' && <Link to="/login">Login</Link>}
                        {location.pathname !== '/register' && <Link to="/register">Register</Link>}
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;

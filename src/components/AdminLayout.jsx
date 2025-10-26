import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import axios from 'axios';
import { GOOGLE_SCRIPT_URL } from '../util/globalVariables';
import { Container, Row, Col, Nav, Spinner, Alert, Button } from 'react-bootstrap';
import { parseDate } from '../util/utility';

// --- SVGs for Sidebar Icons ---
const DashboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-grid-fill me-2" viewBox="0 0 16 16">
        <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3A1.5 1.5 0 0 1 15 10.5v3A1.5 1.5 0 0 1 13.5 15h-3A1.5 1.5 0 0 1 9 13.5v-3z" />
    </svg>
);

const TableIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-layout-text-sidebar-reverse me-2" viewBox="0 0 16 16">
        <path d="M12.5 3a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1h5zm0 3a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1h5zm.5 3.5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h5a.5.5 0 0 0 .5-.5zm.5 2.5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h5a.5.5 0 0 0 .5-.5z" />
        <path d="M16 2a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2zM4 1v14H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h2zm1 0h9a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5V1z" />
    </svg>
);

const QuizIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-patch-question-fill me-2" viewBox="0 0 16 16">
        <path d="M5.933.87a1.5 1.5 0 0 1 1.866 0l.233.117c.17.085.358.112.533.001l.03-.018a1.5 1.5 0 0 1 1.866 0l2.867 1.433c.17.085.358.112.533.001l.03-.018a1.5 1.5 0 0 1 1.866 0l1.433 2.867c.085.17.112.358.001.533l-.018.03a1.5 1.5 0 0 1 0 1.866l1.433 2.867c.085.17.112.358.001.533l-.018.03a1.5 1.5 0 0 1 0 1.866l-1.433 2.867c-.085.17-.112.358-.001.533l.018.03a1.5 1.5 0 0 1 0 1.866l-2.867 1.433c-.17.085-.358.112-.533.001l-.03-.018a1.5 1.5 0 0 1-1.866 0l-2.867-1.433c-.17-.085-.358-.112-.533-.001l-.03.018a1.5 1.5 0 0 1-1.866 0l-2.867-1.433c-.17-.085-.358-.112-.533-.001l-.03.018a1.5 1.5 0 0 1-1.866 0L.87 13.067c-.085-.17-.112-.358-.001-.533l.018-.03a1.5 1.5 0 0 1 0-1.866L.021 7.77c-.085-.17-.112-.358-.001-.533l.018-.03a1.5 1.5 0 0 1 0-1.866L.87 2.47c.085-.17.112-.358.001-.533l-.018-.03a1.5 1.5 0 0 1 0-1.866l2.867-1.433c.17-.085.358-.112.533-.001l.03.018a1.5 1.5 0 0 1 1.866 0l.233-.117zM7.002 11a1 1 0 1 0 2 0 1 1 0 0 0-2 0zm1.354-3.354a.5.5 0 0 0-.708.708l.147.147a1.5 1.5 0 0 0 2.121 0l.147-.147a.5.5 0 0 0-.708-.708L9.5 8.146a.5.5 0 0 0-.707 0l-.646.646zM8 4a.905.905 0 0 0-.9.9c0 .534.23 1.02.634 1.488.08.11.166.216.258.322.162.19.348.376.548.56C8.88 7.86 9.25 8.32 9.25 9.011v.015a.5.5 0 0 0 1 0V9c0-.853-.37-1.543-.87-2.025A3.2 3.2 0 0 0 8 4z"/>
    </svg>
);

const BookingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-house-door-fill me-2" viewBox="0 0 16 16">
        <path d="M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354l-6-6a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5z" />
    </svg>
);

const CollapseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-chevron-bar-left" viewBox="0 0 16 16">
        <path fillRule="evenodd" d="M11.854 3.646a.5.5 0 0 1 0 .708L8.207 8l3.647 3.646a.5.5 0 0 1-.708.708l-4-4a.5.5 0 0 1 0-.708l4-4a.5.5 0 0 1 .708 0zM4.5 1a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 1 0v-13a.5.5 0 0 0-.5-.5z"/>
    </svg>
);

const ExpandIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-list" viewBox="0 0 16 16">
        <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
    </svg>
);

const getCssDate = (date) => {
    let d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [day, month, year].join('/');
}

function AdminLayout() {
    const [bookings, setBookings] = useState([]);
    const [tables, setTables] = useState([]);
    const [quizData, setQuizData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(GOOGLE_SCRIPT_URL);
            console.log('response.data: ', response.data);

            if (response.data && response.data.bookings && response.data.tables && response.data.quizzes) {

                // 1. Parse Bookings
                const parsedBookings = response.data.bookings.map(b => {
                    const jsDate = parseDate(b.bookingDate);
                    return {
                        ...b,
                        jsDate: jsDate,
                        cssDate: getCssDate(jsDate), // YYYY-MM-DD format
                        groupSize: parseInt(b.groupSize, 10), // Ensure groupSize is a number
                        isWinner: b.isWinner === 'TRUE' || b.isWinner === true // Handle string/boolean
                    };
                });

                // 2. Parse Tables
                const parsedTables = response.data.tables.map(t => ({
                    ...t,
                    maxGroupSize: parseInt(t.maxGroupSize, 10)
                }));

                // 3. Parse Quiz Data
                const parsedQuizData = response.data.quizzes.map(q => {
                    console.log('q: ', q);
                    let jsDate;

                    if (typeof q.quizDate === 'number') {
                        jsDate = new Date(q.quizDate);
                    }
                    else if (typeof q.quizDate === 'string') {
                        jsDate = parseDate(q.quizDate);
                    }
                    else {
                        console.warn("Unexpected quizDate format:", q.quizDate);
                        jsDate = new Date(); // Use 'now' as a fallback
                    }

                    const cssDate = getCssDate(jsDate);

                    return {
                        ...q,
                        jsDate: jsDate,
                        cssDate: cssDate,
                        quizId: parseInt(q.quizId, 10)
                    };
                });

                // 4. Set all states
                setBookings(parsedBookings);
                setTables(parsedTables);
                setQuizData(parsedQuizData);

            } else {
                setError(response.data.message || 'Failed to fetch all required data (bookings, tables, quizData).');
            }
        } catch (err) {
            console.error("Error fetching admin data:", err);
            setError(err.message || 'An unknown error occurred while fetching data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getNavLinkClass = (path) => {
        return location.pathname === path ? 'nav-link active' : 'nav-link';
    };

    return (
        <>
            <style type="text/css">
                {`
                body {
                    background-color: #f8f9fa;
                }
                .admin-wrapper {
                    display: flex;
                    min-height: 100vh;
                    overflow-x: hidden;
                }
                .sidebar {
                    width: 250px;
                    flex-shrink: 0;
                    background-color: #343a40;
                    color: white;
                    padding: 1.5rem 1rem;
                    position: fixed;
                    top: 0;
                    bottom: 0;
                    left: 0;
                    z-index: 1000;
                    transition: transform 0.3s ease-in-out;
                }
                .sidebar.closed {
                    transform: translateX(-100%);
                }
                .sidebar.open {
                    left: 0;
                }
                    .sidebar-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem; /* Replaces h4.mb-4 */
                }
                .sidebar-header h4 {
                    margin-bottom: 0; /* Remove default margin */
                }
                .sidebar-collapse-btn {
                    background: none;
                    border: none;
                    color: #adb5bd;
                    padding: 0.25rem 0.5rem;
                }
                .sidebar-collapse-btn:hover {
                    background: #495057;
                    color: white;
                }
                .sidebar .nav-link {
                    color: #adb5bd;
                    display: flex;
                    align-items: center;
                    padding: 0.75rem 1rem;
                    border-radius: 0.25rem;
                }
                .sidebar .nav-link:hover {
                    color: white;
                    background-color: #495057;
                }
                .sidebar .nav-link.active {
                    color: white;
                    background-color: #0d6efd;
                    font-weight: bold;
                }
                .sidebar .nav-link svg {
                    vertical-align: -0.125em; 
                }
                .content-area {
                    padding: 2rem;
                    width: 100%; 
                    margin-left: 0; 
                    transition: margin-left 0.3s ease-in-out;
                    position: relative;
                }
                .content-area.open {
                    margin-left: 250px;
                    width: calc(100% - 250px);
                }
                .sidebar-toggle-btn {
                    position: fixed;
                    top: 1rem;
                    left: 1rem;
                    z-index: 1050; 
                    background: #fff;
                    border: 1px solid #dee2e6;
                    box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,.075);
                }
                `}
            </style>
            <div className="admin-wrapper">
                 {!isSidebarOpen && (
                    <Button
                        variant="light"
                        onClick={toggleSidebar}
                        className="sidebar-toggle-btn"
                        aria-label="Expand sidebar"
                        title="Expand Sidebar"
                    >
                        <ExpandIcon />
                    </Button>
                )}
                <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                    <div className="sidebar-header">
                        <h4 className="mb-0">Admin Panel</h4>
                        <Button
                            variant="dark"
                            onClick={toggleSidebar}
                            className="sidebar-collapse-btn"
                            aria-label="Collapse sidebar"
                            title="Collapse Sidebar"
                        >
                            <CollapseIcon />
                        </Button>
                    </div>
                    <Nav className="flex-column" variant="pills">
                        <Nav.Item>
                            <Nav.Link as={Link} to="/admin/dashboard" className={getNavLinkClass('/admin/dashboard')}>
                                <DashboardIcon />
                                Dashboard
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link as={Link} to="/admin/tables" className={getNavLinkClass('/admin/tables')}>
                                <TableIcon />
                                Table Manager
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link as={Link} to="/admin/quiz-generator" className={getNavLinkClass('/admin/quiz-generator')}>
                                <QuizIcon />
                                Quiz Manager
                            </Nav.Link>
                        </Nav.Item>

                        <Nav.Item className="mt-4 border-top border-secondary pt-2">
                            <Nav.Link as={Link} to="/">
                                <BookingIcon />
                                Back to Booking
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>
                </div>

                <main className={`content-area ${isSidebarOpen ? 'open' : 'closed'}`}>
                    {loading && (
                        <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                            <Spinner animation="border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </Spinner>
                        </div>
                    )}
                    {error && (
                        <Alert variant="danger">
                            <Alert.Heading>Error</Alert.Heading>
                            <p>{error}</p>
                            <Button onClick={fetchData} variant="danger">Try Again</Button>
                        </Alert>
                    )}

                    {/* --- UPDATED: This div now hides the outlet instead of unmounting it --- */}
                    {/* This preserves the state of child components (like QuizGenerator) during a background refresh */}
                    <div style={{ display: (loading || error) ? 'none' : 'block' }}>
                        <Outlet context={{ bookings, tables, quizData, fetchData, loading, error }} />
                    </div>
                </main>
            </div>
        </>
    );
}

export default AdminLayout;
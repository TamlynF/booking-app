import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import axios from 'axios';
import { GOOGLE_SCRIPT_URL } from '../util/globalVariables';
import { Container, Row, Col, Nav, Spinner, Alert, Button } from 'react-bootstrap';

// --- SVGs for Sidebar Icons ---
const DashboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-grid-fill me-2" viewBox="0 0 16 16">
        <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3A1.5 1.5 0 0 1 15 10.5v3A1.5 1.5 0 0 1 13.5 15h-3A1.5 1.5 0 0 1 9 13.5v-3z"/>
    </svg>
);

const TableIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-layout-text-sidebar-reverse me-2" viewBox="0 0 16 16">
        <path d="M12.5 3a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1h5zm0 3a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1h5zm.5 3.5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h5a.5.5 0 0 0 .5-.5zm.5 2.5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h5a.5.5 0 0 0 .5-.5z"/>
        <path d="M16 2a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2zM4 1v14H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h2zm1 0h9a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5V1z"/>
    </svg>
);

const BookingIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-house-door-fill me-2" viewBox="0 0 16 16">
        <path d="M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354l-6-6a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5z"/>
    </svg>
);


// --- Custom CSS for the Layout ---
// const customCss = `
//     .admin-layout {
//         display: flex;
//         min-height: 100vh;
//         background-color: #f8f9fa; // Light grey background
//     }
//     .sidebar {
//         width: 260px;
//         background-color: #343a40; // Dark sidebar
//         color: white;
//         padding-top: 1.5rem;
//     }
//     .sidebar-header {
//         padding: 0 1.5rem 1rem 1.5rem;
//         font-size: 1.2rem;
//         font-weight: bold;
//         border-bottom: 1px solid #495057;
//     }
//     .sidebar .nav-link {
//         color: #adb5bd; // Muted link color
//         font-size: 1rem;
//         padding: 0.75rem 1.5rem;
//         border-radius: 0.25rem;
//         margin: 0.25rem 0.5rem;
//         display: flex;
//         align-items: center;
//         transition: all 0.2s ease-in-out;
//     }
//     .sidebar .nav-link:hover {
//         color: #ffffff;
//         background-color: #495057;
//     }
//     .sidebar .nav-link.active {
//         color: #ffffff;
//         font-weight: 500;
//         background-color: #0d6efd; // Bootstrap primary
//     }
//     .content-area {
//         flex-grow: 1;
//         padding: 2rem;
//         overflow-y: auto;
//     }
// `;

const getCssDate = (date) => {
    let d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [year, month, day].join('-');
}

function AdminLayout() {
    const [bookings, setBookings] = useState([]);
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const location = useLocation();

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(GOOGLE_SCRIPT_URL);
            
            if (response.data && response.data.bookings && response.data.tables) {
                const parsedBookings = response.data.bookings.map(b => {
                    const [day, month, year] = b.bookingDate.split('/');
                    const jsDate = new Date(`${year}-${month}-${day}T12:00:00`); // Assume noon
                    return {
                        ...b,
                        jsDate: jsDate,
                        cssDate: getCssDate(jsDate), // YYYY-MM-DD format
                        groupSize: parseInt(b.groupSize, 10), // Ensure groupSize is a number
                        isWinner: b.isWinner === 'TRUE' || b.isWinner === true // Handle string/boolean
                    };
                });
                
                const parsedTables = response.data.tables.map(t => ({
                    ...t,
                    maxGroupSize: parseInt(t.maxGroupSize, 10)
                }));

                setBookings(parsedBookings);
                setTables(parsedTables);
            } else {
                setError(response.data.message || 'Failed to fetch data. The response format was incorrect.');
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
                }
                .sidebar {
                    width: 250px;
                    background-color: #343a40;
                    color: white;
                    padding: 1.5rem 1rem;
                    position: fixed;
                    top: 0;
                    bottom: 0;
                    left: 0;
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
                    vertical-align: -0.125em; /* Aligns icons nicely with text */
                }
                .content-area {
                    margin-left: 250px;
                    padding: 2rem;
                    width: calc(100% - 250px);
                }
                `}
            </style>
            <div className="admin-wrapper">
                {/* --- Sidebar --- */}
                <div className="sidebar">
                    <h4 className="mb-4">Admin Panel</h4>
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
                                <TableIcon />
                                Quiz Manager
                            </Nav.Link>
                        </Nav.Item>
                        {/* Add more admin links here */}

                        <Nav.Item className="mt-4 border-top border-secondary pt-2">
                             <Nav.Link as={Link} to="/">
                                <BookingIcon />
                                Back to Booking
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>
                </div>

                {/* --- Main Content Area --- */}
                <main className="content-area">
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
                    {!loading && !error && (
                        <Outlet context={{ bookings, tables, fetchData, loading, error }} />
                    )}
                </main>
            </div>
        </>
    );
}

export default AdminLayout;
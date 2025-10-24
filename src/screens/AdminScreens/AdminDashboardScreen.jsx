import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
// --- MODIFIED ---
// Import Spinner for loading animations
import { Accordion, Card, ProgressBar, ListGroup, Form, Button, Spinner, Badge, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

import { GOOGLE_SCRIPT_URL } from '../../util/globalVariables';

const customCss = `
    .status-select.text-success, .status-select option[value="Confirmed"] {
        color: #198754 !important;
        font-weight: bold;
    }
    .status-select.text-warning, .status-select option[value="Pending"] {
        color: #ffc107 !important;
        font-weight: bold;
    }
    .status-select.text-danger, .status-select option[value="Cancelled"] {
        color: #dc3545 !important;
        font-weight: bold;
    }
    .kpi-card .card-body {
        padding: 1rem;
    }
    .kpi-card h5 {
        font-size: 1rem;
        color: #6c757d;
    }
    .kpi-card .kpi-value {
        font-size: 2rem;
        font-weight: bold;
    }
    .accordion-header-summary {
        font-size: 0.9rem;
        color: #6c757d;
        font-weight: 500;
        width: 100%;
        text-align: left;
    }
    .accordion-button:not(.collapsed) .accordion-header-summary .details-hidden {
        display: none;
    }
    .accordion-button.collapsed .accordion-header-summary .details-shown {
        display: none;
    }
    .status-badge {
        font-size: 0.9em;
        padding: 0.5em 0.75em;
    }
`;

// Helper function to get badge color based on status
const getStatusBadge = (status) => {
    switch (status) {
        case 'Confirmed': return 'success';
        case 'Pending': return 'warning text-dark';
        case 'Cancelled': return 'danger';
        default: return 'secondary';
    }
};

const getNextThursday = (startDate) => {
    const date = new Date(startDate);
    const dayOfWeek = date.getDay();
    const daysUntilThursday = (4 - dayOfWeek + 7) % 7;
    date.setDate(date.getDate() + daysUntilThursday);
    date.setHours(0, 0, 0, 0); // Normalize to start of day
    return date;
};

function AdminDashboardScreen() {
    const [bookings, setBookings] = useState([]);
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingRowId, setEditingRowId] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [loadingWinner, setLoadingWinner] = useState(null); 
    
    const navigate = useNavigate();

    const tableInfoMap = useMemo(() => {
        return tables.reduce((acc, table) => {
            acc[table.tableNo] = table;
            return acc;
        }, {});
    }, [tables]);

    const fetchData = () => {
        setLoading(true);
        axios.get(GOOGLE_SCRIPT_URL)
            .then(response => {
                if (response.data && Array.isArray(response.data.bookings) && Array.isArray(response.data.tables)) {
                    setBookings(response.data.bookings);
                    setTables(response.data.tables);
                    setError(null);
                } else {
                    setError("Failed to load data structure.");
                }
            })
            .catch(err => {
                console.error("Error fetching data:", err);
                setError("An error occurred while fetching data.");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleEditClick = (booking) => {
        setEditingRowId(booking.bookingId);
        setEditFormData({
            teamName: booking.teamName,
            groupSize: booking.groupSize,
            status: booking.status,
            allocTableNo: booking.allocTableNo || ''
        });
    };

    const handleCancelClick = () => {
        setEditingRowId(null);
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveClick = (bookingId) => {
        const payload = {
            action: 'updateBooking',
            bookingId: bookingId,
            updates: editFormData
        };

        axios.post(GOOGLE_SCRIPT_URL, JSON.stringify(payload), {
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        })
        .then(response => {
            if (response.data.result === 'success') {
                setBookings(prevBookings => 
                    prevBookings.map(b => 
                        b.bookingId === bookingId ? response.data.updatedBooking : b
                    )
                );
                setEditingRowId(null);
            } else {
                setError("Failed to update booking.");
            }
        })
        .catch(err => {
            console.error('Error updating booking:', err);
            setError("An error occurred while updating.");
        });
    };

    const handleSetWinner = (booking) => {
        setLoadingWinner(booking.bookingId);

        if (booking.isWinner) {
            const payload = {
                action: 'updateBooking',
                bookingId: booking.bookingId,
                updates: { isWinner: false } 
            };

            axios.post(GOOGLE_SCRIPT_URL, JSON.stringify(payload), {
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            })
            .then(response => {
                if (response.data.result === 'success') {
                    setBookings(prevBookings => 
                        prevBookings.map(b => 
                            b.bookingId === booking.bookingId ? { ...b, isWinner: false } : b
                        )
                    );
                } else {
                    setError("Could not unset winner. Please try again.");
                }
            })
            .catch(err => {
                console.error('Error unsetting winner:', err);
                setError("An error occurred while unsetting the winner.");
            })
            .finally(() => {
                setLoadingWinner(null); 
            });

        } else {
            const payload = {
                action: 'setWinner',
                bookingId: booking.bookingId,
                bookingDate: booking.bookingDate 
            };

            axios.post(GOOGLE_SCRIPT_URL, JSON.stringify(payload), {
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            })
            .then(response => {
                if (response.data.result === 'success') {
                    setBookings(prevBookings => 
                        prevBookings.map(b => {
                            if (b.bookingDate === booking.bookingDate) {
                                return {
                                    ...b,
                                    isWinner: b.bookingId === booking.bookingId 
                                };
                            }
                            return b; 
                        })
                    );
                } else {
                    setError("Could not mark winner. Please try again.");
                }
            })
            .catch(err => {
                console.error('Error setting winner:', err);
                setError("An error occurred while setting the winner.");
            })
            .finally(() => {
                setLoadingWinner(null);
            });
        }
    };

    const groupedBookings = useMemo(() => {
        const groups = bookings.reduce((acc, booking) => {
            const date = booking.bookingDate || "Unscheduled";
            if (!acc[date]) {
                acc[date] = {
                    bookings: [],
                    confirmedGuests: 0,
                    confirmedTeams: 0,
                    totalCapacity: tables.reduce((sum, t) => sum + t.maxGroupSize, 0)
                };
            }
            acc[date].bookings.push(booking);
            if (booking.status === 'Confirmed') {
                acc[date].confirmedGuests += Number(booking.groupSize) || 0;
                acc[date].confirmedTeams++;
            }
            return acc;
        }, {});

        return Object.entries(groups).sort(([dateA], [dateB]) => {
            // A simple way to sort "dd/mm/yyyy" or "Unscheduled"
            if (dateA === "Unscheduled") return 1;
            if (dateB === "Unscheduled") return -1;
            const [dayA, monthA, yearA] = dateA.split('/').map(Number);
            const [dayB, monthB, yearB] = dateB.split('/').map(Number);
            return new Date(yearB, monthB - 1, dayB) - new Date(yearA, monthA - 1, yearA);
        });
    }, [bookings, tables]);

    const renderTableOptions = (groupSize) => {
        const size = Number(groupSize);
        return tables
            .filter(t => t.maxGroupSize >= size)
            .sort((a, b) => a.maxGroupSize - b.maxGroupSize)
            .map(t => (
                <option key={t.tableNo} value={t.tableNo}>
                    Table {t.tableNo} (Max: {t.maxGroupSize})
                </option>
            ));
    };

    // ... (Your renderSpotlightWidget, renderAnalyticsWidget, renderWaitingListWidget functions)
    // ... (They are fine as-is)
    const renderSpotlightWidget = () => (
        <Card className="mb-3">
            <Card.Header>Spotlight</Card.Header>
            <Card.Body>{/* Add spotlight content */}</Card.Body>
        </Card>
    );

    const renderAnalyticsWidget = () => (
        <Card className="mb-3">
            <Card.Header>Analytics</Card.Header>
            <Card.Body>{/* Add chart or stats */}</Card.Body>
        </Card>
    );

    const renderWaitingListWidget = () => {
        const waitingList = bookings.filter(b => b.status === 'Pending');
        return (
            <Card>
                <Card.Header>Waiting List ({waitingList.length})</Card.Header>
                <ListGroup variant="flush" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {waitingList.length > 0 ? (
                        waitingList.map(b => (
                            <ListGroup.Item key={b.bookingId}>
                                <strong>{b.teamName}</strong> ({b.groupSize} guests)
                                <div className="text-muted small">{b.bookingDate}</div>
                            </ListGroup.Item>
                        ))
                    ) : (
                        <ListGroup.Item>No teams on the waiting list.</ListGroup.Item>
                    )}
                </ListGroup>
            </Card>
        );
    };

    if (loading) {
        return <div className="text-center my-5"><Spinner animation="border" /> <h5>Loading Dashboard...</h5></div>;
    }

    if (error) {
        return <Alert variant="danger" className="m-3">{error}</Alert>;
    }

    return (
        <>
            <style>{customCss}</style>
            <div className="container-fluid my-4">
                <div className="row">
                    <div className="col-lg-8">
                        <h3 className="mb-3">Bookings Dashboard</h3>
                        <Accordion defaultActiveKey="0" alwaysOpen>
                            {groupedBookings.map(([date, data], index) => {
                                const occupancy = (data.confirmedGuests / data.totalCapacity) * 100;
                                return (
                                    <Accordion.Item eventKey={index.toString()} key={date}>
                                        <Accordion.Header>
                                            <div className="accordion-header-summary">
                                                <strong>{date}</strong>
                                                <span className="ms-3 me-3 details-hidden">
                                                    | {data.confirmedTeams} Teams ({data.confirmedGuests} Guests)
                                                </span>
                                                <span className="ms-3 details-shown">
                                                    ({data.confirmedTeams} Teams / {data.confirmedGuests} Guests)
                                                </span>
                                                <ProgressBar variant={occupancy > 80 ? 'danger' : occupancy > 60 ? 'warning' : 'success'} now={occupancy} label={`${Math.round(occupancy)}%`} style={{ width: '200px', height: '20px', marginLeft: 'auto', marginRight: '20px' }} />
                                            </div>
                                        </Accordion.Header>
                                        <Accordion.Body>
                                            <div className="table-responsive">
                                                <table className="table table-striped table-hover align-middle">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>ID</th>
                                                            <th>Team</th>
                                                            <th>Size</th>
                                                            <th>Table</th>
                                                            <th>Status</th>
                                                            <th>Contact</th>
                                                            <th className="text-center">Winner 🏆</th>
                                                            <th className="text-center">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {data.bookings.map(booking => (
                                                            <tr key={booking.bookingId}>
                                                                {editingRowId === booking.bookingId ? (
                                                                    <>
                                                                        <td>{booking.bookingId}</td>
                                                                        <td><Form.Control size="sm" type="text" name="teamName" value={editFormData.teamName} onChange={handleEditFormChange} /></td>
                                                                        <td><Form.Control size="sm" as="select" name="groupSize" value={editFormData.groupSize} onChange={handleEditFormChange}>
                                                                            {[...Array(6)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                                                                        </Form.Control></td>
                                                                        <td><Form.Control size="sm" as="select" name="allocTableNo" value={editFormData.allocTableNo} onChange={handleEditFormChange}>
                                                                            <option value="">None</option>
                                                                            {renderTableOptions(editFormData.groupSize)}
                                                                        </Form.Control></td>
                                                                        <td><Form.Select size="sm" name="status" value={editFormData.status} onChange={handleEditFormChange} className={`status-select ${getStatusBadge(editFormData.status).split(' ')[0]}`}>
                                                                            <option value="Confirmed">Confirmed</option>
                                                                            <option value="Pending">Pending</option>
                                                                            <option value="Cancelled">Cancelled</option>
                                                                        </Form.Select></td>
                                                                        <td>{booking.contactName}</td>
                                                                        
                                                                        <td className="text-center">
                                                                            <Button variant="outline-secondary" size="sm" disabled>🏆</Button>
                                                                        </td>

                                                                        <td className="text-center">
                                                                            <Button variant="success" size="sm" onClick={() => handleSaveClick(booking.bookingId)} className="me-2">Save</Button>
                                                                            <Button variant="outline-secondary" size="sm" onClick={handleCancelClick}>Cancel</Button>
                                                                        </td>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <td>{booking.bookingId}</td>
                                                                        <td>{booking.teamName}</td>
                                                                        <td>{booking.groupSize}</td>
                                                                        <td>{booking.allocTableNo ? `T${booking.allocTableNo} (Max: ${tableInfoMap[booking.allocTableNo]?.maxGroupSize || '?'})` : 'N/A'}</td>
                                                                        <td><Badge bg={getStatusBadge(booking.status)} className="status-badge">{booking.status}</Badge></td>
                                                                        
                                                                        {/* --- MODIFIED --- */}
                                                                        <td 
                                                                            onClick={(e) => { e.stopPropagation(); navigate(`/contact/${encodeURIComponent(booking.contactEmail)}`); }}
                                                                            style={{cursor: 'pointer', color: '#0d6efd', textDecoration: 'underline'}}
                                                                            title={`View details for ${booking.contactName}`}
                                                                        >
                                                                            {booking.contactName}
                                                                        </td>
                                                                        
                                                                        {/* --- NEW --- */}
                                                                        <td className="text-center">
                                                                            <Button 
                                                                                variant={booking.isWinner ? "success" : "outline-secondary"}
                                                                                size="sm"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation(); 
                                                                                    handleSetWinner(booking); // Pass the whole booking
                                                                                }}
                                                                                disabled={loadingWinner === booking.bookingId || booking.status !== 'Confirmed'}
                                                                                title={booking.isWinner ? "Quiz Winner!" : "Mark as Winner"}
                                                                            >
                                                                                {loadingWinner === booking.bookingId ? (
                                                                                    <Spinner animation="border" size="sm" />
                                                                                ) : '🏆'}
                                                                            </Button>
                                                                        </td>
                                                                        
                                                                        <td className="text-center">
                                                                            <Button variant="outline-primary" size="sm" onClick={() => handleEditClick(booking)} title="Edit">
                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pencil" viewBox="0 0 16 16">
                                                                                    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V12h2.293l6.5-6.5z"/>
                                                                                    <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z" />
                                                                                </svg>
                                                                            </Button>
                                                                        </td>
                                                                    </>
                                                                )}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </Accordion.Body>
                                    </Accordion.Item>
                                );
                            })}
                        </Accordion>
                    </div>
                    <div className="col-lg-4">
                        <h3 className="mb-3">Overview</h3>
                        {renderSpotlightWidget()}
                        {renderAnalyticsWidget()}
                        {renderWaitingListWidget()}
                    </div>
                </div>
            </div>
        </>
    );
}

export default AdminDashboardScreen;

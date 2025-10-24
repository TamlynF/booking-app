import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Accordion, Card, ProgressBar, ListGroup, Form, Button, Spinner, Badge } from 'react-bootstrap';
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

function AdminDashboardScreenOLD() {
    const [bookings, setBookings] = useState([]);
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDateKey, setSelectedDateKey] = useState('all');
    const [editingRowId, setEditingRowId] = useState(null);
    const [editedRowData, setEditedRowData] = useState({});
    const [editError, setEditError] = useState(null);
    //const [editFormData, setEditFormData] = useState({});
    //const [loadingWinner, setLoadingWinner] = useState(null);

    const navigate = useNavigate();

    const tableInfoMap = useMemo(() => {
        return tables.reduce((acc, table) => {
            acc[table.tableNo] = table;
            return acc;
        }, {});
    }, [tables]);

    const fetchData = () => {
        axios.get(GOOGLE_SCRIPT_URL)
            .then(response => {
                if (response.data && Array.isArray(response.data.bookings) && Array.isArray(response.data.tables)) {
                    setBookings(response.data.bookings || []);
                    setTables(response.data.tables || []);
                    setError(null);
                } else {
                    setError("Failed to load data structure.");
                }
            })
            .catch(err => {
                console.error("Error fetching admin data:", err);
                setError("Failed to load data. Please check the script URL and permissions.");                
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const sortedBookings = useMemo(() => {
        return bookings.map(b => ({
            ...b,
            bookingDateObj: new Date(b.bookingDate),
            groupSize: parseInt(b.groupSize, 10) || 0
        })).sort((a, b) => a.bookingDateObj - b.bookingDateObj);
    }, [bookings]);

    const bookingsByDate = useMemo(() => {
        return sortedBookings.reduce((acc, booking) => {
            const dateKey = booking.bookingDateObj.toISOString().split('T')[0];
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(booking);
            return acc;
        }, {});
    }, [sortedBookings]);

    const nextQuizDateKey = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcomingDates = Object.keys(bookingsByDate).filter(dateStr => new Date(dateStr) >= today);
        upcomingDates.sort((a, b) => new Date(a) - new Date(b));
        return upcomingDates.length > 0 ? upcomingDates[0] : null;
    }, [bookingsByDate]);

    const waitingList = useMemo(() => sortedBookings.filter(b => b.status === 'Pending'), [sortedBookings]);

    const totalCapacity = useMemo(() => tables.reduce((sum, table) => sum + (parseInt(table.maxGroupSize, 10) || 0), 0), [tables]);

    const analyticsData = useMemo(() => {
        if (!bookings || bookings.length === 0) {
            return { totalGuestsAllTime: 0, regularTeamsCount: 0, uniqueTeamsCount: 0, regularsPercentage: 0 };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const confirmedBookings = bookings.filter(b => b.status === 'Confirmed');

        const totalGuestsAllTime = confirmedBookings
            .filter(b => new Date(b.bookingDate) < today)
            .reduce((sum, b) => sum + (parseInt(b.groupSize, 10) || 0), 0);

        const emailFrequency = confirmedBookings.reduce((acc, booking) => {
            const email = (booking.contactEmail || '').toLowerCase().trim();
            if (email) acc[email] = (acc[email] || 0) + 1;
            return acc;
        }, {});

        const uniqueTeamsCount = Object.keys(emailFrequency).length;
        const regularTeamsCount = Object.values(emailFrequency).filter(count => count > 1).length;
        const regularsPercentage = uniqueTeamsCount > 0 ? Math.round((regularTeamsCount / uniqueTeamsCount) * 100) : 0;

        return { totalGuestsAllTime, regularTeamsCount, uniqueTeamsCount, regularsPercentage };
    }, [bookings]);

    const filteredDateKeys = useMemo(() => {
        if (selectedDateKey === 'all') {
            return Object.keys(bookingsByDate).sort((a, b) => new Date(a) - new Date(b));
        }
        return bookingsByDate[selectedDateKey] ? [selectedDateKey] : [];
    }, [selectedDateKey, bookingsByDate]);

    const handleRowClick = (bookingId) => {
        navigate(`/manage?bookingId=${bookingId}`);
    };

    const handleEditClick = (booking) => {
        setEditingRowId(booking.bookingId);
        //setEditedRowData({ ...booking });
        //setEditError(null);
       // setEditFormData({
       //     teamName: booking.teamName,
        //    groupSize: booking.groupSize,
        //    status: booking.status,
        //    allocTableNo: booking.allocTableNo || ''
        //});
    };

    const handleCancelClick = () => {
        setEditingRowId(null);
        setEditedRowData({});
        setEditError(null);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        const processedValue = name === 'groupSize' ? parseInt(value, 10) : value;
        let newEditedData = { ...editedRowData, [name]: processedValue };
        let currentError = null;

        const originalBooking = bookings.find(b => b.bookingId === editingRowId);

        if (name === 'groupSize') {
            if (processedValue === 0) {
                newEditedData.status = 'Cancelled';
                newEditedData.allocTableNo = '';
            }
        } else if (name === 'allocTableNo') {
            if (!value || value.trim() === '0' || value === 0) {
                newEditedData.status = 'Cancelled';
                newEditedData.allocTableNo = '';
            } else if (!originalBooking.allocTableNo && value) {
                newEditedData.status = 'Confirmed';
            }
        } else if (name === 'status' && value === 'Cancelled') {
            newEditedData.allocTableNo = '';
        }

        const newGroupSize = parseInt(newEditedData.groupSize, 10);
        const newTableNo = newEditedData.allocTableNo;
        const newTableDetails = newTableNo ? tableInfoMap[newTableNo] : null;

        if (newTableDetails && newGroupSize > newTableDetails.maxGroupSize) {
            currentError = `Guests (${newGroupSize}) exceed table capacity of ${newTableDetails.maxGroupSize}.`;
        }

        if (newEditedData.status === 'Confirmed') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (new Date(originalBooking.bookingDate) < today) {
                currentError = "Cannot confirm a booking for a past date.";
            } else if (!newTableNo) {
                currentError = "Cannot confirm without a table number.";
            } else if (newTableDetails && newGroupSize > newTableDetails.maxGroupSize) {
                currentError = `Guests (${newGroupSize}) exceed capacity. Cannot confirm.`;
            }
        }

        setEditError(currentError);
        setEditedRowData(newEditedData);
    };

    const handleSaveClick = (bookingId) => {
        if (editError) {
            alert(`Please fix the error before saving:\n${editError}`);
            return;
        }

        const payload = {
            action: 'updateBooking',
            bookingId: bookingId,
            updates: {
                teamName: editedRowData.teamName,
                groupSize: parseInt(editedRowData.groupSize, 10),
                allocTableNo: editedRowData.allocTableNo,
                status: editedRowData.status
            }
        };

        axios.post(GOOGLE_SCRIPT_URL, JSON.stringify(payload))
            .then(response => {
                if (response.data.result === 'success') {
                    fetchData();
                    handleCancelClick();
                } else {
                    console.error("Failed to update booking:", response.data.message);
                    alert("Error: Could not update the booking.");
                }
            })
            .catch(error => {
                console.error('Error saving booking:', error);
                alert("An error occurred while saving. Please try again.");
            });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Confirmed': return 'badge bg-success';
            case 'Pending': return 'badge bg-warning text-dark';
            case 'Cancelled': return 'badge bg-danger';
            default: return 'badge bg-secondary';
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'Confirmed': return 'text-success';
            case 'Pending': return 'text-warning';
            case 'Cancelled': return 'text-danger';
            default: return '';
        }
    };

    if (loading) return <div className="text-center my-5"><h5>Loading dashboard...</h5></div>;
    if (error) return <div className="alert alert-danger mx-3">{error}</div>;

    const renderKpiBar = () => {
        const nextQuizBookings = nextQuizDateKey ? bookingsByDate[nextQuizDateKey] : [];
        const confirmedNextQuiz = nextQuizBookings.filter(b => b.status === 'Confirmed');
        const nextQuizGuests = confirmedNextQuiz.reduce((sum, b) => sum + b.groupSize, 0);
        const nextQuizOccupancy = totalCapacity > 0 ? Math.round((nextQuizGuests / totalCapacity) * 100) : 0;

        return (
            <div className="row mb-4">
                <div className="col-md-3">
                    <Card className="kpi-card text-center">
                        <Card.Body>
                            <h5>Next Quiz Guests</h5>
                            <p className="kpi-value">{nextQuizGuests}</p>
                        </Card.Body>
                    </Card>
                </div>
                <div className="col-md-3">
                    <Card className="kpi-card text-center">
                        <Card.Body>
                            <h5>Next Quiz Occupancy</h5>
                            <p className="kpi-value">{nextQuizOccupancy}%</p>
                        </Card.Body>
                    </Card>
                </div>
                <div className="col-md-3">
                    <Card className="kpi-card text-center">
                        <Card.Body>
                            <h5>Waiting List</h5>
                            <p className="kpi-value">{waitingList.length}</p>
                        </Card.Body>
                    </Card>
                </div>
                <div className="col-md-3">
                    <Card className="kpi-card text-center">
                        <Card.Body>
                            <h5>Regulars</h5>
                            <p className="kpi-value">{analyticsData.regularsPercentage}%</p>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        );
    };

    const renderSpotlightWidget = () => {
        // This widget can be simplified or removed if the KPI bar provides enough info
        // For now, it remains as a more detailed view for the selected date
        const spotlightDateKey = selectedDateKey === 'all' ? nextQuizDateKey : selectedDateKey;

        if (!spotlightDateKey || !bookingsByDate[spotlightDateKey]) {
            return (
                <Card className="mb-4 shadow-sm">
                    <Card.Header as="h5" className="bg-light">Quiz Spotlight</Card.Header>
                    <Card.Body><p>No quiz date selected or no bookings for this date.</p></Card.Body>
                </Card>
            );
        }

        const widgetTitle = selectedDateKey === 'all' ? 'Next Quiz Spotlight' : `Spotlight for ${new Date(spotlightDateKey).toLocaleDateString('en-GB')}`;
        const spotlightBookings = bookingsByDate[spotlightDateKey].filter(b => b.status === 'Confirmed');
        const totalGuests = spotlightBookings.reduce((sum, b) => sum + b.groupSize, 0);
        const tablesBooked = new Set(spotlightBookings.map(b => b.allocTableNo).filter(Boolean)).size;
        const occupancy = totalCapacity > 0 ? Math.round((totalGuests / totalCapacity) * 100) : 0;

        return (
            <Card className="mb-4 shadow-sm">
                <Card.Header as="h5" className="bg-light">{widgetTitle}</Card.Header>
                <Card.Body>
                    <h6 className="text-muted">{new Date(spotlightDateKey).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h6>
                    <div className="my-3">
                        <div className="d-flex justify-content-between"><span>Occupancy ({totalGuests} / {totalCapacity} Guests)</span><strong>{occupancy}%</strong></div>
                        <ProgressBar now={occupancy} variant="primary" animated className="mt-1" />
                    </div>
                    <ListGroup variant="flush">
                        <ListGroup.Item className="d-flex justify-content-between align-items-center">Tables Booked: <strong>{tablesBooked}</strong></ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between align-items-center">Tables Available: <strong>{tables.length - tablesBooked}</strong></ListGroup.Item>
                    </ListGroup>
                </Card.Body>
            </Card>
        );
    };

    const renderAnalyticsWidget = () => {
        const { totalGuestsAllTime, regularTeamsCount, uniqueTeamsCount, regularsPercentage } = analyticsData;
        const newTeamsPercentage = 100 - regularsPercentage;

        return (
            <Card className="mb-4 shadow-sm">
                <Card.Header as="h5" className="bg-light">All-Time Analytics</Card.Header>
                <Card.Body>
                    <ListGroup variant="flush">
                        <ListGroup.Item className="d-flex justify-content-between align-items-center">
                            Total Guests Attended:
                            <strong className="fs-5">{totalGuestsAllTime}</strong>
                        </ListGroup.Item>
                        <ListGroup.Item>
                            <div className="d-flex justify-content-between">
                                <span>Regular Teams ({regularTeamsCount} / {uniqueTeamsCount})</span>
                                <strong>{regularsPercentage}%</strong>
                            </div>
                            <ProgressBar className="mt-1" style={{ height: '20px', fontSize: '0.75rem' }}>
                                <ProgressBar variant="info" now={regularsPercentage} key={1} label={`Regulars`} />
                                <ProgressBar variant="secondary" now={newTeamsPercentage} key={2} label={`New`} />
                            </ProgressBar>
                        </ListGroup.Item>
                    </ListGroup>
                </Card.Body>
            </Card>
        );
    };

    const renderWaitingListWidget = () => (
        <Card className="mb-4 shadow-sm">
            <Card.Header as="h5" className="bg-light">Waiting List</Card.Header>
            {waitingList.length > 0 ? (
                <ListGroup variant="flush" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {waitingList.map(b => (
                        <ListGroup.Item key={b.bookingId} onClick={() => handleRowClick(b.bookingId)} style={{ cursor: 'pointer' }}>
                            <div className="fw-bold">{b.teamName} ({b.groupSize} guests)</div>
                            <div className="small text-muted">{b.contactEmail}</div>
                            <div className="small text-muted">Wants: {b.bookingDateObj.toLocaleDateString('en-GB')}</div>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            ) : (
                <Card.Body><p className="text-muted">The waiting list is empty.</p></Card.Body>
            )}
        </Card>
    );

    return (
        <>
            <style>{customCss}</style>
            <div className="container-fluid my-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="mb-0">Quiz Night Dashboard</h1>
                    <div style={{ width: '250px' }}>
                        <Form.Select value={selectedDateKey} onChange={e => setSelectedDateKey(e.target.value)}>
                            <option value="all">Show All Dates</option>
                            {Object.keys(bookingsByDate).map(dateKey => (
                                <option key={dateKey} value={dateKey}>
                                    {new Date(dateKey).toLocaleDateString('en-GB', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </option>
                            ))}
                        </Form.Select>
                    </div>
                </div>

                {renderKpiBar()}

                <div className="row">
                    <div className="col-lg-8">
                        <h3 className="mb-3">All Bookings By Date</h3>
                        <Accordion defaultActiveKey={nextQuizDateKey} activeKey={selectedDateKey !== 'all' ? selectedDateKey : undefined} flush>
                            {filteredDateKeys.map(dateKey => {
                                const dailyBookings = bookingsByDate[dateKey];
                                const confirmedBookings = dailyBookings.filter(b => b.status === 'Confirmed');
                                const confirmedGuests = confirmedBookings.reduce((sum, b) => sum + b.groupSize, 0);
                                const tablesBooked = new Set(confirmedBookings.map(b => b.allocTableNo).filter(Boolean)).size;

                                return (
                                    <Accordion.Item eventKey={dateKey} key={dateKey} className="mb-3 border rounded">
                                        <Accordion.Header>
                                            <span className="fw-bold fs-5">{new Date(dateKey).toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                                            <div className="accordion-header-summary">
                                                <span>{confirmedGuests} Guests, {tablesBooked} Tables</span>
                                            </div>
                                        </Accordion.Header>
                                        <Accordion.Body>
                                            <div className="table-responsive">
                                                <table className="table table-striped table-hover">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>ID</th>
                                                            <th>Team</th>
                                                            <th>Guests</th>
                                                            <th>Table</th>
                                                            <th>Status</th>
                                                            <th>Contact</th>
                                                            <th>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {dailyBookings.map(booking => (
                                                            <tr key={booking.bookingId}>
                                                                {editingRowId === booking.bookingId ? (
                                                                    <>
                                                                        <td>{booking.bookingId}</td>
                                                                        <td><Form.Control type="text" name="teamName" value={editedRowData.teamName} onChange={handleEditChange} /></td>
                                                                        <td>
                                                                            <Form.Select
                                                                                size="sm"
                                                                                name="groupSize"
                                                                                value={editedRowData.groupSize}
                                                                                onChange={handleEditChange}
                                                                            >
                                                                                {[...Array(6)].map((_, i) => (
                                                                                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                                                                                ))}
                                                                            </Form.Select>
                                                                        </td>
                                                                        <td><Form.Control type="text" name="allocTableNo" value={editedRowData.allocTableNo} onChange={handleEditChange} style={{ width: '70px' }} /></td>
                                                                        <td>
                                                                            <Form.Select
                                                                                size="sm"
                                                                                name="status"
                                                                                value={editedRowData.status}
                                                                                onChange={handleEditChange}
                                                                                className={`status-select ${getStatusClass(editedRowData.status)}`}
                                                                            >
                                                                                <option value="Confirmed">Confirmed</option>
                                                                                <option value="Pending">Pending</option>
                                                                                <option value="Cancelled">Cancelled</option>
                                                                            </Form.Select>
                                                                        </td>
                                                                        <td>{booking.contactName}</td>
                                                                        <td>
                                                                            <div className='d-flex flex-column'>
                                                                                <div>
                                                                                    <Button variant="success" size="sm" onClick={() => handleSaveClick(booking.bookingId)} className="me-2" disabled={!!editError}>Save</Button>
                                                                                    <Button variant="secondary" size="sm" onClick={handleCancelClick}>Cancel</Button>
                                                                                </div>
                                                                                {editError && <small className="text-danger mt-1">{editError}</small>}
                                                                            </div>
                                                                        </td>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <td>{booking.bookingId}</td>
                                                                        <td>{booking.teamName}</td>
                                                                        <td>{booking.groupSize}</td>
                                                                        <td>
                                                                            {booking.allocTableNo ? `${booking.allocTableNo} (Max: ${tableInfoMap[booking.allocTableNo]?.maxGroupSize || '?'})` : ''}
                                                                        </td>
                                                                        <td><span className={getStatusBadge(booking.status)}>{booking.status}</span></td>
                                                                        <td>
                                                                            <span
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation(); // Prevents row click
                                                                                    navigate(`/contact/${encodeURIComponent(booking.contactEmail)}`);
                                                                                }}
                                                                                style={{ cursor: 'pointer', color: '#0d6efd', textDecoration: 'underline' }}
                                                                                title={`View details for ${booking.contactName}`}
                                                                            >
                                                                                {booking.contactName}
                                                                            </span>
                                                                        </td>
                                                                        <td>
                                                                            <Button variant="primary" size="sm" onClick={() => handleEditClick(booking)} className="me-2" title="Edit">
                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pencil-square" viewBox="0 0 16 16">
                                                                                    <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
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

export default AdminDashboardScreenOLD;
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Accordion, Card, ProgressBar, ListGroup, Form, Button, Spinner, Badge, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';

import { GOOGLE_SCRIPT_URL } from '../../util/globalVariables';
import { formatDate, getNextThursday, parseDate } from '../../util/utility';
import DashboardSummaryList from '../../components/DashboardSummaryList';
import DateDetailScreen from './DateDetailScreen';

const customCss = `
    /* Styles for the status dropdown in edit mode */
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
        font-size: 2.2rem;
        font-weight: 700;
    }
    .kpi-card .kpi-subtext {
        font-size: 0.9rem;
        color: #6c757d;
    }
    .leaderboard-list .list-group-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0.75rem;
    }
    .table-availability-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.95rem;
        padding-top: 0.6rem;
        padding-bottom: 0.6rem;
    }
`;

function AdminDashboardScreen() {
    const { bookings, tables, fetchData, loading, error } = useOutletContext();
    const navigate = useNavigate();
    const location = useLocation();

    // State for DateDetailScreen
    const [selectedDate, setSelectedDate] = useState(null); // To show DateDetailScreen
    const [editingRowId, setEditingRowId] = useState(null);
    const [editFormData, setEditFormData] = useState({});

    // State for filtering in DateDetailScreen
    const [statusFilter, setStatusFilter] = useState('All');
    const [loadingWinner, setLoadingWinner] = useState(false);


    const groupedBookings = useMemo(() => {
        if (!bookings || bookings.length === 0 || !tables || tables.length === 0) {
            return [];
        }

        const totalTables = tables.length;
        const groups = new Map();

        bookings.forEach(booking => {
            const date = booking.bookingDate;
            if (!groups.has(date)) {
                groups.set(date, {
                    bookings: [],
                    confirmedGuests: 0,
                    confirmedTeams: 0,
                    totalTables: totalTables
                });
            }

            const group = groups.get(date);
            group.bookings.push(booking);

            if (booking.status === 'Confirmed') {
                group.confirmedGuests += Number(booking.groupSize);
                group.confirmedTeams += 1;
            }
        });

        const localToday = new Date();
        const today = new Date(Date.UTC(localToday.getUTCFullYear(), localToday.getUTCMonth(), localToday.getUTCDate()));
        // Sort groups: future dates ascending, past dates descending
        const futureDates = Array.from(groups.entries())
            .filter(([date]) => parseDate(date) >= today)
            .sort(([dateA], [dateB]) => parseDate(dateA) - parseDate(dateB));

        const pastDates = Array.from(groups.entries())
            .filter(([date]) => parseDate(date) < today)
            .sort(([dateA], [dateB]) => parseDate(dateB) - parseDate(dateA));

        return [...futureDates, ...pastDates];
    }, [bookings, tables]);

    const dashboardStats = useMemo(() => {
        console.log('bookings: ', bookings);
        console.log('tables: ', tables);
        if (!bookings || bookings.length === 0 || !tables || tables.length === 0) {
            return {
                totalCapacity: 0,
                nextEventDate: null,
                nextEventStats: {
                    confirmedGuests: 0,
                    capacityGuestPercentage: 0,
                    capacityTablePercentage: 0,
                    bookedTables: 0,
                    waitingListCount: 0,
                    avgGroupSize: 0,
                    waitingListTeams: [],
                    sortedTableAvailability: []
                },
                historicalStats: {
                    avgAttendance: 0,
                    avgGroupSize: 0,
                    topTeams: [],
                    mostFrequentTeams: []
                }
            };
        }

        // --- 1. At-a-Glance (Next Event) Stats ---
        const localToday = new Date();
        const today = new Date(Date.UTC(localToday.getUTCFullYear(), localToday.getUTCMonth(), localToday.getUTCDate()));
        //console.log('today2: '+ today);

        const totalGuestCapacity = tables.reduce((acc, table) => acc + (Number(table.maxGroupSize) || 0), 0);
        const totalTableCapacity = tables.length;

        const futureBookings = bookings
            .map(b => ({ ...b, parsedDate: parseDate(b.bookingDate) }))
            .filter(b => b.parsedDate >= today);

        //console.log('futureBookings: ', futureBookings);

        const nextEventDateObj = futureBookings.length > 0
            ? new Date(Math.min.apply(null, futureBookings.map(b => b.parsedDate)))
            : null;

        const nextEventDate = nextEventDateObj ? formatDate(nextEventDateObj) : null;

        let nextEventStats = {
            confirmedGuests: 0,
            capacityGuestPercentage: 0,
            capacityTablePercentage: 0,
            bookedTables: 0,
            waitingListCount: 0,
            avgGroupSize: 0,
            waitingListTeams: [],
            sortedTableAvailability: [] 
        };

        if (nextEventDate) {
            const nextEventBookings = bookings
                .map(b => ({ ...b, parsedDateString: formatDate(parseDate(b.bookingDate)) }))
                .filter(b => b.parsedDateString === nextEventDate);
            console.log('nextEventBookings: ', nextEventBookings);
            const confirmed = nextEventBookings.filter(b => b.status === 'Confirmed');
            const waiting = nextEventBookings.filter(b => b.status === 'Pending').sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            const confirmedGuests = confirmed.reduce((acc, b) => acc + (Number(b.groupSize) || 0), 0);
            const bookedTables = confirmed.filter(b => b.allocTableNo).length;

            const bookedTableNos = confirmed.map(b => b.allocTableNo).filter(Boolean);

            const tableAvailability = tables.reduce((acc, table) => {
                const size = table.maxGroupSize;
                if (!acc[size]) {
                    acc[size] = { total: 0, available: 0 };
                }
    
                acc[size].total += 1;
    
                const isBooked = bookedTableNos.includes(table.tableNo);
                if (!isBooked) {
                    acc[size].available += 1;
                }
                
                return acc;
            }, {});

            // Sort by table size (e.g., 4, 5, 6)
            const sortedTableAvailability = Object.entries(tableAvailability)
                .sort(([sizeA], [sizeB]) => Number(sizeA) - Number(sizeB));

            nextEventStats = {
                confirmedGuests: confirmedGuests,
                capacityGuestPercentage: totalGuestCapacity > 0 ? (confirmedGuests / totalGuestCapacity) * 100 : 0,
                capacityTablePercentage: totalTableCapacity > 0 ? (bookedTables / totalTableCapacity) * 100 : 0,
                bookedTables: bookedTables,
                waitingListCount: waiting.length,
                avgGroupSize: confirmed.length > 0 ? (confirmedGuests / confirmed.length) : 0,
                waitingListTeams: waiting.slice(0, 5), // Top 5
                sortedTableAvailability: sortedTableAvailability
            };
        }

        // --- 3. Historical Trends Stats ---
        const pastBookings = bookings
            .map(b => ({ ...b, parsedDate: parseDate(b.bookingDate) }))
            .filter(b => b.parsedDate < today && b.status === 'Confirmed');
        //console.log('pastBookings: ', pastBookings);

        const totalPastGuests = pastBookings.reduce((acc, b) => acc + (Number(b.groupSize) || 0), 0);
        const totalPastEvents = new Set(pastBookings.map(b => b.bookingDate)).size;
        //console.log('totalPastEvents: '+ totalPastEvents);
        const allConfirmedBookings = bookings.filter(b => b.status === 'Confirmed');
        const totalConfirmedGuests = allConfirmedBookings.reduce((acc, b) => acc + (Number(b.groupSize) || 0), 0);

        const teamWins = bookings
            .filter(b => b.isWinner === true || String(b.isWinner).toLowerCase() === 'true')
            .reduce((acc, b) => {
                acc[b.teamName] = (acc[b.teamName] || 0) + 1;
                return acc;
            }, {});
        //console.log('teamWins: ', teamWins);
        const topTeams = Object.entries(teamWins)
            .sort(([, winsA], [, winsB]) => winsB - winsA)
            .slice(0, 5); // Top 5

        const teamAttendance = allConfirmedBookings.reduce((acc, b) => {
            acc[b.teamName] = (acc[b.teamName] || 0) + 1;
            return acc;
        }, {});

        const mostFrequentTeams = Object.entries(teamAttendance)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 5); // Top 5

        const historicalStats = {
            avgAttendance: totalPastEvents > 0 ? totalPastGuests / totalPastEvents : 0,
            avgGroupSize: allConfirmedBookings.length > 0 ? totalConfirmedGuests / allConfirmedBookings.length : 0,
            topTeams: topTeams,
            mostFrequentTeams: mostFrequentTeams
        };

        return {
            totalGuestCapacity,
            totalTableCapacity,
            nextEventDate,
            nextEventStats,
            historicalStats
        };

    }, [bookings, tables]);

    const tableInfoMap = useMemo(() => {
        return tables.reduce((acc, table) => {
            acc[table.tableNo] = table;
            return acc;
        }, {});
    }, [tables]);

    const handleEditClick = (booking) => {
        setEditingRowId(booking.bookingId);
        setEditFormData({
            teamName: booking.teamName,
            contactName: booking.contactName,
            groupSize: booking.groupSize,
            allocTableNo: booking.allocTableNo || '', // Handle null/undefined
            status: booking.status
        });
    };

    const handleCancelClick = () => {
        setEditingRowId(null);
        setEditFormData({});
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;

        setEditFormData(prev => {
            const updatedData = { ...prev, [name]: value };

            if (name === 'allocTableNo') {
                const originalBooking = bookings.find(b => b.bookingId === editingRowId);

                if (originalBooking) {
                    const originalTable = originalBooking.allocTableNo || '';
                    const newTable = value;

                    if (originalTable === '' && newTable !== '') {
                        updatedData.status = 'Confirmed';
                    }
                    else if (originalTable !== '' && newTable === '') {
                        if (prev.status !== 'Cancelled') {
                            updatedData.status = 'Cancelled';
                        }
                    }
                }
            }

            return updatedData;
        });
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
                    setEditingRowId(null);
                    setEditFormData({});
                    fetchData();
                } else {
                    throw new Error(response.data.message || 'Failed to save changes.');
                }
            })
            .catch(err => {
                console.error('Error saving booking:', err);
            });
    };

    // const handleSetWinner = (booking) => {
    //     setLoadingWinner(booking.bookingId);

    //     if (booking.isWinner) {
    //         const payload = {
    //             action: 'updateBooking',
    //             bookingId: booking.bookingId,
    //             updates: { isWinner: false } 
    //         };

    //         axios.post(GOOGLE_SCRIPT_URL, JSON.stringify(payload), {
    //             headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    //         })
    //         .then(response => {
    //             if (response.data.result === 'success') {
    //                 setBookings(prevBookings => 
    //                     prevBookings.map(b => 
    //                         b.bookingId === booking.bookingId ? { ...b, isWinner: false } : b
    //                     )
    //                 );
    //             } else {
    //                 setError("Could not unset winner. Please try again.");
    //             }
    //         })
    //         .catch(err => {
    //             console.error('Error unsetting winner:', err);
    //             setError("An error occurred while unsetting the winner.");
    //         })
    //         .finally(() => {
    //             setLoadingWinner(null); 
    //         });

    //     } else {
    //         const payload = {
    //             action: 'setWinner',
    //             bookingId: booking.bookingId,
    //             bookingDate: booking.bookingDate 
    //         };

    //         axios.post(GOOGLE_SCRIPT_URL, JSON.stringify(payload), {
    //             headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    //         })
    //         .then(response => {
    //             if (response.data.result === 'success') {
    //                 /* setBookings(prevBookings => 
    //                     prevBookings.map(b => {
    //                         if (b.bookingDate === booking.bookingDate) {
    //                             return {
    //                                 ...b,
    //                                 isWinner: b.bookingId === booking.bookingId 
    //                             };
    //                         }
    //                         return b; 
    //                     })
    //                 ); */
    //                  fetchData(); 
    //             } else {
    //                 //setError("Could not mark winner. Please try again.");
    //                 throw new Error(response.data.message || 'Failed to set winner.');
    //             }
    //         })
    //         .catch(err => {
    //             console.error('Error setting winner:', err);
    //             //setError("An error occurred while setting the winner.");
    //         })
    //         .finally(() => {
    //             setLoadingWinner(null);
    //         });
    //     }
    // };

    const handleSetWinner = async (bookingId, bookingDate) => {
        setLoadingWinner(true);
        try {
            const response = await axios.post(GOOGLE_SCRIPT_URL, {
                action: 'setWinner',
                bookingId: bookingId,
                bookingDate: bookingDate // Pass date to clear others
            });

            if (response.data.result === 'success') {
                fetchData(); // Refresh all data
            } else {
                throw new Error(response.data.message || 'Failed to set winner.');
            }
        } catch (err) {
            console.error('Error setting winner:', err);
            // Handle error display
        } finally {
            setLoadingWinner(false);
        }
    };

    const selectedDateData = useMemo(() => {
        if (!selectedDate) return null;
        const found = groupedBookings.find(([d]) => d === selectedDate);
        return found ? found[1] : null;
    }, [selectedDate, groupedBookings]);


    const renderTableOptions = (groupSize, bookingsOnDate, currentBookingId) => {
        const size = Number(groupSize);

        const bookedTableNumbers = bookingsOnDate
            .filter(b =>
                b.bookingId !== currentBookingId &&
                (b.status === 'Confirmed' || b.status === 'Pending') &&
                b.allocTableNo
            )
            .map(b => b.allocTableNo);

        const currentBookingsTable = bookingsOnDate.find(b => b.bookingId === currentBookingId)?.allocTableNo;

        return tables
            .filter(t => {
                const isLargeEnough = t.maxGroupSize >= size;
                const isAvailable = !bookedTableNumbers.includes(t.tableNo) || t.tableNo === currentBookingsTable;

                return isLargeEnough && isAvailable;
            })
            .sort((a, b) => a.maxGroupSize - b.maxGroupSize)
            .map(t => (
                <option key={t.tableNo} value={t.tableNo}>
                    Table {t.tableNo} (Max: {t.maxGroupSize})
                </option>
            ));
    };

    const renderSpotlightWidget = () => {
        const { totalGuestCapacity, totalTableCapacity, nextEventDate, nextEventStats } = dashboardStats;
        console.log('dashboardStats: ', dashboardStats)

        if (!nextEventDate) {
            return (
                <Card className="kpi-card mb-4 shadow-sm">
                    <Card.Body>
                        <Card.Title as="h5">Next Quiz Night</Card.Title>
                        <Alert variant="info">No upcoming quiz nights found in the schedule.</Alert>
                    </Card.Body>
                </Card>
            );
        }

        return (
            <Card className="kpi-card mb-4 shadow-sm">
                <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
                    At-a-Glance
                    <Badge bg="primary">{formatDate(nextEventDate)}</Badge>
                </Card.Header>
                <Card.Body>
                    <div className="text-center mb-3">
                        <span className="kpi-value">{nextEventStats.bookedTables}</span>
                        <span className="kpi-value-secondary"> / {totalTableCapacity}</span>
                        <div className="kpi-subtext">Tables Booked</div>
                    </div>
                    {/* <ProgressBar
                        now={nextEventStats.capacityTablePercentage}
                        label={`${Math.round(nextEventStats.capacityTablePercentage)}% Full`}
                        variant={nextEventStats.capacityTablePercentage > 90 ? 'danger' : nextEventStats.capacityTablePercentage > 70 ? 'warning' : 'success'}
                        style={{ height: '25px', fontSize: '1rem' }}
                    /> */}
                    <hr />
                    <Row className="text-center">
                        <Col>
                            <div className="kpi-value-small">{nextEventStats.confirmedGuests} / {totalGuestCapacity}</div>
                            <div className="kpi-subtext">Confirmed Guests</div>
                        </Col>
                        <Col>
                            <div className="kpi-value-small">{nextEventStats.waitingListCount}</div>
                            <div className="kpi-subtext">Teams on Waiting List</div>
                        </Col>
                        <Col>
                            <div className="kpi-value-small">{nextEventStats.avgGroupSize.toFixed(1)}</div>
                            <div className="kpi-subtext">Avg. Group Size</div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        );
    };

    const renderTableAvailabilityWidget = () => {
        const { sortedTableAvailability } = dashboardStats.nextEventStats;
        const { nextEventDate } = dashboardStats;

        if (!nextEventDate) {
            // Don't show this widget if there is no upcoming event
            return null; 
        }

        return (
            <Card className="kpi-card mb-4 shadow-sm">
                <Card.Header as="h5">Table Availability by Seats</Card.Header>
                <ListGroup variant="flush">
                    {sortedTableAvailability.length > 0 ? sortedTableAvailability.map(([size, counts]) => {
                        const isFull = counts.available === 0;
                        const textClass = isFull ? '' :  'text-success';
                        
                        return (
                            <ListGroup.Item key={size} className="table-availability-item">
                                <span>
                                    <Badge 
                                        //bg={isFull ? 'danger-subtle' : 'secondary-subtle'} 
                                        bg='secondary-subtle'
                                        text= 'dark-emphasis'
                                        //text={isFull ? 'danger-emphasis' : 'dark-emphasis'} 
                                        className="me-2"
                                       style={{
                                            width: '90px', 
                                            fontSize: '0.9rem', 
                                            padding: '0.4em 0.6em'
                                        }}
                                    >
                                        Seats: {size}
                                    </Badge>                                    
                                </span>
                                <div className={`${textClass}`}>
                                    <span className="me-3" style={{ fontSize: '0.95rem', fontWeight: 600, minWidth: '90px', display: 'inline-block' }}>
                                        {isFull ? 'Unavailable' : 'Available'}
                                    </span>
                                    <strong style={{ fontSize: '0.95rem', minWidth: '50px', display: 'inline-block' }}>
                                        {counts.available} / {counts.total}
                                    </strong>
                                </div>
                            </ListGroup.Item>
                        );
                    }) : (
                        <ListGroup.Item className="kpi-subtext text-center">
                            No table data found.
                        </ListGroup.Item>
                    )}
                </ListGroup>
            </Card>
        );
    };

    const renderAnalyticsWidget = () => {
        const { historicalStats } = dashboardStats;

        return (
            <Card className="kpi-card mb-4 shadow-sm">
                <Card.Header as="h5">Historical Trends</Card.Header>
                <Card.Body>
                    <Row className="text-center mb-3">
                        <Col>
                            <div className="kpi-value-small">{historicalStats.avgAttendance.toFixed(1)}</div>
                            <div className="kpi-subtext">Avg. Guests / Event</div>
                        </Col>
                        <Col>
                            <div className="kpi-value-small">{historicalStats.avgGroupSize.toFixed(1)}</div>
                            <div className="kpi-subtext">Avg. Group Size</div>
                        </Col>
                    </Row>
                    <hr />
                    <Card.Title as="h6" className="mb-2">Leaderboards</Card.Title>
                    <Row>
                        <Col md={6}>
                            <strong className="kpi-subtext">Top Teams (by Wins)</strong>
                            <ListGroup variant="flush" className="leaderboard-list">
                                {historicalStats.topTeams.length > 0 ? historicalStats.topTeams.map(([teamName, wins]) => (
                                    <ListGroup.Item key={teamName}>
                                        <span className="text-truncate" title={teamName}>{teamName}</span>
                                        <Badge bg="success" pill>{wins}</Badge>
                                    </ListGroup.Item>
                                )) : <ListGroup.Item className="kpi-subtext">No winners recorded yet.</ListGroup.Item>}
                            </ListGroup>
                        </Col>
                        <Col md={6} className="mt-3 mt-md-0">
                            <strong className="kpi-subtext">Most Frequent Teams</strong>
                            <ListGroup variant="flush" className="leaderboard-list">
                                {historicalStats.mostFrequentTeams.length > 0 ? historicalStats.mostFrequentTeams.map(([teamName, count]) => (
                                    <ListGroup.Item key={teamName}>
                                        <span className="text-truncate" title={teamName}>{teamName}</span>
                                        <Badge bg="secondary" pill>{count}</Badge>
                                    </ListGroup.Item>
                                )) : <ListGroup.Item className="kpi-subtext">No historical data.</ListGroup.Item>}
                            </ListGroup>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        );
    };

    const renderWaitingListWidget = () => {
        const { waitingListTeams } = dashboardStats.nextEventStats;
        const { nextEventDate } = dashboardStats;

        return (
            <Card className="kpi-card mb-4 shadow-sm">
                <Card.Header as="h5">Action List: Waiting List</Card.Header>
                <Card.Body>
                    {nextEventDate && waitingListTeams.length > 0 ? (
                        <>
                            <p className="kpi-subtext">Top {waitingListTeams.length} teams on waiting list for {formatDate(nextEventDate)} (oldest first).</p>
                            <ListGroup variant="flush" className="leaderboard-list">
                                {waitingListTeams.map(team => (
                                    <ListGroup.Item key={team.bookingId}>
                                        <span className="text-truncate" title={team.teamName}>{team.teamName}</span>
                                        <Badge bg="warning" pill>Size: {team.groupSize}</Badge>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </>
                    ) : (
                        <p className="kpi-subtext text-center mb-0">The waiting list is clear for the next event.</p>
                    )}
                </Card.Body>
            </Card>
        );
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading Dashboard...</span>
                </Spinner>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="danger">
                <Alert.Heading>Error Loading Dashboard</Alert.Heading>
                <p>{error.toString()}</p>
                <Button onClick={fetchData} variant="danger">Try Again</Button>
            </Alert>
        );
    }

    return (
        <>
            <style>{customCss}</style>
            <div className="container-fluid">
                <div className="row">
                    {selectedDateData ? (
                        <DateDetailScreen
                            date={selectedDate}
                            //data={selectedDateData}
                            data={groupedBookings.find(([d]) => d === selectedDate)?.[1] || { bookings: [] }}
                            onBack={() => setSelectedDate(null)}

                            tableInfoMap={tableInfoMap}
                            editingRowId={editingRowId}
                            editFormData={editFormData}
                            loadingWinner={loadingWinner}
                            handleEditClick={handleEditClick}
                            handleCancelClick={handleCancelClick}
                            handleEditFormChange={handleEditFormChange}
                            handleSaveClick={handleSaveClick}
                            handleSetWinner={handleSetWinner}
                            renderTableOptions={renderTableOptions}
                            navigate={navigate}
                        />
                    ) : (
                        <>
                            <div className="col-lg-4 mb-4 mb-lg-0">
                                <h3 className="mb-3">Upcoming Quizzes</h3>
                                <DashboardSummaryList
                                    groupedBookings={groupedBookings}
                                    onDateSelect={setSelectedDate}
                                />
                                </div>
                                <div className="col-lg-4 mb-4 mb-lg-0">
                                <h3 className="mb-3">Next Quiz Overview</h3>
                                {renderSpotlightWidget()}
                                {renderTableAvailabilityWidget()}
                                {renderWaitingListWidget()}
                            </div>
                            <div className="col-lg-4">
                                <h3 className="mb-3">All-Time Overview</h3>
                                {renderAnalyticsWidget()}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

export default AdminDashboardScreen;

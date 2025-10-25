import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, ListGroup, Spinner, Alert, Button } from 'react-bootstrap';
import axios from 'axios';

import { GOOGLE_SCRIPT_URL } from '../../util/globalVariables';

function ContactDetailScreen() {
    const { contactEmail } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const fromDate = location.state?.fromDate;
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get(GOOGLE_SCRIPT_URL)
            .then(response => {
                if (response.data && Array.isArray(response.data.bookings)) {
                    setBookings(response.data.bookings);
                } else {
                    setError("Could not retrieve booking data.");
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching booking data:", err);
                setError("An error occurred while fetching data.");
                setLoading(false);
            });
    }, []);

    const contactData = useMemo(() => {
        if (bookings.length === 0) return null;
        console.log('contactEmail: ' + contactEmail);
        const decodedEmail = decodeURIComponent(contactEmail);
        console.log('decodedEmail: ' + decodedEmail);
        
        const contactBookings = bookings.filter(
            b => (b.contactEmail || '').toLowerCase() === decodedEmail.toLowerCase()
        ).sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate)); // Sort by date, newest first

        if (contactBookings.length === 0) return { notFound: true };

        const latestBooking = contactBookings[0];
        const contactName = latestBooking.contactName;
        const phone = `${latestBooking.contactCountryCode || ''} ${latestBooking.contactPhoneNo || ''}`.trim();

        const totalAttended = contactBookings.filter(b => b.status === 'Confirmed').length;
        const totalWins = contactBookings.filter(b => b.status === 'Confirmed' && b.isWinner === true).length;
        return {
            contactName,
            decodedEmail,
            phone,
            totalAttended,
            totalWins,
            history: contactBookings,
            notFound: false,
        };

    }, [bookings, contactEmail]);

    if (loading) {
        return <div className="text-center my-5"><Spinner animation="border" /> <h5 className="mt-2">Loading contact details...</h5></div>;
    }

    if (error) {
        return <Alert variant="danger" className="m-3">{error}</Alert>;
    }

    if (contactData && contactData.notFound) {
        return <Alert variant="warning" className="m-3">No contact found with email: {decodeURIComponent(contactEmail)}</Alert>;
    }

    if (!contactData) {
        return null;
    }

    const handleBackClick = () => {
        if (fromDate) {
            navigate('/admin', { state: { selectedDate: fromDate } });
        } else {
            navigate('/admin'); // or navigate(-1)
        }
    };

    return (
        <div className="container my-4">
            <Button variant="outline-secondary" size="sm" onClick={handleBackClick} className="mb-3">
                &larr; Back to Quiz
            </Button>

            <div className="row">
                <div className="col-md-4">
                    <Card className="mb-3">
                        <Card.Header as="h5">Contact Info</Card.Header>
                        <Card.Body>
                            <Card.Title>{contactData.contactName}</Card.Title>
                            <ListGroup variant="flush">
                                <ListGroup.Item><strong>Email:</strong> {contactData.decodedEmail}</ListGroup.Item>
                                <ListGroup.Item><strong>Phone:</strong> {contactData.phone || 'None'}</ListGroup.Item>
                            </ListGroup>
                        </Card.Body>
                    </Card>

                    <Card>
                        <Card.Header as="h5">Quiz Stats</Card.Header>
                        <Card.Body>
                            <ListGroup variant="flush">
                                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                    Times Attended:
                                    <span className="badge bg-primary rounded-pill fs-6">{contactData.totalAttended}</span>
                                </ListGroup.Item>
                                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                    Times Won:
                                    <span className="badge bg-success rounded-pill fs-6">{contactData.totalWins}</span>
                                </ListGroup.Item>
                                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                    Total Bookings:
                                    <span className="badge bg-secondary rounded-pill fs-6">{contactData.history.length}</span>
                                </ListGroup.Item>
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </div>

                <div className="col-md-8">
                    <Card>
                        <Card.Header as="h5">Booking History</Card.Header>
                        <Card.Body>
                            <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                <table className="table table-striped table-hover">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Date</th>
                                            <th>Team Name</th>
                                            <th>Guests</th>
                                            <th>Status</th>
                                            <th className="text-center">Winner 🏆</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {contactData.history.map(booking => (
                                            <tr key={booking.bookingId}>
                                                <td>{new Date(booking.bookingDate).toLocaleDateString('en-GB')}</td>
                                                <td>{booking.teamName}</td>
                                                <td>{booking.groupSize}</td>
                                                <td>
                                                    <span className={`badge ${booking.status === 'Confirmed' ? 'bg-success' : booking.status === 'Cancelled' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                                                        {booking.status}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <Button
                                                        variant={booking.isWinner ? "success" : "outline-secondary"}
                                                        size="sm"
                                                        disabled
                                                        title={booking.isWinner ? "Quiz Winner!" : "Mark as Winner"}
                                                    >🏆
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default ContactDetailScreen;
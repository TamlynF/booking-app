import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-datepicker/dist/react-datepicker.css';

import { Card, ProgressBar, Container, Row, Col, Form, Button } from 'react-bootstrap';

import './QuizTheme.css';
import BookingSummary from '../../components/BookingSummary';
import { GOOGLE_SCRIPT_URL } from '../../util/globalVariables';
import { COUNTRY_CODES } from '../../util/dummyData';
import { getNextThursday } from '../../util/utility';

const customCss = `
    .booking-summary-widget {
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 0.5rem;
        padding: 1rem;
        margin-bottom: 1.5rem;
    }
    .booking-summary-widget .progress {
        height: 1.25rem;
        font-size: 0.85rem;
        font-weight: 600;
    }
    .booking-summary-widget .summary-text {
        font-size: 0.9rem;
        color: #495057;
        margin-top: 0.5rem;
        text-align: center;
    }
    .booking-summary-widget .summary-text-available {
        font-size: 1rem;
        font-weight: 500;
        color: #198754;
        text-align: center;
    }

    /* Helper to make summary title match form title */
    .summary-card-title {
        font-family: 'Playfair Display', serif;
        color: #2c3e50;
        font-weight: 700;
        font-size: 2.2rem;
        margin-bottom: 1.5rem;
    }
        .team-list-scroll {
        max-height: 200px;
        overflow-y: auto;
        font-size: 0.9rem;
    }
    .team-list-scroll .list-group-item {
        padding: 0.35rem 0.5rem;
        background-color: transparent;
        border: none;
    }
`;


const formatQueryDate = (date) => {
    if (!date) return '';
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
};


function QuizBookingScreen() {
    const [bookings, setBookings] = useState([]);
    const [tables, setTables] = useState([]);
    const [bookingDate, setBookingDate] = useState(getNextThursday());
    const [formData, setFormData] = useState({
        teamName: '',
        contactName: '',
        contactEmail: '',
        contactCountryCode: '+44',
        contactPhoneNo: '',
        groupSize: '',
    });
    const [submissionStatus, setSubmissionStatus] = useState({
        loading: false,
        error: null,
        success: false
    });
    const [isTableAvailable, setIsTableAvailable] = useState(true);
    const [submitButtonText, setSubmitButtonText] = useState('Book Your Table');
    const [teamNameError, setTeamNameError] = useState(null);

    const fetchData = () => {
        axios.get(GOOGLE_SCRIPT_URL)
            .then(response => {
                if (response.data && Array.isArray(response.data.bookings)) {
                    setBookings(response.data.bookings);
                }
                if (response.data && Array.isArray(response.data.tables)) {
                    setTables(response.data.tables);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        // Show "Processing..." if loading
        if (submissionStatus.loading) {
            setSubmitButtonText('Processing...');
            return;
        }

        // If no group size is selected, reset to default
        if (!formData.groupSize || !bookingDate || tables.length === 0) {
            setSubmitButtonText('Book Your Table');
            setIsTableAvailable(true);
            return;
        }

        // --- Start Availability Check ---
        const requestedGroupSize = parseInt(formData.groupSize, 10);
        const formattedDate = bookingDate.toLocaleDateString();

        const bookedTableNumbers = new Set(
            bookings
                .filter(b => {
                    if (!b.bookingDate) return false;
                    let sheetDateStr = b.bookingDate.includes('T') ? new Date(b.bookingDate).toLocaleDateString() : b.bookingDate;
                    return sheetDateStr === formattedDate && b.status === 'Confirmed';
                })
                .map(b => b.allocTableNo)
        );

        const availableTables = tables.filter(table => !bookedTableNumbers.has(table.tableNo));

        // Check if *any* suitable table exists
        const isSuitableTableAvailable = availableTables.some(table => table.maxGroupSize >= requestedGroupSize);
        // --- End Availability Check ---

        if (isSuitableTableAvailable) {
            setSubmitButtonText('Book Your Table');
            setIsTableAvailable(true);
        } else {
            setSubmitButtonText('Join Waiting List');
            setIsTableAvailable(false);
        }

    }, [formData.groupSize, bookingDate, bookings, tables, submissionStatus.loading]);

    const dateSummary = useMemo(() => {
        if (!bookingDate || tables.length === 0) return null;

        const queryDate = formatQueryDate(bookingDate);
        const bookingsForDate = bookings.filter(b => {
            let sheetDateStr = b.bookingDate.includes('T') ? new Date(b.bookingDate).toLocaleDateString() : b.bookingDate;
            return sheetDateStr === queryDate;
        });
        const totalCapacity = tables.reduce((sum, t) => sum + t.maxGroupSize, 0);
        const totalTables = tables.length;

        let confirmedGuests = 0;
        let confirmedTeams = 0;
        let pendingTeams = 0;

        const confirmedBookingsList = [];

        bookingsForDate.forEach(b => {
            if (b.status === 'Confirmed') {
                confirmedGuests += Number(b.groupSize) || 0;
                confirmedTeams++;
                if (b.allocTableNo) {
                    confirmedBookingsList.push({
                        // Use bookingId for a stable key
                        bookingId: b.bookingId,
                        teamName: b.teamName,
                        allocTableNo: b.allocTableNo
                    });
                }
            } else if (b.status === 'Pending') {
                pendingTeams++;
            }
        });

        confirmedBookingsList.sort((a, b) => a.allocTableNo - b.allocTableNo);

        const occupancy = totalCapacity > 0 ? (confirmedTeams / totalTables) * 100 : 0;

        return {
            confirmedGuests,
            totalCapacity,
            totalTables,
            confirmedTeams,
            pendingTeams,
            occupancy,
            confirmedBookings: confirmedBookingsList
        };
    }, [bookingDate, bookings, tables]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'teamName' && teamNameError) {
            setTeamNameError(null);
        }

        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleTeamNameBlur = () => {
        const { teamName } = formData;
        if (!teamName || !bookingDate || bookings.length === 0) {
            setTeamNameError(null); // No name or date, so no error
            return;
        }

        const queryDate = formatQueryDate(bookingDate);
        const lowerCaseTeamName = teamName.toLowerCase().trim();

        // Check for duplicates (Confirmed or Pending) on the same date
        const isDuplicate = bookings.some(b => {
            let sheetDateStr = b.bookingDate.includes('T') ? new Date(b.bookingDate).toLocaleDateString() : b.bookingDate;

            return sheetDateStr === queryDate &&
                b.teamName.toLowerCase().trim() === lowerCaseTeamName &&
                (b.status === 'Confirmed' || b.status === 'Pending');
        });

        if (isDuplicate) {
            setTeamNameError('This team name is already booked for this date. Please choose another.');
        } else {
            setTeamNameError(null);
        }
    };

    const postBooking = (data) => {
        setSubmissionStatus({ loading: true, error: null, success: false });

        axios.post(GOOGLE_SCRIPT_URL, JSON.stringify(data), {
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        })
            .then(response => {
                if (response.data.result === 'success') {
                    const successMessage = data.status === 'Confirmed'
                        ? `Your table (No. ${data.allocTableNo}) has been booked.`
                        : "You've been added to the waiting list.";
                    setSubmissionStatus({ loading: false, error: null, success: true, message: successMessage });
                    setFormData({ teamName: '', contactName: '', contactEmail: '', contactCountryCode: '+44', contactPhoneNo: '', groupSize: '' });
                    setBookingDate(getNextThursday());
                    fetchData();
                } else {
                    setSubmissionStatus({ loading: false, error: "Something went wrong during submission.", success: false });
                }
            })
            .catch(error => {
                console.error('Error submitting booking:', error);
                setSubmissionStatus({ loading: false, error: "An error occurred. Please try again.", success: false });
            });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.teamName || !formData.contactName || !formData.contactEmail || !formData.groupSize || teamNameError) {
            if (teamNameError) {
                setSubmissionStatus({ loading: false, error: "Please fix the errors in the form.", success: false });
            } else {
                setSubmissionStatus({ loading: false, error: "Please fill in all required fields.", success: false });
            }
            return;
        }

        const formattedDate = bookingDate.toLocaleDateString();
        const maxId = bookings.reduce((max, booking) => Math.max(max, parseInt(booking.bookingId, 10) || 0), 0);
        const newBookingId = maxId + 1;

        let dataToSend;

        if (isTableAvailable) {
            const requestedGroupSize = parseInt(formData.groupSize, 10);

            const bookedTableNumbers = new Set(
                bookings
                    .filter(b => {
                        if (!b.bookingDate) return false;
                        let sheetDateStr = b.bookingDate.includes('T') ? new Date(b.bookingDate).toLocaleDateString() : b.bookingDate;
                        return sheetDateStr === formattedDate && b.status === 'Confirmed';
                    })
                    .map(b => b.allocTableNo)
            );
            const availableTables = tables.filter(table => !bookedTableNumbers.has(table.tableNo));
            const suitableTable = availableTables
                .filter(table => table.maxGroupSize >= requestedGroupSize)
                .sort((a, b) => a.maxGroupSize - b.maxGroupSize)[0];

            if (suitableTable) {
                dataToSend = {
                    ...formData,
                    bookingId: newBookingId,
                    bookingDate: formattedDate,
                    status: 'Confirmed',
                    timestamp: new Date().toISOString(),
                    allocTableNo: suitableTable.tableNo,
                    isWinner: 'false'
                };
            } else {
                console.warn("Could not find suitable table even though isTableAvailable was true. Submitting to waiting list.");
                dataToSend = {
                    ...formData,
                    bookingId: newBookingId,
                    bookingDate: formattedDate,
                    status: 'Pending',
                    timestamp: new Date().toISOString(),
                    allocTableNo: '',
                    isWinner: 'false',
                };
            }
        } else {
            dataToSend = {
                ...formData,
                bookingId: newBookingId,
                bookingDate: formattedDate,
                status: 'Pending',
                timestamp: new Date().toISOString(),
                allocTableNo: '',
                isWinner: 'false',
            };
        }

        postBooking(dataToSend);
    };

    const isThursday = (date) => {
        return date.getDay() === 4;
    };

    if (submissionStatus.success) {
        return (
            <div className="quiz-page-container">
                <div className="quiz-form-card text-center p-5" style={{ maxWidth: '550px' }}>
                    <h2 className="card-title text-success mb-4">Thank You!</h2>
                    <p className="lead">{submissionStatus.message}</p>
                    <button className="btn btn-quiz-theme mt-3" onClick={() => setSubmissionStatus({ loading: false, error: null, success: false, message: '' })}>
                        Make Another Booking
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="quiz-page-container">
            <style>{customCss}</style>

            {/* Use Bootstrap's Container to manage the layout */}
            <Container>
                <Row className="justify-content-center">

                    {/* --- Column 1: Booking Form --- */}
                    <Col lg={6} md={12} className="mb-4 mb-lg-0">
                        <Card className="quiz-form-card">
                            <Card.Body className="p-4 p-md-5">
                                <h2 className="card-title text-center mb-4">Quiz Night Booking</h2>
                                <Form noValidate onSubmit={handleSubmit}>
                                    {/*  <h4 className="mb-3 mt-4">Quiz Details</h4> */}
                                    <Form.Group className="mb-3" controlId="bookingDate">
                                        <Form.Label>Date</Form.Label>
                                        <DatePicker
                                            selected={bookingDate}
                                            onChange={(date) => {
                                                setBookingDate(date);
                                                setTeamNameError(null);
                                            }}
                                            className="form-control"
                                            dateFormat="dd MMMM yyyy"
                                            filterDate={isThursday}
                                            minDate={new Date()}
                                        />
                                    </Form.Group>


                                    <Form.Group className="mb-3" controlId="teamName">
                                        <Form.Label>Team Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="teamName"
                                            value={formData.teamName}
                                            onChange={handleChange}
                                            onBlur={handleTeamNameBlur} // Validate on blur
                                            required
                                            isInvalid={!!teamNameError} // Show red border if error
                                        />
                                        {/* This message only appears if isInvalid is true */}
                                        <Form.Control.Feedback type="invalid">
                                            {teamNameError}
                                        </Form.Control.Feedback>
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="groupSize">
                                        <Form.Label>Group Size</Form.Label>
                                        <Form.Select
                                            name="groupSize"
                                            value={formData.groupSize}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="" disabled>Select...</option>
                                            {[...Array(6)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                                        </Form.Select>
                                    </Form.Group>


                                    <h4 className="mb-3 mt-4">Contact Details</h4>

                                    <Form.Group className="mb-3" controlId="contactName">
                                        <Form.Label>Your Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="contactName"
                                            value={formData.contactName}
                                            onChange={handleChange}
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3" controlId="contactEmail">
                                        <Form.Label>Email Address</Form.Label>
                                        <Form.Control
                                            type="email"
                                            name="contactEmail"
                                            value={formData.contactEmail}
                                            onChange={handleChange}
                                            required
                                        />
                                    </Form.Group>

                                    <Row>
                                        <Form.Group as={Col} md="4" className="mb-3" controlId="contactCountryCode">
                                            <Form.Label>Country Code</Form.Label>
                                            <Form.Select
                                                name="contactCountryCode"
                                                value={formData.contactCountryCode}
                                                onChange={handleChange}
                                            >
                                                {COUNTRY_CODES.map(c => (
                                                    <option key={c.code} value={c.code}>{c.name}</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                        <Form.Group as={Col} md="8" className="mb-3" controlId="contactPhoneNo">
                                            <Form.Label>Phone Number</Form.Label>
                                            <Form.Control
                                                type="tel"
                                                name="contactPhoneNo"
                                                value={formData.contactPhoneNo}
                                                onChange={handleChange}
                                                placeholder="e.g. 7123456789"
                                            />
                                        </Form.Group>
                                    </Row>

                                    <div className="d-grid mt-3">
                                        <Button
                                            type="submit"
                                            className={`btn-quiz-theme btn-lg ${!isTableAvailable ? 'btn-warning' : ''}`}
                                            disabled={
                                                submissionStatus.loading ||
                                                !formData.contactName ||
                                                !formData.contactEmail ||
                                                !formData.groupSize ||
                                                !formData.teamName ||
                                                !!teamNameError // --- Disable submit if error exists ---
                                            }
                                        >
                                            {submitButtonText}
                                        </Button>
                                    </div>
                                    {submissionStatus.error && <div className="alert alert-danger mt-3">{submissionStatus.error}</div>}
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* --- Column 2: Summary Widget --- */}
                    <Col lg={4} md={12}>
                        <Card className="quiz-form-card">
                            <Card.Body className="p-4 p-md-5">
                                <h3 className="summary-card-title">Live Availability</h3>
                                <BookingSummary summary={dateSummary} />
                            </Card.Body>
                        </Card>
                    </Col>

                </Row>
            </Container>
        </div>
    );
}

export default QuizBookingScreen
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-datepicker/dist/react-datepicker.css';

import './QuizTheme.css';
import { GOOGLE_SCRIPT_URL } from '../../util/globalVariables';
import { COUNTRY_CODES } from '../../util/dummyData';

const getNextThursday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilThursday = (4 - dayOfWeek + 7) % 7;    
    const nextThursday = new Date(today);
    nextThursday.setDate(today.getDate() + daysUntilThursday);
    return nextThursday;
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const postBooking = (data) => {
        setSubmissionStatus({ loading: true, error: null, success: false });

        axios.post(GOOGLE_SCRIPT_URL, JSON.stringify(data), {
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        })
        .then(response => {
            if(response.data.result === 'success') {
                const successMessage = data.status === 'Confirmed' 
                    ? `Your table (No. ${data.allocTableNo}) has been booked.`
                    : "You've been added to the waiting list.";
                setSubmissionStatus({ loading: false, error: null, success: true, message: successMessage });
                setFormData({ teamName: '', contactName: '', contactEmail: '', contactCountryCode: '+44', contactPhoneNo: '', groupSize: ''});
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

        if (!formData.teamName || !formData.contactName || !formData.contactEmail || !formData.groupSize) {
            setSubmissionStatus({ loading: false, error: "Please fill in all required fields.", success: false });
            return;
        }

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

        const suitableTable = availableTables
            .filter(table => table.maxGroupSize >= requestedGroupSize)
            .sort((a, b) => a.maxGroupSize - b.maxGroupSize)[0];

        const maxId = bookings.reduce((max, booking) => Math.max(max, parseInt(booking.bookingId, 10) || 0), 0);
        const newBookingId = maxId + 1;
        
        let dataToSend;

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
            postBooking(dataToSend);

        } else {
            const joinWaitingList = window.confirm("Sorry, no tables are available that can fit your group size for this date. Would you like to join our waiting list?");
            
            if (joinWaitingList) {
                dataToSend = {
                    ...formData,
                    bookingId: newBookingId,
                    bookingDate: formattedDate,
                    status: 'Pending',
                    timestamp: new Date().toISOString(),
                    allocTableNo: '',
                    isWinner: 'false',
                };
                postBooking(dataToSend);
            } else {
                setSubmissionStatus({ loading: false, error: null, success: false });
            }
        }
    };

    const isThursday = (date) => {
        return date.getDay() === 4;
    };

    if (submissionStatus.success) {
        return (
            <div className="quiz-page-container">
                <div className="quiz-form-card text-center p-5">
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
            <div className="quiz-form-card">
                <div className="card-body p-4 p-md-5">
                    <h2 className="card-title text-center mb-4">Quiz Night Booking</h2>
                    <form onSubmit={handleSubmit}>
                        
                        <div className="mb-3">
                            <label htmlFor="contactName" className="form-label">Your Name</label>
                            <input type="text" className="form-control" id="contactName" name="contactName" value={formData.contactName} onChange={handleChange} required />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="contactEmail" className="form-label">Email Address</label>
                            <input type="email" className="form-control" id="contactEmail" name="contactEmail" value={formData.contactEmail} onChange={handleChange} required />
                        </div>
                        <div className="row">
                            <div className="col-md-5 mb-3">
                                <label htmlFor="contactCountryCode" className="form-label">Country Code</label>
                                <select
                                    className="form-select"
                                    id="contactCountryCode"
                                    name="contactCountryCode"
                                    value={formData.contactCountryCode}
                                    onChange={handleChange}
                                >
                                    {COUNTRY_CODES.map(c => (
                                        <option key={c.code} value={c.code}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-7 mb-3">
                                <label htmlFor="contactPhoneNo" className="form-label">Phone Number (Optional)</label>
                                <input
                                    type="tel"
                                    className="form-control"
                                    id="contactPhoneNo"
                                    name="contactPhoneNo"
                                    value={formData.contactPhoneNo}
                                    onChange={handleChange}
                                    placeholder="e.g. 7123456789"
                                />
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label htmlFor="bookingDate" className="form-label">Quiz Date</label>
                                <DatePicker selected={bookingDate} onChange={(date) => setBookingDate(date)} className="form-control" dateFormat="MMMM d, yyyy" id="bookingDate" filterDate={isThursday} minDate={new Date()} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label htmlFor="groupSize" className="form-label">Group Size</label>
                                <select className="form-select" id="groupSize" name="groupSize" value={formData.groupSize} onChange={handleChange} required>
                                    <option value="" disabled>Select...</option>
                                    {[...Array(6)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                                </select>
                            </div>                            
                        </div>

                        <div className="mb-3">
                            <label htmlFor="teamName" className="form-label">Team Name</label>
                            <input type="text" className="form-control" id="teamName" name="teamName" value={formData.teamName} onChange={handleChange} required />
                        </div>

                        <div className="d-grid mt-3">
                            <button type="submit" className="btn btn-quiz-theme btn-lg" disabled={submissionStatus.loading || !formData.contactName || !formData.contactEmail || !formData.groupSize || !formData.teamName}>
                                {submissionStatus.loading ? 'Processing...' : 'Book Your Table'}
                            </button>
                        </div>
                        {submissionStatus.error && <div className="alert alert-danger mt-3">{submissionStatus.error}</div>}
                    </form>
                </div>
            </div>
        </div>
    );
}

export default QuizBookingScreen
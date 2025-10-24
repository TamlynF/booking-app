import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ListGroup } from 'react-bootstrap';

import './QuizTheme.css';
import { GOOGLE_SCRIPT_URL } from '../../util/globalVariables';

function ManageBookingScreen() {
    const [booking, setBooking] = useState(null);
    const [pageStatus, setPageStatus] = useState({ loading: true, error: null });
    const [cancellationStatus, setCancellationStatus] = useState({ loading: false, error: null, success: false });
    const [showConfirmCancel, setShowConfirmCancel] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedBooking, setEditedBooking] = useState(null);
    const [updateStatus, setUpdateStatus] = useState({ loading: false, error: null, success: false });

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const bookingId = queryParams.get('bookingId');
        if (!bookingId) {
            setPageStatus({ loading: false, error: "No booking ID provided." });
            return;
        }

        axios.get(GOOGLE_SCRIPT_URL)
            .then(response => {
                if (response.data && Array.isArray(response.data.bookings)) {
                    const foundBooking = response.data.bookings.find(b => String(b.bookingId) === String(bookingId));
                    if (foundBooking) {
                        setBooking(foundBooking);
                        setEditedBooking({
                            ...foundBooking,
                            bookingDate: new Date(foundBooking.bookingDate)
                        });
                        setPageStatus({ loading: false, error: null });
                    } else {
                        setPageStatus({ loading: false, error: "Booking not found. Please check your link." });
                    }
                } else {
                    setPageStatus({ loading: false, error: "Could not retrieve booking data." });
                }
            })
            .catch(err => {
                console.error("Error fetching booking data:", err);
                setPageStatus({ loading: false, error: "An error occurred while fetching your booking." });
            });
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedBooking(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (date) => {
        setEditedBooking(prev => ({ ...prev, bookingDate: date }));
    };

    // --- NEW: Handle submitting the updated booking ---
    const handleUpdateBooking = () => {
        setUpdateStatus({ loading: true, error: null, success: false });

        const payload = {
            action: 'updateBooking', // A new action for your Google Script
            bookingId: booking.bookingId,
            updates: {
                teamName: editedBooking.teamName,
                groupSize: editedBooking.groupSize,
                bookingDate: editedBooking.bookingDate.toLocaleDateString(),
                status: editedBooking.status,
            }
        };

        axios.post(GOOGLE_SCRIPT_URL, JSON.stringify(payload), {
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        })
        .then(response => {
            if (response.data.result === 'success') {
                setUpdateStatus({ loading: false, error: null, success: true });
                setBooking(response.data.updatedBooking); // Update the main booking with the returned data
                setIsEditing(false); // Exit edit mode
            } else {
                setUpdateStatus({ loading: false, error: response.data.message || "Something went wrong during the update.", success: false });
            }
        })
        .catch(error => {
            console.error('Error updating booking:', error);
            setUpdateStatus({ loading: false, error: "An error occurred. Please try again.", success: false });
        });
    };
    
    const handleCancelBooking = () => {
        // ... (cancellation logic remains the same)
        setCancellationStatus({ loading: true, error: null, success: false });

        const payload = {
            action: 'updateBooking',
            bookingId: booking.bookingId,
            updates: {
                teamName: booking.teamName,
                groupSize: booking.groupSize,
                allocTableNo: '',
                status: 'Cancelled'
            }            
        };

        axios.post(GOOGLE_SCRIPT_URL, JSON.stringify(payload), {
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        })
        .then(response => {
            if (response.data.result === 'success') {
                setCancellationStatus({ loading: false, error: null, success: true });
                setBooking(prev => ({ ...prev, status: 'Cancelled' }));
            } else {
                setCancellationStatus({ loading: false, error: "Something went wrong during cancellation.", success: false });
            }
        })
        .catch(error => {
            console.error('Error cancelling booking:', error);
            setCancellationStatus({ loading: false, error: "An error occurred. Please try again.", success: false });
        });
    };
    
    const isThursday = (date) => {
        return date.getDay() === 4;
    };

    const renderBookingDetails = () => {
        if (!booking) return null;
        const isCancelled = booking.status === 'Cancelled' || cancellationStatus.success;

        if (isCancelled) {
            return (
                <div className="alert alert-success text-center">
                    <h4>Booking Cancelled</h4>
                    <p>Your booking for team "{booking.teamName}" has been successfully cancelled.</p>
                </div>
            );
        }

        // --- NEW: Render an edit form or the view details based on `isEditing` state ---
        if (isEditing) {
            return (
                <>
                    <div className="mb-3">
                        <label htmlFor="teamName" className="form-label">Team Name</label>
                        <input type="text" className="form-control" id="teamName" name="teamName" value={editedBooking.teamName} onChange={handleInputChange} />
                    </div>
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label htmlFor="groupSize" className="form-label">Group Size</label>
                            <select className="form-select" id="groupSize" name="groupSize" value={editedBooking.groupSize} onChange={handleInputChange}>
                                {[...Array(6)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                            </select>
                        </div>
                        <div className="col-md-6 mb-3">
                            <label htmlFor="bookingDate" className="form-label">Quiz Date</label>
                            <DatePicker selected={editedBooking.bookingDate} onChange={handleDateChange} className="form-control" dateFormat="MMMM d, yyyy" id="bookingDate" filterDate={isThursday} />
                        </div>
                    </div>
                    <div className="d-flex justify-content-end mt-3">
                        <button className="btn btn-outline-secondary me-2" onClick={() => setIsEditing(false)} disabled={updateStatus.loading}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleUpdateBooking} disabled={updateStatus.loading}>
                            {updateStatus.loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                    {updateStatus.error && <div className="alert alert-danger mt-3">{updateStatus.error}</div>}
                </>
            );
        }

        return (
            <>
                <ListGroup variant="flush">
                    <ListGroup.Item><strong>Team Name:</strong> {booking.teamName}</ListGroup.Item>
                    <ListGroup.Item><strong>Contact:</strong> {booking.contactName}</ListGroup.Item>
                    <ListGroup.Item><strong>Date:</strong> {new Date(booking.bookingDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</ListGroup.Item>
                    <ListGroup.Item><strong>Guests:</strong> {booking.groupSize}</ListGroup.Item>
                    <ListGroup.Item><strong>Status:</strong> <span className={`badge ${booking.status === 'Confirmed' ? 'bg-success' : 'bg-warning text-dark'}`}>{booking.status}</span></ListGroup.Item>
                </ListGroup>
                
                <div className="mt-4">
                    {!showConfirmCancel ? (
                        <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>Edit Booking</button>
                            <button className="btn btn-danger" onClick={() => setShowConfirmCancel(true)}>Cancel Booking</button>
                        </div>
                    ) : (
                        <div className="text-center p-3 bg-light rounded">
                            <p className="fw-bold">Are you sure you want to cancel?</p>
                            <button className="btn btn-outline-secondary me-2" onClick={() => setShowConfirmCancel(false)} disabled={cancellationStatus.loading}>Go Back</button>
                            <button className="btn btn-danger" onClick={handleCancelBooking} disabled={cancellationStatus.loading}>
                                {cancellationStatus.loading ? 'Cancelling...' : 'Yes, Cancel Now'}
                            </button>
                        </div>
                    )}
                </div>
                {cancellationStatus.error && <div className="alert alert-danger mt-3">{cancellationStatus.error}</div>}
                {updateStatus.success && <div className="alert alert-success mt-3">Your booking has been updated successfully!</div>}
            </>
        );
    };

    return (
        <div className="quiz-page-container">
            <div className="quiz-form-card">
                <div className="card-body p-4 p-md-5">
                    <h2 className="card-title text-center mb-4">Manage Your Booking</h2>
                    {pageStatus.loading && <p className="text-center">Loading your booking...</p>}
                    {pageStatus.error && <div className="alert alert-danger">{pageStatus.error}</div>}
                    {!pageStatus.loading && !pageStatus.error && renderBookingDetails()}
                </div>
            </div>
        </div>
    );
}

export default ManageBookingScreen;




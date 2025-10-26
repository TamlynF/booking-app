import React from 'react';
import { ProgressBar, ListGroup, Badge } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

function BookingSummary({ summary }) {
    if (!summary) return null;

    const { totalTables, confirmedTeams, pendingTeams, occupancy, confirmedBookings } = summary;

    if (confirmedTeams === 0 && pendingTeams === 0) {
        return (
            <div className="booking-summary-widget">
                <p className="summary-text-available mb-0">
                    Be the first to book for this date!
                </p>
            </div>
        );
    }

    return (
        <div className="booking-summary-widget">
            <ProgressBar 
                striped 
                variant={occupancy > 99 ? 'danger' : occupancy > 80 ? 'warning' : occupancy > 35 ? 'success' : 'info'}
                now={occupancy}
                //label={`${Math.round(occupancy)}% Booked`}
            />
            <p className="summary-text mb-2">
                <strong>{confirmedTeams} / {totalTables}</strong> Tables Booked
                
                {pendingTeams > 0 && (
                    <>
                        <br />
                        ({ pendingTeams } {pendingTeams > 1 ? 'teams' : 'team'} on Waiting List)
                    </>                    
                    )}
            </p>

            {confirmedBookings && confirmedBookings.length > 0 && (
                <>
                    <hr className="my-2" />
                    <h6 
                        className="summary-text" 
                        style={{ textAlign: 'left', fontWeight: 'bold', marginBottom: '0.25rem' }}
                    >
                        Booked Teams
                    </h6>
                    <ListGroup variant="flush" className="team-list-scroll">
                        {confirmedBookings.map(booking => (
                            <ListGroup.Item 
                                key={booking.bookingId}
                                className="d-flex justify-content-between align-items-center"
                            >
                                <span className="text-truncate" title={booking.teamName}>
                                    {booking.teamName}
                                </span>
                                <Badge bg="secondary" pill>
                                    Table: {booking.allocTableNo}
                                </Badge>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </>
            )}
        </div>
    );
}

export default BookingSummary
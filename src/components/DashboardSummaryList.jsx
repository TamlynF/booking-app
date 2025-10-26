import React from 'react';
import { Accordion, Card, ProgressBar, ListGroup, Form, Button, Spinner, Badge, Alert } from 'react-bootstrap';

import { formatDate } from '../util/utility';

function DashboardSummaryList({ groupedBookings, onDateSelect, nextEventDate }) {
    return (
        <ListGroup variant="flush">
            {groupedBookings.length > 0 ? groupedBookings.map(([date, data]) => {
                /* const occupancy = (data.confirmedTeams / data.totalTables) * 100; */
                const pendingCount = data.bookings.filter(b => b.status === 'Pending').length;
                const cancelledCount = data.bookings.filter(b => b.status === 'Cancelled').length;
                
                const formattedDate = formatDate(date);
                const isNextEvent = formattedDate === nextEventDate;

                return (
                    <ListGroup.Item 
                        action // Makes it clickable
                        onClick={() => onDateSelect(date)} 
                        key={date} 
                        // Apply highlight class if it's the next event
                        className={`quiz-summary-card ${isNextEvent ? 'next-event-highlight' : ''}`}
                    >
                        <div className="d-flex align-items-center">
                            <div className="flex-grow-1">
                                <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                                    <h6 className="mb-0 me-1">{formattedDate}</h6>
                                    <Badge bg="success" pill>
                                        {data.confirmedTeams} Confirmed
                                    </Badge>
                                    {pendingCount > 0 && (
                                        <Badge bg="warning" className="text-dark" pill>
                                            {pendingCount} Pending
                                        </Badge>
                                    )}
                                    {cancelledCount > 0 && (
                                        <Badge bg="danger" pill>
                                            {cancelledCount} Cancelled
                                        </Badge>
                                    )}
                                </div>
                                <div className="text-muted small">
                                    {data.confirmedGuests} Confirmed Guests
                                </div>
                            </div>
                            <div className="chevron-icon ms-auto">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </div>
                        </div>
                    </ListGroup.Item>
                );
            }) : <ListGroup.Item>No quizzes found.</ListGroup.Item>}
        </ListGroup>
    );
}

export default DashboardSummaryList;
import React from 'react';
import { Accordion, Card, ProgressBar, ListGroup, Form, Button, Spinner, Badge, Alert } from 'react-bootstrap';

import { formatDate } from '../util/utility';

function DashboardSummaryList({ groupedBookings, onDateSelect }) {
    return (
        <ListGroup variant="flush">
            {groupedBookings.map(([date, data]) => {
                /* const occupancy = (data.confirmedTeams / data.totalTables) * 100; */
                const pendingCount = data.bookings.filter(b => b.status === 'Pending').length;
                const cancelledCount = data.bookings.filter(b => b.status === 'Cancelled').length;
                

                return (
                    <ListGroup.Item key={date} as="div" className="p-0 border-0 mb-3">
                        <Card className="quiz-summary-card" onClick={() => onDateSelect(date)}>
                            <Card.Body>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1">
                                        <h5>{formatDate(date)}</h5>
                                        <div className="d-flex flex-wrap gap-2 mb-3 mb-md-0">
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
                                    </div>
                                    {/* <div className="d-none d-md-block" style={{ width: '200px', marginRight: '20px' }}>
                                        <ProgressBar 
                                            variant={occupancy > 80 ? 'success' : occupancy > 60 ? 'warning' : 'danger'} 
                                            now={occupancy} 
                                            label={`${Math.round(occupancy)}% Full`} 
                                            style={{ height: '20px', fontSize: '0.8rem' }} 
                                        />
                                    </div> */}
                                    <div className="chevron-icon ms-auto">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </ListGroup.Item>
                );
            })}
        </ListGroup>
    );
}

export default DashboardSummaryList;
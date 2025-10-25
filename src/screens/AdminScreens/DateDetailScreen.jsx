
import React from 'react';
import { Accordion, Card, ProgressBar, ListGroup, Form, Button, Spinner, Badge, Alert } from 'react-bootstrap';

import { formatDate, getStatusBadge } from '../../util/utility';

function DateDetailScreen({ 
    date, 
    data, 
    onBack, 
    tableInfoMap, 
    editingRowId, 
    editFormData, 
    loadingWinner,
    handleEditClick,
    handleCancelClick,
    handleEditFormChange,
    handleSaveClick,
    handleSetWinner,
    renderTableOptions,
    navigate
}) {
    return (
        <div className="col-12">
            <Button variant="outline-secondary" size="sm" onClick={onBack} className="mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-left" viewBox="0 0 16 16" style={{ verticalAlign: '-.125em' }}>
                    <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
                </svg>
                <span className="ms-2">Back to Dashboard</span>
            </Button>
            
            <h3 className="mb-3">Bookings for {formatDate(date)}</h3>
            
            <Card>
                <Card.Body>
                    <div className="table-responsive">
                        <table className="table table-striped table-hover align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Table No.</th>
                                    <th>ID</th>
                                    <th>Team Name</th>
                                    <th>Group Size</th>                                    
                                    <th>Contact Name</th>
                                    <th>Status</th>                                    
                                    <th className="text-center">Winner 🏆</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.bookings.map(booking => (
                                    <tr key={booking.bookingId}>
                                        {editingRowId === booking.bookingId ? (
                                            <>
                                                <td><Form.Control size="sm" as="select" name="allocTableNo" value={editFormData.allocTableNo} onChange={handleEditFormChange}>
                                                    <option value="">None</option>
                                                    {renderTableOptions(editFormData.groupSize, data.bookings, editingRowId)}
                                                </Form.Control></td>
                                                <td>{booking.bookingId}</td>
                                                <td><Form.Control size="sm" type="text" name="teamName" value={editFormData.teamName} onChange={handleEditFormChange} /></td>
                                                <td><Form.Control size="sm" as="select" name="groupSize" value={editFormData.groupSize} onChange={handleEditFormChange}>
                                                    {[...Array(6)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                                                </Form.Control></td>
                                                <td>{booking.contactName}</td>
                                                <td><Form.Select size="sm" name="status" value={editFormData.status} onChange={handleEditFormChange} className={`status-select ${getStatusBadge(editFormData.status).split(' ')[0]}`}>
                                                    <option value="Confirmed">Confirmed</option>
                                                    <option value="Pending">Pending</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </Form.Select></td>
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
                                                <td>{booking.allocTableNo ? `${booking.allocTableNo} (${tableInfoMap[booking.allocTableNo]?.maxGroupSize || '?'}ppl)` : 'None'}</td>
                                                    <td>{booking.bookingId}</td>
                                                <td>{booking.teamName}</td>
                                                    <td>{booking.groupSize}</td>
                                                    
                                                    {booking.contactEmail ? (
                                                    <td 
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/contact/${encodeURIComponent(booking.contactEmail)}`, { state: { fromDate: date } }); }}
                                                        style={{cursor: 'pointer', color: '#0d6efd', textDecoration: 'underline'}}
                                                        title={`View details for ${booking.contactName}`}
                                                    >
                                                        {booking.contactName}
                                                    </td>
                                                ) : (
                                                    // If no email, just display the name without a link
                                                    <td>
                                                        {booking.contactName}
                                                    </td>
                                                    )}
                                                    
                                               
                                                <td><Badge bg={getStatusBadge(booking.status)} className="status-badge">{booking.status}</Badge></td>                                                
                                                <td className="text-center">
                                                    <Button 
                                                        variant={booking.isWinner ? "success" : "outline-secondary"}
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation(); 
                                                            handleSetWinner(booking);
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
                </Card.Body>
            </Card>
        </div>
    );
}

export default DateDetailScreen;
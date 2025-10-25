import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, Button, Form, Table, Spinner, Alert, Modal, Row, Col, InputGroup } from 'react-bootstrap';
import axios from 'axios';
import { GOOGLE_SCRIPT_URL } from '../../util/globalVariables';

// --- SVGs for Actions ---
const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pencil" viewBox="0 0 16 16">
        <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V12h2.293l6.5-6.5z" />
        <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z" />
    </svg>
);

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash" viewBox="0 0 16 16">
        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
        <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
    </svg>
);

const AddIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-plus-lg me-2" viewBox="0 0 16 16">
        <path fillRule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z" />
    </svg>
);


function TableManagerScreen() {
    const context = useOutletContext();
    // Provide default values to prevent crash if context is null
    const tables = context?.tables || [];
    const fetchData = context?.fetchData || (() => {
        console.error("fetchData function is not available from Outlet context.");
    });

    const [editingTableId, setEditingTableId] = useState(null);
    const [editFormData, setEditFormData] = useState({ tableNo: '', maxGroupSize: '' });
    const [newTableData, setNewTableData] = useState({ tableNo: '', maxGroupSize: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [tableToDelete, setTableToDelete] = useState(null);
    const [isEditable, setIsEditable] = useState(false);

    const handleEditClick = (table) => {
        setEditingTableId(table.tableNo);
        setEditFormData({ tableNo: table.tableNo, maxGroupSize: table.maxGroupSize });
        setSubmissionError(null);
    };

    const handleCancelClick = () => {
        setEditingTableId(null);
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNewTableFormChange = (e) => {
        const { name, value } = e.target;
        setNewTableData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddNewTable = async () => {
        if (!newTableData.tableNo || !newTableData.maxGroupSize) {
            setSubmissionError("Table Number and Max Group Size are required.");
            return;
        }
        if (tables.some(t => String(t.tableNo) === String(newTableData.tableNo))) {
            setSubmissionError(`Table ${newTableData.tableNo} already exists.`);
            return;
        }

        setIsSubmitting(true);
        setSubmissionError(null);

        const payload = {
            action: 'addTable',
            tableData: {
                ...newTableData,
                maxGroupSize: parseInt(newTableData.maxGroupSize, 10)
            }
        };
        console.log("payload: ", payload);

        axios.post(GOOGLE_SCRIPT_URL, JSON.stringify(payload), {
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        })
            .then(response => {
                if (response.data.success) {
                    setNewTableData({ tableNo: '', maxGroupSize: '' });
                    fetchData();
                } else {
                    setSubmissionError(response.data.message || 'An error occurred while adding the table.');
                }
            })
            .catch(error => {
                console.error('Error adding new table:', error);
                setSubmissionError(error.message || 'Failed to submit the new table.');
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    const handleSaveClick = () => {
        setIsSubmitting(true);
        setSubmissionError(null);

        const payload = {
            action: 'updateTable',
            tableData: {
                tableNo: editFormData.tableNo,
                maxGroupSize: parseInt(editFormData.maxGroupSize, 10)
            }
        };
        console.log("payload: ", payload);

        axios.post(GOOGLE_SCRIPT_URL, JSON.stringify(payload), {
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        })
            .then(response => {
                if (response.data.success) {
                    setEditingTableId(null);
                    fetchData(); // Refresh data from parent
                } else {
                    setSubmissionError(response.data.message || 'Failed to save table.');
                }
            })
            .catch(err => {
                console.error(err);
                setSubmissionError('An error occurred while saving.');
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    const confirmDelete = () => {
        if (!tableToDelete) return;

        setIsSubmitting(true);
        setSubmissionError(null);

        const payload = {
            action: 'deleteTable',
            tableNo: tableToDelete.tableNo
        };
        console.log("payload: ", payload);

        axios.post(GOOGLE_SCRIPT_URL, JSON.stringify(payload), {
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        })
            .then(response => {
                if (response.data.success) {
                    fetchData(); // Refresh data
                } else {
                    setSubmissionError(response.data.message || 'Failed to delete table.');
                }
            })
            .catch(err => {
                console.error(err);
                setSubmissionError('An error occurred while deleting.');
            })
            .finally(() => {
                setIsSubmitting(false);
                setShowDeleteModal(false);
                setTableToDelete(null);
            });
    };

    const openDeleteModal = (table) => {
        setTableToDelete(table);
        setShowDeleteModal(true);
        setSubmissionError(null);
    };

    return (
        <>
            <Card>
                <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
                    Manage Tables
                    <Button
                        variant={isEditable ? "outline-secondary" : "primary"}
                        size="sm"
                        onClick={() => {
                            setIsEditable(!isEditable);
                            setNewTableData({ tableNo: '', maxGroupSize: '' }); // Clear form
                            setSubmissionError(null); // Clear errors
                        }}
                    >
                        {isEditable ? 'Cancel' : <><AddIcon /> Add New Table</>}
                    </Button>
                </Card.Header>
                <Card.Body>
                    {submissionError && <Alert variant="danger">{submissionError}</Alert>}
                    <div className="table-responsive">
                        <Table striped bordered hover>
                            <thead className="table-light">
                                <tr>
                                    <th>Table Number</th>
                                    <th>Max Group Size</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tables.sort((a, b) => a.tableNo - b.tableNo).map(table => (
                                    <tr key={table.tableNo}>
                                        {editingTableId === table.tableNo ? (
                                            <>
                                                {/* --- Edit Mode --- */}
                                                <td>
                                                    <InputGroup size="sm">
                                                        <InputGroup.Text>#</InputGroup.Text>
                                                        <Form.Control
                                                            type="number"
                                                            name="tableNo"
                                                            value={editFormData.tableNo}
                                                            onChange={handleEditFormChange}
                                                            disabled // Usually shouldn't edit the primary key
                                                        />
                                                    </InputGroup>
                                                </td>
                                                <td>
                                                    <Form.Control
                                                        type="number"
                                                        name="maxGroupSize"
                                                        value={editFormData.maxGroupSize}
                                                        onChange={handleEditFormChange}
                                                        size="sm"
                                                    />
                                                </td>
                                                <td className="text-center">
                                                    <Button variant="success" size="sm" onClick={() => handleSaveClick()} disabled={isSubmitting} className="me-2">
                                                        {isSubmitting ? '...' : 'Save'}
                                                    </Button>
                                                    <Button variant="outline-secondary" size="sm" onClick={handleCancelClick} disabled={isSubmitting}>
                                                        Cancel
                                                    </Button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                {/* --- View Mode --- */}
                                                <td><strong>{table.tableNo}</strong></td>
                                                <td>{table.maxGroupSize}</td>
                                                <td className="text-center">
                                                    <Button variant="outline-primary" size="sm" onClick={() => handleEditClick(table)} className="me-2" title="Edit">
                                                        <EditIcon />
                                                    </Button>
                                                    <Button variant="outline-danger" size="sm" onClick={() => openDeleteModal(table)} title="Delete">
                                                        <DeleteIcon />
                                                    </Button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}

                                {/* --- Add New Table Row (Conditional) --- */}
                                {isEditable && (
                                    <tr className="table-info">
                                        <td>
                                            <Form.Control
                                                type="number"
                                                placeholder="Table No."
                                                name="tableNo"
                                                value={newTableData.tableNo}
                                                onChange={handleNewTableFormChange}
                                                size="sm"
                                                isInvalid={!!submissionError}
                                            />
                                        </td>
                                        <td>
                                            <Form.Control
                                                type="number"
                                                placeholder="Max Size"
                                                name="maxGroupSize"
                                                value={newTableData.maxGroupSize}
                                                onChange={handleNewTableFormChange}
                                                size="sm"
                                                isInvalid={!!submissionError}
                                            />
                                        </td>
                                        <td className="text-center">
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={handleAddNewTable}
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? (
                                                    <Spinner as="span" animation="border" size="sm" />
                                                ) : (
                                                    'Add'
                                                )}
                                            </Button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* --- Delete Confirmation Modal --- */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Deletion</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete <strong>Table {tableToDelete?.tableNo}</strong>?
                    <br />
                    <small className="text-danger">This action cannot be undone and may affect existing bookings assigned to this table.</small>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmDelete} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                        ) : 'Delete'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default TableManagerScreen;
import { useState } from "react";

function StatusBanner() {
    const [status, setStatus] = useState("");

    return (
        <div className="card p-4 shadow-sm text-center">
            <h4 className="mb-4">Action Status</h4>

            <div className="btn-group mb-3">
                <button className="btn btn-success" onClick={() => setStatus("success")}>
                    Mark Success
                </button>
                <button className="btn btn-danger" onClick={() => setStatus("danger")}>
                    Mark Error
                </button>
                <button className="btn btn-info" onClick={() => setStatus("info")}>
                    Show info
                </button>
                <button className="btn btn-secondary" onClick={() => setStatus("")}>
                    Clear
                </button>
            </div>

            {status && (
                <div className={`alert alert-${status}`}>
                    {status === "success" && "Operation completed successfully!"}
                    {status === "danger" && "Something went wrong. Please try again."}
                    {status === "info" && "Just so you know.. this is an info alert."}
                </div>
            )}
        </div>
    )
}

export default StatusBanner
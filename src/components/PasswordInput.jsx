import { useState } from "react";

function PasswordInput () {
    const [visible, setVisible] = useState(false);
    const [password, setPassword] = useState("");

    const toggleVisibility = () => setVisible((prev) => !prev);

    return (
        <div className="card p-4 shadow-sm">
            <h5 className="mb-3">Enter Password</h5>

            <div className="input-group">
                <input
                    type={visible ? "text" : "password"}
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    id="password-holder"
                    name="password-holder"
                />
                <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={toggleVisibility}>
                    {visible ? "Hide" : "Show"}
                </button>
            </div>
            {password && (
                <p className="mt-2 small text-muted">
                    Password: <strong>{password}</strong>
                </p>
            )}
        </div>
    )
}

export default PasswordInput
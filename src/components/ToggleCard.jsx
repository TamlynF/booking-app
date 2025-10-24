import { useState } from "react";

function ToggleCard () {
    const [active, setActive] = useState(false);

    const handleToggle = () => {
        setActive(!active);
    };

    return (
        <div
            className={`card text-center p-4 shadow-sm transition bg-${active ? "warning" : "light"}`}
            style={{cursor: "pointer"}}
            onClick={handleToggle}>
            <h5 className="mb-3">Click to {active ? "Deactivate" : "Activate"}</h5>
            <p className="mb-0 text-muted">
                This Card toggles background color using <code>className</code>
            </p>
        </div>
    )
}

export default ToggleCard
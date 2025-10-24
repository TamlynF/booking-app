import { useState } from "react";

function ValidatedForm() {
    const [formData, setFormData] = useState({
        name: "",
        email: ""
    });

    const [errors, setErrors] = useState({
        name: false,
        email: false
    });

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]:value
        }));

        setErrors((prev) => ({
            ...prev,
            [name]:value.trim() === ""
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const newErrors = {
            name: formData.name.trim() === "",
            email: formData.email.trim() === ""
        };

        setErrors(newErrors);

        if(newErrors.name || newErrors.email) return;

        alert(`Name: ${formData.name}\nEmail: ${formData.email}`);
        setFormData({ name: "", email: "" });
        setErrors({ name: false, email: false });
    };

    const isFormInvalid = 
        formData.name.trim() === "" || formData.email.trim() === "";

    return (
        <form onSubmit={handleSubmit}>
            <div className="card p-4 shadow-sm">
                <h5 className="mb-3">Realtime form Validation</h5>

                <div className="mb-3">
                    <label className="form-label">Full Name</label>
                    <input 
                        type="text"
                        name="name"
                        className={`form-control ${errors.name ? "is-invalid" : ""}`}
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                    />
                    {errors.name && (
                        <div className="invalid-feedback">Name is required.</div>
                    )}
                </div>

                <div className="mb-3">
                    <label className="form-label">Email Address</label>
                    <input 
                        type="email"
                        name="email"
                        className={`form-control ${errors.email ? "is-invalid" : ""}`}
                        placeholder="email@example.com"
                        value={formData.email}
                        onChange={handleChange}
                    />
                    {errors.email && (
                        <div className="invalid-feedback">Email is required.</div>
                    )}
                </div>

                <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={isFormInvalid}>
                    Submit
                </button>

            </div>
        </form>
    )
}

export default ValidatedForm
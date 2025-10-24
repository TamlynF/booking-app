import { useState } from "react";

function BasicForm() {
    const [formData, setFormData] = useState({
        name: "",
        email: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        alert(`Name: ${formData.name}\nEmail: ${formData.email}`);

        setFormData({
            name: "",
            email: ""
        });
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="card p-4 shadow-sm">
                <h5 className="mb-3">Basic Controlled Form</h5>

                <div className="mb-3">
                    <label htmlFor="name" className="form-label">Your Name</label>
                    <input 
                        type="text"
                        id="name"
                        name="name"
                        className="form-control"
                        placeholder="Enter your name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email Address</label>
                    <div className="input-group">
                        <span className="input-group-text">@</span>
                        <input 
                            type="email"
                            id="email"
                            name="email"
                            className="form-control"
                            placeholder="yourname@mail.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <button type="submit" className="btn btn-primary w-100">
                    Submit
                </button>

                <div className="alert alert-info mt-4">
                    <p className="mb-0"><strong>Name:</strong> {formData.name || "Not Entered"} </p>
                    <p className="mb-0"><strong>Email:</strong> {formData.email || "Not Entered"} </p>
                </div>
            </div>
        </form>
    )
}

export default BasicForm
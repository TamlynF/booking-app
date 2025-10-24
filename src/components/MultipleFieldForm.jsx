import { useState } from "react";

function MultipleFieldForm () {

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        alert(`Signup info: ${formData.name}\nEmail: ${formData.email}`);
        setFormData({ name: "", email: "", password: "" });
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="card p-4 shadow-sm">
                <h5 className="mb-3">Multi-Field Form</h5>

                <div className="mb-3">
                    <label className="form-label">Full Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="John Doe"
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Email Address</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="email@example.com"
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="Password"
                        required
                    />
                </div>

                <button type="submit" className="btn btn-primary w-100">
                    Sign up
                </button>

            </div>
        </form>
    )

}

export default MultipleFieldForm
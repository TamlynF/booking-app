import { useEffect, useState } from "react";

function UserList() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("https://jsonplaceholder.typicode.com/users")
        .then((res) => res.json())
        .then((data) => {
            setUsers(data);
            setLoading(false);
        });
    }, []);

    if(loading) {
        return (
            <div className="text-center my-4">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-3">Loading users..</p>
            </div>
        );
    }

    return (
        <>
            <div className="row justify-content-center mt-5">
                <div className="col text-center">
                    <h4 className="text-center mb-4">Users Fetched from API</h4>
                </div>
            </div>
            <div className="row mb-3">
                {users.map((user) => {
                    return (
                        <div className="col-md-3 mb-3" key={user.id}>
                            <div className="card shadow-sm">
                                <div className="card-body">
                                    <h5 className="card-title">{user.name}</h5>
                                    <p className="card-text">
                                        {user.email}
                                        <br />
                                        {user.website}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </>
    )
}

export default UserList
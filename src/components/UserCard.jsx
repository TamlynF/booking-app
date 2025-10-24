function UserCard ({ name, age, image }) {
    return (
        <div className="card text-center p-3 shadow-sm mb-4">
            <img 
                src={image}
                alt={name}
                className="card-img-top rounded-circle mx-auto"
                style={{ width: "100px", height: "100px", objectFit: "cover" }} 
            />
            <div className="card-body">
                <h5 className="card-title">{name}</h5>
                <p className="card-text">Age: {age}</p>
            </div>
        </div>
    )
}

export default UserCard
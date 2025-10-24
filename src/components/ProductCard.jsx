function ProductCard ({ title, price, image, active, onClick, status }) {
    return (
        <div className={`card shadow-sm mb-4 ${active ? "border-primary border-3" : ""}`}
            style={{cursor: "pointer"}}
            onClick={onClick}>
            <img
                src={image}
                className="card-img-top"
                alt={title}
                style={{height: "200px", objectFit: "cover"}}
            />
            <div className="card-body text-center">
                <h5 className="card-title">
                    {title}
                    <span 
                        className={`ms-2 badge ${
                            status === "active" ? "bg-success" : "bg-danger"
                        }`}>
                        {status === "active" ? "Available" : "Sold Out"}
                    </span>
                </h5>
                <p className="text-success fe-bold">${price}</p>
                <button className="btn btn-sm btn-primary">Buy Now</button>
            </div>
        </div>
    )
}

export default ProductCard
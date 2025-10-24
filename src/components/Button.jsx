function Button ({ text, variant }) {
    return (
        <button className={`btn btn-${variant} me-2`}>
            {text}
        </button>
    )
}

export default Button
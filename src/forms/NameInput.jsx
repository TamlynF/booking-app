function NameInput ( {onNameChange} ) {
    return (
        <input 
            type="text"
            className="form-control"
            placeholder="Enter your name"
            onChange={(e) => onNameChange(e.target.value)}
        />
    )
}

export default NameInput
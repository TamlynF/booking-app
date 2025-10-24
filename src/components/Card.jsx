function Card({ title, description, emoji, showExtra=false }) {
    return (
        <div className="card shadow-sm p-3 mb-3">
            <div className="card-body">
                <div className="card-title card-primary">
                    {emoji && <span className="me-2">{emoji}</span>}
                    {title}
                </div>
                <p className="card-text">{description}</p>
                {showExtra && (
                    <p className="text-muted small">
                        😃 You're seeing extra details because `showExtra` is true.
                    </p>
                )}
            </div>
        </div>

    )
}

export default Card
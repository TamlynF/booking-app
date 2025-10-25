import React, { useState } from "react";

export default function QuizAIPage() {
  const [genre, setGenre] = useState("General Knowledge");
  const [difficulty, setDifficulty] = useState("medium");
  const [count, setCount] = useState(10);
  const [style, setStyle] = useState("multiple-choice"); // "multiple-choice" | "open-ended"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState([]);

  async function handleGenerate(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setQuestions([]);

    try {
      // BACKEND: choose ONE of the two:
      //  A) Node/Vercel: '/api/quiz-ai'
      //  B) Google Apps Script: your GAS URL, with {action:'generateQuestions', ...}
      const endpoint = import.meta.env.VITE_QUIZ_AI_ENDPOINT || "/api/quiz-ai";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genre, difficulty, count, style }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Expect: { ok: true, questions: [...] }
      if (!data?.ok || !Array.isArray(data.questions)) {
        throw new Error(data?.message || "Bad response format");
      }
      setQuestions(data.questions);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to generate questions.");
    } finally {
      setLoading(false);
    }
  }

  function downloadJSON() {
    const blob = new Blob([JSON.stringify({ genre, difficulty, style, questions }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = `quiz-${genre.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container" style={{ maxWidth: 900, margin: "2rem auto" }}>
      <h2 className="mb-3">Quiz AI – Generate Questions</h2>

      <form onSubmit={handleGenerate} className="card p-3 mb-4">
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Genre / Topic</label>
            <input
              className="form-control"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="e.g., 80s Music, Premier League, British History"
              required
            />
          </div>

          <div className="col-md-3">
            <label className="form-label">Difficulty</label>
            <select
              className="form-select"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label"># Questions</label>
            <input
              type="number"
              min={1}
              max={50}
              className="form-control"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            />
          </div>

          <div className="col-md-12">
            <label className="form-label">Question Style</label>
            <div className="d-flex gap-3">
              <label className="form-check">
                <input
                  type="radio"
                  name="style"
                  className="form-check-input"
                  checked={style === "multiple-choice"}
                  onChange={() => setStyle("multiple-choice")}
                />
                <span className="ms-2">Multiple-choice</span>
              </label>
              <label className="form-check">
                <input
                  type="radio"
                  name="style"
                  className="form-check-input"
                  checked={style === "open-ended"}
                  onChange={() => setStyle("open-ended")}
                />
                <span className="ms-2">Open-ended</span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-3 d-flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Generating…" : "Generate"}
          </button>
          {!!questions.length && (
            <button type="button" className="btn btn-outline-secondary" onClick={downloadJSON}>
              Download JSON
            </button>
          )}
        </div>
      </form>

      {error && <div className="alert alert-danger">{error}</div>}

      {!!questions.length && (
        <div className="card p-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Preview ({questions.length})</h5>
            <small className="text-muted">Click an answer to copy</small>
          </div>
          <hr />
          <ol>
            {questions.map((q, i) => (
              <li key={i} className="mb-3">
                <div><strong>{q.question}</strong></div>

                {q.type === "multiple-choice" ? (
                  <ul className="mt-2">
                    {q.options.map((opt, idx) => (
                      <li
                        key={idx}
                        style={{ cursor: "pointer" }}
                        onClick={() => navigator.clipboard.writeText(opt)}
                        title="Click to copy"
                      >
                        {opt}{opt === q.answer ? " ✅" : ""}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-2">
                    <span
                      style={{ cursor: "pointer" }}
                      className="badge bg-success"
                      title="Click to copy"
                      onClick={() => navigator.clipboard.writeText(q.answer)}
                    >
                      Show Answer
                    </span>
                    <span className="ms-2 text-muted">{q.answer}</span>
                  </div>
                )}

                {q.explanation && (
                  <div className="text-muted mt-1"><em>{q.explanation}</em></div>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

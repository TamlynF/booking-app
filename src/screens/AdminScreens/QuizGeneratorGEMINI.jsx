import React, { useState } from 'react';
import { 
    Container, 
    Form, 
    Button, 
    Spinner, 
    Alert, 
    Card, 
    ListGroup, 
    Row, 
    Col 
} from 'react-bootstrap';

// This component uses react-bootstrap and Tailwind CSS classes (like 'mb-3', 'mt-4')

function QuizGenerator() {
    const [topic, setTopic] = useState('');
    const [numQuestions, setNumQuestions] = useState(5);
    const [generatedQuestions, setGeneratedQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * An async helper function to fetch with exponential backoff.
     */
    const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                // Throw an error to trigger the retry mechanism
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            return response;
        } catch (err) {
            if (retries > 0) {
                // Wait for the delay and then retry
                await new Promise(res => setTimeout(res, delay));
                return fetchWithRetry(url, options, retries - 1, delay * 2);
            } else {
                // Out of retries, throw the last error
                throw err;
            }
        }
    };

    /**
     * Handles the form submission to generate the quiz.
     */
    const handleGenerateQuiz = async (e) => {
        e.preventDefault();
        if (!topic) {
            setError("Please enter a topic.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedQuestions([]);

        const apiKey = ""; // Per instructions, leave as empty string
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

        // Define the JSON schema for the expected response
        const responseSchema = {
            "type": "OBJECT",
            "properties": {
                "questions": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "question": { "type": "STRING" },
                            "options": {
                                "type": "ARRAY",
                                "items": { "type": "STRING" }
                            },
                            "answer": { "type": "STRING" }
                        },
                        "required": ["question", "options", "answer"]
                    }
                }
            },
            "required": ["questions"]
        };

        // The system instruction guides the AI's persona and task
        const systemPrompt = `You are a helpful quizmaster. Your task is to generate trivia questions.
        - Create exactly ${numQuestions} multiple-choice questions on the topic of "${topic}".
        - Each question must have 4 options.
        - One of the options must be the correct answer.
        - The "answer" field in the JSON must exactly match one of the strings in the "options" array.`;
        
        // The user prompt (for the API) is the instruction to execute
        const userQuery = `Generate ${numQuestions} questions about ${topic}.`;

        const payload = {
            contents: [{ 
                role: "user",
                parts: [{ text: userQuery }] 
            }],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.7,
            }
        };

        try {
            const response = await fetchWithRetry(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
                const jsonText = result.candidates[0].content.parts[0].text;
                const parsedData = JSON.parse(jsonText);
                
                if (parsedData.questions && Array.isArray(parsedData.questions)) {
                    setGeneratedQuestions(parsedData.questions);
                } else {
                    throw new Error("AI response was not in the expected format (missing 'questions' array).");
                }
            } else if (result.promptFeedback) {
                throw new Error(`Request was blocked. Reason: ${result.promptFeedback.blockReason}`);
            } else {
                throw new Error("No content received from the AI. The response may be empty.");
            }

        } catch (err) {
            console.error("Error generating quiz:", err);
            setError(`An error occurred: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container className="my-4">
            <Row className="justify-content-center">
                <Col md={10} lg={8}>
                    <Card className="shadow-sm">
                        <Card.Header as="h4" className="bg-primary text-white">
                            AI Quiz Question Generator
                        </Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleGenerateQuiz}>
                                <Form.Group className="mb-3" controlId="quizTopic">
                                    <Form.Label><strong>Quiz Topic</strong></Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g., '1990s Film', 'Roman History', 'Marine Biology'"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="numQuestions">
                                    <Form.Label><strong>Number of Questions</strong></Form.Label>
                                    <Form.Select
                                        value={numQuestions}
                                        onChange={(e) => setNumQuestions(Number(e.target.value))}
                                        disabled={isLoading}
                                    >
                                        <option value={3}>3</option>
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                    </Form.Select>
                                </Form.Group>

                                <div className="d-grid">
                                    <Button variant="primary" type="submit" disabled={isLoading}>
                                        {isLoading ? (
                                            <>
                                                <Spinner
                                                    as="span"
                                                    animation="border"
                                                    size="sm"
                                                    role="status"
                                                    aria-hidden="true"
                                                />
                                                <span className="ms-2">Generating...</span>
                                            </>
                                        ) : (
                                            'Generate Quiz'
                                        )}
                                    </Button>
                                </div>
                            </Form>

                            {error && (
                                <Alert variant="danger" className="mt-4">
                                    {error}
                            </Alert>
                        )}
                    </Card.Body>
                </Card>

                {generatedQuestions.length > 0 && (
                    <Card className="mt-4 shadow-sm">
                        <Card.Header as="h5">Generated Questions</Card.Header>
                        <ListGroup variant="flush">
                            {generatedQuestions.map((q, index) => (
                                <ListGroup.Item key={index} className="p-3">
                                    <strong className="d-block mb-2">Q{index + 1}: {q.question}</strong>
                                    <ListGroup variant="flush">
                                        {q.options.map((option, optIndex) => (
                                            <ListGroup.Item
                                                key={optIndex}
                                                variant={option === q.answer ? 'success' : ''}
                                                className="py-2"
                                            >
                                                {option}
                                                {option === q.answer && <span className="ms-2 badge bg-success">Correct</span>}
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                        {/* REMOVED erroneous </Card.Body> tag here. 
                          A <ListGroup variant="flush"> should be a direct child 
                          of <Card> to render correctly.
                        */}
                    </Card>
                )}
            </Col>
        </Row>
        </Container>
    );
}

export default QuizGenerator;


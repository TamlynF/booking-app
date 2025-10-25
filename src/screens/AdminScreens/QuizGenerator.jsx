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
const API_KEY = "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";

function QuizGenerator() {
    const [apiKey, setApiKey] = useState(''); // NEW: State for OpenAI API Key
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
                // Try to parse the error response from OpenAI
                let errorMsg = `API Error: ${response.status} ${response.statusText}`;
                try {
                    const errData = await response.json();
                    if (errData.error && errData.error.message) {
                        errorMsg = `API Error: ${errData.error.message}`;
                    }
                } catch (e) {
                    // Ignore if error response isn't JSON
                }
                // Throw an error to trigger the retry mechanism
                throw new Error(errorMsg);
            }
            return response;
        } catch (err) {
            if (retries > 0 && err.message.includes('500')) { // Only retry on server errors
                // Wait for the delay and then retry
                await new Promise(res => setTimeout(res, delay));
                return fetchWithRetry(url, options, retries - 1, delay * 2);
            } else {
                // Out of retries or it's a client error (like 401/403), throw the last error
                throw err;
            }
        }
    };

    /**
     * Handles the form submission to generate the quiz.
     */
    const handleGenerateQuiz = async (e) => {
        e.preventDefault();
        // NEW: Check for API key
        if (!API_KEY) {
            setError("Please enter your OpenAI API key.");
            return;
        }
        if (!topic) {
            setError("Please enter a topic.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedQuestions([]);

        // UPDATED: OpenAI API endpoint
        const apiUrl = 'https://api.openai.com/v1/chat/completions';

        // UPDATED: System prompt for OpenAI's JSON mode
        const systemPrompt = `You are a helpful quizmaster. Your task is to generate trivia questions.
- Create exactly ${numQuestions} multiple-choice questions on the topic of "${topic}".
- Each question must have 4 options.
- One of the options must be the correct answer.
- You MUST return the response as a single JSON object.
- The JSON object must have a single key: "questions".
- The "questions" key must be an array of objects, where each object has:
  1. a "question" (string)
  2. an "options" (array of 4 strings)
  3. an "answer" (string, must match one of the options)
- Do not include any other text or markdown formatting outside of the JSON object.`;

        // UPDATED: Payload structure for OpenAI
        const payload = {
            model: "gpt-4o-mini", // Using a modern, fast, and capable model
            response_format: { "type": "json_object" }, // Enable JSON mode
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Generate ${numQuestions} questions about ${topic}.` }
            ],
            temperature: 0.7,
        };
        
        // UPDATED: Fetch options with Authorization header
        const fetchOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}` // Use the API key from state
            },
            body: JSON.stringify(payload)
        };

        try {
            const response = await fetchWithRetry(apiUrl, fetchOptions);

            const result = await response.json();

            // UPDATED: Response parsing for OpenAI
            if (result.choices && result.choices[0]?.message?.content) {
                const jsonText = result.choices[0].message.content;
                const parsedData = JSON.parse(jsonText); // The content *is* the JSON string
                
                if (parsedData.questions && Array.isArray(parsedData.questions)) {
                    setGeneratedQuestions(parsedData.questions);
                } else {
                    throw new Error("AI response was not in the expected format (missing 'questions' array).");
                }
            } else if (result.error) {
                throw new Error(`OpenAI API Error: ${result.error.message}`);
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
                                {/* NEW: API Key Input Field */}
                                <Form.Group className="mb-3" controlId="apiKey">
                                    <Form.Label><strong>OpenAI API Key</strong></Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Enter your OpenAI API key (sk-...)"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        disabled={isLoading}
                                    />
                                    <Form.Text className="text-muted">
                                        Your key is sent directly to OpenAI. Get one from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI</a>.
                                    </Form.Text>
                                </Form.Group>

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
                                    <Button variant="primary" type="submit" disabled={isLoading || !API_KEY}>
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
                    </Card>
                )}
            </Col>
        </Row>
        </Container>
    );
}

export default QuizGenerator;


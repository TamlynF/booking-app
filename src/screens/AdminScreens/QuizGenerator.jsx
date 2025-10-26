import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    Container,
    Form,
    Button,
    Spinner,
    Alert,
    Card,
    ListGroup,
    Row,
    Col,
    Modal,
    Badge,
    Accordion
} from 'react-bootstrap';
import { useOutletContext } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { GOOGLE_SCRIPT_URL, SPOTIFY_ACCESS_TOKEN } from '../../util/globalVariables';
import { parseDate } from '../../util/utility';
import { ROUND_OPTIONS } from '../../util/dummyData';

const API_KEY = '';
const maxNoQuestions = 10;

function QuizGenerator() {
    const { quizData, loading: isDatesLoading, error: contextError, fetchData } = useOutletContext();

    const [roundName, setRoundName] = useState('');
    const [topic, setTopic] = useState('');
    const [numQuestions, setNumQuestions] = useState(10);
    //const [highlightedDates, setHighlightedDates] = useState([]);
    const [selectedQuizDate, setSelectedQuizDate] = useState('');
    const [generatedQuestions, setGeneratedQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null); // For save success
    const [selectedQuestions, setSelectedQuestions] = useState({}); // Stores indices: { 0: true, 2: true }
    const [isSaving, setIsSaving] = useState(false);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    //const [spotifyToken, setSpotifyToken] = useState('');
    const [isFetchingSpotify, setIsFetchingSpotify] = useState(false);
    const [spotifyMessage, setSpotifyMessage] = useState({ type: '', text: '' });
    const [embeddedTrackId, setEmbeddedTrackId] = useState(null);

    const existingQuestions = useMemo(() => {
        if (!selectedQuizDate || !roundName || !quizData) {
            return [];
        }
        return quizData.filter(q =>
            q.cssDate === selectedQuizDate &&
            q.roundName === roundName
        );
    }, [selectedQuizDate, roundName, quizData]);

    const questionCountsByRound = useMemo(() => {
        if (!selectedQuizDate || !quizData) {
            return null;
        }

        // Initialize counts with 0 for all rounds
        const initialCounts = ROUND_OPTIONS.reduce((acc, round) => {
            acc[round] = 0;
            return acc;
        }, {});

        // Filter questions for the selected date and count them by round
        const counts = quizData
            .filter(q => q.cssDate === selectedQuizDate)
            .reduce((acc, q) => {
                if (acc.hasOwnProperty(q.roundName)) {
                    acc[q.roundName]++;
                } else {
                    // This handles rounds that might be in your data but not in ROUND_OPTIONS
                    acc[q.roundName] = 1;
                }
                return acc;
            }, initialCounts);

        // Filter out rounds that are not in ROUND_OPTIONS but might be in data (optional)
        // For this implementation, we'll keep all rounds found in the data plus all ROUND_OPTIONS

        return counts;

    }, [selectedQuizDate, quizData]);

    useEffect(() => {
        if (contextError && !error) {
            setError(`Error loading admin data: ${contextError}`);
        }
    }, [contextError, error]);

    useEffect(() => {
        if (showGenerateModal) {
            // Clear previous results and start generation
            setGeneratedQuestions([]);
            setSelectedQuestions({});
            triggerAIGeneration();
        }
    }, [showGenerateModal]);

    const handleCloseModal = () => {
        setShowGenerateModal(false);
        setIsLoading(false); // Stop loading if modal is closed manually
        setGeneratedQuestions([]); // Clear generated questions on close
        setEmbeddedTrackId(null);
    };

    const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {

                let errorMsg = `API Error: ${response.status} ${response.statusText}`;
                try {
                    const errData = await response.json();
                    if (errData.error && errData.error.message) {
                        errorMsg = `API Error: ${errData.error.message}`;
                    }
                } catch (e) {
                    console.log('Error: ' + e.message);
                }
                throw new Error(errorMsg);
            }
            return response;
        } catch (err) {
            if (retries > 0 && err.message.includes('500')) {
                await new Promise(res => setTimeout(res, delay));
                return fetchWithRetry(url, options, retries - 1, delay * 2);
            } else {
                throw err;
            }
        }
    };

    const handleSelectQuestion = (index) => {
        setSelectedQuestions(prevSelected => ({
            ...prevSelected,
            [index]: !prevSelected[index]
        }));
    };

    const triggerAIGeneration = async () => {
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null); // Clear success message in modal

        const apiUrl = 'https://api.openai.com/v1/chat/completions';
        let systemPrompt = '';
        const userPrompt = `Generate ${numQuestions} items.`;
        const roundCategory = roundName.split(' ').slice(2).join(' ');
        if (roundName === "3 - Music") {
            systemPrompt = `You are a helpful quizmaster. Your task is to generate song ideas for a "name that tune" round.
                            - Create exactly ${numQuestions} song items on the topic of "${topic}".
                            - You MUST return the response as a single JSON object.
                            - The JSON object must have a single key: "questions".
                            - The "questions" key must be an array of objects, where each object has:
                              1. an "artist" (string)
                              2. a "song_title" (string)
                            - Do not include any other text or markdown formatting outside of the JSON object.`;
        } else {
            // This is the default prompt for all other rounds
            systemPrompt = `You are a helpful quizmaster. Your task is to generate trivia questions.
                            - Create ${numQuestions} questions and answers for a bar quiz category is ${roundCategory} with topic of "${topic}".
                            - Each question must have 4 options.
                            - One of the options must be the correct answer.
                            - You MUST return the response as a single JSON object.
                            - The JSON object must have a single key: "questions".
                            - The "questions" key must be an array of objects, where each object has:
                              1. a "question" (string)
                              2. an "options" (array of 4 strings)
                              3. an "answer" (string, must match one of the options)
                            - Do not include any other text or markdown formatting outside of the JSON object.`;
        }

        const payload = {
            model: "gpt-4o-mini",
            response_format: { "type": "json_object" },
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
        };

        const fetchOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(payload)
        };

        try {
            const response = await fetchWithRetry(apiUrl, fetchOptions);
            const result = await response.json();

            if (result.choices && result.choices[0]?.message?.content) {
                const jsonText = result.choices[0].message.content;
                const parsedData = JSON.parse(jsonText);

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

    const handleOpenModal = (e) => {
        e.preventDefault();
        setError(null); // Clear main page errors
        setSuccessMessage(null);
        setEmbeddedTrackId(null);

        if (!API_KEY) {
            setError("Please enter your OpenAI API key.");
            return;
        }
        if (!roundName) {
            setError("Please select a round name.");
            return;
        }
        if (!topic) {
            setError("Please enter a topic.");
            return;
        }
        if (!selectedQuizDate) {
            setError("Please select a quiz date.");
            return;
        }

        setShowGenerateModal(true);
    };

    const handleSaveQuestions = async () => {
        if (!selectedQuizDate) {
            setError("Please select a quiz date before saving.");
            return;
        }

        setIsSaving(true);
        setError(null);
        setSuccessMessage(null);

        let maxId = 0;
        if (quizData && quizData.length > 0) {
            const allIds = quizData.map(q => q.quizId).filter(id => !isNaN(id));
            maxId = allIds.length > 0 ? Math.max(...allIds) : 0;
        }

        const questionsToSave = generatedQuestions
            .filter((_, index) => !!selectedQuestions[index])
            .map((q, index) => {
                const quizId = maxId + 1 + index;

                if (roundName === "3 - Music") {
                    // For music round, save artist as question, song as answer
                    return {
                        question: q.artist,
                        answer: q.song_title,
                        roundName: roundName,
                        topic: topic,
                        quizDate: selectedQuizDate,
                        quizId: quizId
                    };
                } else {
                    // For all other rounds, save as normal
                    return {
                        question: q.question,
                        answer: q.answer,
                        roundName: roundName,
                        topic: topic,
                        quizDate: selectedQuizDate,
                        quizId: quizId
                    }
                }
            });
        //console.log('questionsToSave: ', questionsToSave);

        if (questionsToSave.length === 0) {
            setError("No questions selected. Please check at least one question to save.");
            setIsSaving(false);
            return;
        }

        const payload = {
            action: "saveQuizQuestions",
            questions: questionsToSave
        };

        axios.post(GOOGLE_SCRIPT_URL, JSON.stringify(payload), {
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        })
            .then(response => {
                if (response.data.status === 'success') {
                    setSuccessMessage(`${response.data.count} questions saved successfully!`);
                    if (fetchData) fetchData(); // <-- Refresh data in AdminLayout
                    handleCloseModal();
                } else {
                    throw new Error(response.data.message || "An unknown error occurred in Google Scripts.");
                }
            })
            .catch(err => {
                console.error("Error saving questions:", err);
                setError(`Failed to save questions: ${err.message}`);
            })
            .finally(() => {
                setIsSaving(false);
            });
    };

    const spotifyFetch = async (url, options = {}) => {
        /* if (!spotifyToken) {
            throw new Error("Spotify Access Token is missing.");
        } */

        const headers = {
            'Authorization': `Bearer ${SPOTIFY_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        };

        const response = await fetch(url, { ...options, headers });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Spotify API Error: ${err.error?.message || response.statusText}`);
        }
        // Handle 204 No Content (e.g., from adding tracks)
        if (response.status === 204 || response.status === 201) {
            return response.json();
        }
        return response.json();
    };

    const findPlaylistByName = async (name) => {
        let url = 'https://api.spotify.com/v1/me/playlists?limit=50';
        while (url) {
            const response = await spotifyFetch(url);
            // Case-sensitive check for the playlist name
            const existing = response.items.find(p => p.name === name);
            if (existing) {
                return existing;
            }
            url = response.next;
        }
        return null;
    };

    const handleFindOnSpotify = async (artist, song) => {
        setIsFetchingSpotify(true);
        setSpotifyMessage({ type: '', text: '' });
        setEmbeddedTrackId(null);

        try {
            const query = encodeURIComponent(`artist:${artist} track:${song}`);
            const url = `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`;
            const result = await spotifyFetch(url);

            if (result.tracks && result.tracks.items.length > 0) {
                const track = result.tracks.items[0];
                setEmbeddedTrackId(track.id);
                //setSpotifyMessage({ type: 'success', text: `Found: ${artist} - ${song}. Opening...` });
            } else {
                setSpotifyMessage({ type: 'warning', text: `Could not find '${artist} - ${song}' on Spotify.` });
            }
        } catch (err) {
            setSpotifyMessage({ type: 'danger', text: err.message });
        } finally {
            setIsFetchingSpotify(false);
        }
    };

    const handleCreatePlaylist = async () => {
        setIsFetchingSpotify(true);
        setSpotifyMessage({ type: '', text: 'Starting playlist creation...' });

        try {
            // 1. Get User ID
            setSpotifyMessage({ type: 'info', text: 'Fetching user profile...' });
            const user = await spotifyFetch('https://api.spotify.com/v1/me');
            const userId = user.id;

            // 2. Get all music tracks for the selected date
            const musicTracks = quizData.filter(
                q => q.cssDate === selectedQuizDate && q.roundName === "3 - Music"
            );

            if (musicTracks.length === 0) {
                setSpotifyMessage({ type: 'warning', text: 'No music songs found for this date. Add songs first.' });
                setIsFetchingSpotify(false);
                return;
            }

            // 3. Search for each track to get its URI
            setSpotifyMessage({ type: 'info', text: `Searching for ${musicTracks.length} tracks...` });
            const trackUris = await Promise.all(
                musicTracks.map(async (track) => {
                    try {
                        const query = encodeURIComponent(`artist:${track.question} track:${track.answer}`);
                        const url = `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`;
                        const result = await spotifyFetch(url);
                        if (result.tracks && result.tracks.items.length > 0) {
                            return result.tracks.items[0].uri;
                        }
                        return null; // Not found
                    } catch (err) {
                        console.error(`Error searching for ${track.question}: ${err.message}`);
                        return null;
                    }
                })
            );

            const validUris = trackUris.filter(uri => uri !== null);
            if (validUris.length === 0) {
                setSpotifyMessage({ type: 'danger', text: 'Found songs, but could not match any of them to Spotify URIs.' });
                setIsFetchingSpotify(false);
                return;
            }

            // 4. Create the new playlist
            const playlistName = `Quiz - ${selectedQuizDate}`;

            // 5. Check if playlist already exists
            setSpotifyMessage({ type: 'info', text: `Searching for existing playlist: ${playlistName}...` });
            const existingPlaylist = await findPlaylistByName(playlistName);

            if (existingPlaylist) {
                // 6a. Playlist EXISTS - Update it
                setSpotifyMessage({ type: 'info', text: `Found existing playlist. Updating tracks...` });

                // We use PUT to *replace* all tracks in the playlist
                await spotifyFetch(`https://api.spotify.com/v1/playlists/${existingPlaylist.id}/tracks`, {
                    method: 'PUT', // PUT replaces all tracks
                    body: JSON.stringify({
                        uris: validUris
                    })
                });

                setSpotifyMessage({
                    type: 'success',
                    text: `Successfully updated playlist: '${playlistName}' with ${validUris.length} songs.`
                });

            } else {
                // 6b. Playlist DOES NOT exist - Create it
                setSpotifyMessage({ type: 'info', text: `Creating new playlist: ${playlistName}...` });
                const newPlaylist = await spotifyFetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
                    method: 'POST',
                    body: JSON.stringify({
                        name: playlistName,
                        description: `Music quiz playlist for ${selectedQuizDate}`,
                        public: false
                    })
                });

                // 7. Add tracks to the new playlist
                setSpotifyMessage({ type: 'info', text: `Adding ${validUris.length} tracks to the new playlist...` });
                await spotifyFetch(`https://api.spotify.com/v1/playlists/${newPlaylist.id}/tracks`, {
                    method: 'POST', // POST adds to existing tracks (which are none)
                    body: JSON.stringify({
                        uris: validUris
                    })
                });

                setSpotifyMessage({
                    type: 'success',
                    text: `Successfully created playlist! '${newPlaylist.name}' with ${validUris.length} songs.`
                });
            }

        } catch (err) {
            setSpotifyMessage({ type: 'danger', text: `Error: ${err.message}` });
        } finally {
            setIsFetchingSpotify(false);
        }
    };

    const isThursday = (date) => {
        return date.getDay() === 4;
    };

    return (
        <Container className="my-4 mt-8">
            <style type="text/css">
                {`
                /* --- Datepicker Custom Styles --- */

                /* Make the input field look like a Bootstrap form control */
                .react-datepicker-wrapper,
                .react-datepicker__input-container {
                    width: 100%;
                    display: block;
                }
                
                /* This is the input field itself */
                .date-picker-input {
                    width: 100%;
                    padding: 0.375rem 0.75rem;
                    font-size: 1rem;
                    font-weight: 400;
                    line-height: 1.5;
                    color: #212529;
                    background-color: #fff;
                    background-clip: padding-box;
                    border: 1px solid #ced4da;
                    appearance: none;
                    border-radius: 0.375rem;
                    transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
                }
                .date-picker-input:focus {
                    color: #212529;
                    background-color: #fff;
                    border-color: #86b7fe;
                    outline: 0;
                    box-shadow: 0 0 0 0.25rem rgba(13,110,253,.25);
                }

                /* --- Calendar Popup Styles --- */

                /* Selected day: Dark blue background, white text */
                .react-datepicker__day--selected {
                    background-color: #0d6efd !important; 
                    color: white !important;
                    font-weight: bold;
                }
                
                /* Fix for "in-range" styling applying to next day */
                /* This resets any "in-range" styles that might be bleeding over */
                .react-datepicker__day--in-range,
                .react-datepicker__day--in-selecting-range {
                    background-color: transparent !important;
                    color: #000 !important;
                }

                /* Ensure selected day styles override range styles on hover */
                .react-datepicker__day--selected:hover,
                .react-datepicker__day--selected:focus {
                    background-color: #0a58ca !important; /* A slightly darker blue for hover */
                    color: white !important;
                }

                /* Highlighted dates (existing quizzes) */
                .react-datepicker__day--highlighted {
                    background-color: #e9ecef; /* A light grey */
                    color: #000;
                    border-radius: 0.3rem;
                }
                .react-datepicker__day--highlighted:hover {
                    background-color: #ced4da;
                }

                /* Ensure selected overrides highlighted */
                .react-datepicker__day--selected.react-datepicker__day--highlighted {
                     background-color: #0d6efd !important;
                     color: white !important;
                }
                .quiz-list-item {
                    padding-top: 0.5rem !important;
                    padding-bottom: 0.5rem !important;
                    font-size: 0.9rem; /* Smaller font */
                }

                .quiz-list-item strong.d-block {
                    margin-bottom: 0.25rem !important; /* Tighter spacing below question */
                    font-size: 0.95rem; /* Slightly larger than answer */
                }

                .quiz-list-item p {
                    margin-bottom: 0 !important; /* No space below answer */
                }
                .btn-close-xs {
                    width: 0.5em;
                    height: 0.5em;
                    padding: 0.25em 0.25em;
                }
                `}
            </style>
            <Row className="justify-content-center">
                <Col md={12} lg={11}>
                    <Card className="shadow-sm">
                        <Card.Header as="h4" className="bg-primary text-white">
                            Quiz Manager
                        </Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleOpenModal}>
                                <Row className="mb-3">
                                    <Col md={4}>
                                        <Form.Group controlId="quizDate">
                                            <Form.Label><strong>Date</strong></Form.Label>
                                            <DatePicker
                                                selected={
                                                    selectedQuizDate ? parseDate(selectedQuizDate) : null
                                                }
                                                onChange={(date) => {
                                                    if (date) {
                                                        const yyyy = date.getFullYear();
                                                        const mm = String(date.getMonth() + 1).padStart(2, '0');
                                                        const dd = String(date.getDate()).padStart(2, '0');
                                                        setSelectedQuizDate(`${dd}/${mm}/${yyyy}`);
                                                    } else {
                                                        setSelectedQuizDate('');
                                                    }
                                                }}
                                                dateFormat="dd MMMM yyyy"
                                                className="date-picker-input"
                                                placeholderText="Select a quiz date"
                                                minDate={new Date()}
                                                //highlightDates={highlightedDates}
                                                disabled={isLoading || isDatesLoading}
                                                filterDate={isThursday}
                                                autoComplete="off"
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group controlId="quizRoundName">
                                            <Form.Label><strong>Round Name</strong></Form.Label>
                                            <Form.Select
                                                value={roundName}
                                                onChange={(e) => setRoundName(e.target.value)}
                                                required
                                            >
                                                <option value="">Select a round...</option>
                                                {ROUND_OPTIONS.map(round => (
                                                    <option key={round} value={round}>{round}</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group controlId="quizTopic">
                                            <Form.Label><strong>Topic/Key words</strong></Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="e.g., '1990s Film', 'Roman History'"
                                                value={topic}
                                                onChange={(e) => setTopic(e.target.value)}
                                                //disabled={isLoading}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <div className="d-grid">
                                    <Button variant="primary" type="submit" disabled={!API_KEY || isDatesLoading || !topic || !selectedQuizDate || !roundName}>
                                        Generate More Questions
                                    </Button>
                                </div>
                            </Form>

                            {error && (
                                <Alert variant="danger" className="mt-4" onClose={() => setError(null)} dismissible>
                                    {error}
                                </Alert>
                            )}
                            {successMessage && (
                                <Alert variant="success" className="mt-4" onClose={() => setSuccessMessage(null)} dismissible>
                                    {successMessage}
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>

                    {questionCountsByRound && (
                        <Card className="mt-4 shadow-sm">
                            <Card.Header as="h5">
                                Question Count for {selectedQuizDate}
                            </Card.Header>
                            <Accordion flush>
                                {Object.entries(questionCountsByRound).map(([round, count]) => {
                                    // Only show rounds that are in our main list or have questions
                                    if (count > 0 || ROUND_OPTIONS.includes(round)) {
                                        const questionsForThisRound = quizData.filter(
                                            q => q.cssDate === selectedQuizDate && q.roundName === round
                                        );

                                        return (
                                            <Accordion.Item eventKey={round} key={round}>
                                                <Accordion.Header>
                                                    <span className="flex-grow-1">{round}</span>
                                                    <Badge bg={count > 0 ? "primary" : "light"} text={count > 0 ? "white" : "dark"} pill className="me-4 p-2">
                                                        {count} / {maxNoQuestions}
                                                    </Badge>
                                                </Accordion.Header>
                                                <Accordion.Body>

                                                    {questionsForThisRound.length > 0 ? (
                                                        <ListGroup variant="flush">
                                                            {questionsForThisRound.map((q, index) => (
                                                                <ListGroup.Item key={q.quizId || index} className="quiz-list-item py-2">
                                                                    <Row className="align-items-center">
                                                                        <Col>
                                                                            {q.topic === "3 - Music" ? (
                                                                                <>
                                                                                    <strong className="d-block">Artist: {q.question}</strong>
                                                                                    <p className="text-success mb-0">
                                                                                        <strong>Song:</strong> {q.answer}
                                                                                    </p>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <strong className="d-block">Q{index + 1}: {q.question}</strong>
                                                                                    <p className="text-success mb-0">
                                                                                        <strong>Answer:</strong> {q.answer}
                                                                                    </p>
                                                                                </>
                                                                            )}
                                                                            {/* --- END MODIFIED ACCORDION DISPLAY --- */}
                                                                        </Col>
                                                                        {/* --- NEW SPOTIFY FIND BUTTON --- */}
                                                                        {q.roundName === "3 - Music" && (
                                                                            <Col xs="auto">
                                                                                <Button
                                                                                    variant="outline-success"
                                                                                    size="sm"
                                                                                    onClick={() => handleFindOnSpotify(q.question, q.answer)}
                                                                                    disabled={!SPOTIFY_ACCESS_TOKEN || isFetchingSpotify}
                                                                                    title="Find this song on Spotify"
                                                                                >
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#1DB954" className="bi bi-spotify" viewBox="0 0 24 24">
                                                                                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0m5.169 17.418c-.204.33-.61.423-.938.22-2.613-1.604-5.88-1.96-9.804-1.07-.387.088-.78-.13-.868-.518-.088-.387.13-.78.518-.868 4.223-.97 7.788-.57 10.708 1.252.33.204.423.61.22.938m.68-2.88c-.24.398-.737.52-1.135.28-2.928-1.78-7.38-2.283-10.74-.833-.45.19-.948-.06-1.135-.51-.19-.45.06-.948.51-1.135C7.2 12.01 11.97 12.54 15.28 14.59c.398.24.52.737.28 1.135M16.3 11.01c-.28.477-.87.63-1.348.35-3.32-2.028-8.375-2.47-11.667-1.353-.55.18-.1.08-.698-.37-.18-.55.08-.1.37-.698.55-.18C7.14 8.52 12.57 9 16.27 11.26c.477.28.63.87.35 1.348" />
                                                                                    </svg>
                                                                                </Button>
                                                                            </Col>
                                                                        )}
                                                                    </Row>
                                                                </ListGroup.Item>
                                                            ))}
                                                        </ListGroup>
                                                    ) : (
                                                        <p className="text-muted small mb-0">No questions found for this round.</p>
                                                    )}

                                                    {round === "3 - Music" && (
                                                        <div className="bg-light p-2 rounded mb-3 border d-flex justify-content-between align-items-center">

                                                            {/* --- PLAYER SECTION (Left) --- */}
                                                            <div style={{ width: '300px', height: '80px' }}>
                                                                {embeddedTrackId ? (
                                                                    <div className="position-relative h-100">
                                                                        <Button
                                                                            variant="close"
                                                                            className="btn-close-xs position-absolute"
                                                                            style={{ zIndex: 10, right: '0.25rem', top: '0.25rem' }}
                                                                            onClick={() => setEmbeddedTrackId(null)}
                                                                            aria-label="Close Player"
                                                                        />
                                                                        <iframe
                                                                            title="Spotify Embed Player"
                                                                            src={`https://open.spotify.com/embed/track/${embeddedTrackId}?utm_source=generator`}
                                                                            width="100%"
                                                                            height="100%" // Fills the 100px div
                                                                            frameBorder="0"
                                                                            allowFullScreen=""
                                                                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                                                            loading="lazy"
                                                                            className="rounded"
                                                                        ></iframe>
                                                                    </div>
                                                                ) : (
                                                                    // Placeholder
                                                                    <div
                                                                        className="d-flex align-items-center justify-content-center rounded h-100"
                                                                        style={{
                                                                            backgroundColor: 'rgba(0,0,0,0.05)',
                                                                            border: '2px dashed rgba(0,0,0,0.1)',
                                                                        }}
                                                                    >
                                                                        <p className="text-muted small mb-0 p-2 text-center">
                                                                            Click a <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="#1DB954" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0m5.169 17.418c-.204.33-.61.423-.938.22-2.613-1.604-5.88-1.96-9.804-1.07-.387.088-.78-.13-.868-.518-.088-.387.13-.78.518-.868 4.223-.97 7.788-.57 10.708 1.252.33.204.423.61.22.938m.68-2.88c-.24.398-.737.52-1.135.28-2.928-1.78-7.38-2.283-10.74-.833-.45.19-.948-.06-1.135-.51-.19-.45.06-.948.51-1.135C7.2 12.01 11.97 12.54 15.28 14.59c.398.24.52.737.28 1.135M16.3 11.01c-.28.477-.87.63-1.348.35-3.32-2.028-8.375-2.47-11.667-1.353-.55.18-.1.08-.698-.37-.18-.55.08-.1.37-.698.55-.18C7.14 8.52 12.57 9 16.27 11.26c.477.28.63.87.35 1.348" /></svg> icon to preview.
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* --- TOOLS SECTION (Right) --- */}
                                                            <div className="d-flex align-items-center ps-4">
                                                                
                                                                {/* Message on the left of the button */}
                                                                {spotifyMessage.text && (
                                                                    <Alert variant={spotifyMessage.type || 'info'} className="mb-0 small me-2" style={{padding: '0.5rem'}}>
                                                                        {spotifyMessage.text}
                                                                    </Alert>
                                                                )}

                                                                <Button
                                                                    variant="success"
                                                                    onClick={handleCreatePlaylist}
                                                                    disabled={
                                                                        !SPOTIFY_ACCESS_TOKEN ||
                                                                        isFetchingSpotify ||
                                                                        !quizData ||
                                                                        (quizData.filter(q => q.cssDate === selectedQuizDate && q.roundName === "3 - Music").length === 0)
                                                                    }
                                                                    size="sm"
                                                                >
                                                                    {isFetchingSpotify ? (
                                                                        <>
                                                                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                                                                            <span className="ms-1">Working...</span>
                                                                        </>
                                                                    ) : (
                                                                        'Create / Update Playlist'
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}



                                                </Accordion.Body>
                                            </Accordion.Item>
                                        )
                                    }
                                    return null; // Don't render rounds with 0 count if they're not in ROUND_OPTIONS
                                })}
                            </Accordion>
                        </Card>
                    )}
                </Col>
            </Row>

            <Modal show={showGenerateModal} onHide={handleCloseModal} size="lg" backdrop="static" scrollable={true}>
                <Modal.Header closeButton>
                    <Modal.Title>Round: {roundName} | AI Generated Questions</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && (
                        <Alert variant="danger" onClose={() => setError(null)} dismissible>
                            {error}
                        </Alert>
                    )}

                    {isLoading && (
                        <div className="text-center p-5">
                            <Spinner animation="border" role="status" variant="primary" />
                            <p className="mt-3">Generating questions, please wait...</p>
                        </div>
                    )}

                    {!isLoading && generatedQuestions.length > 0 && (
                        <Card className="shadow-sm">
                            <ListGroup variant="flush">
                                {generatedQuestions.map((q, index) => (
                                    <ListGroup.Item key={index} className="quiz-list-item d-flex align-items-start">
                                        <Form.Check
                                            type="checkbox"
                                            id={`q-check-${index}`}
                                            className="me-3"
                                            style={{ transform: 'scale(1.1)', marginTop: '0.15rem' }}
                                            checked={!!selectedQuestions[index]}
                                            onChange={() => handleSelectQuestion(index)}
                                            aria-label={`Select item ${index + 1}`}
                                        />
                                        <div className="flex-grow-1">
                                            {roundName === "3 - Music" ? (
                                                <>
                                                    <strong className="d-block">Artist: {q.artist}</strong>
                                                    <p className="text-success mb-0">
                                                        <strong>Song:</strong> {q.song_title}
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <strong className="d-block">Q{index + 1}: {q.question}</strong>
                                                    <p className="text-success mb-0">
                                                        <strong>Answer:</strong> {q.answer}
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                        {roundName === "3 - Music" && (
                                            <div className="ms-auto ps-2">
                                                <Button
                                                    variant="outline-success"
                                                    size="sm"
                                                    onClick={() => handleFindOnSpotify(q.artist, q.song_title)}
                                                    disabled={!SPOTIFY_ACCESS_TOKEN || isFetchingSpotify}
                                                    title="Find this song on Spotify"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#1DB954" className="bi bi-spotify" viewBox="0 0 24 24">
                                                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0m5.169 17.418c-.204.33-.61.423-.938.22-2.613-1.604-5.88-1.96-9.804-1.07-.387.088-.78-.13-.868-.518-.088-.387.13-.78.518-.868 4.223-.97 7.788-.57 10.708 1.252.33.204.423.61.22.938m.68-2.88c-.24.398-.737.52-1.135.28-2.928-1.78-7.38-2.283-10.74-.833-.45.19-.948-.06-1.135-.51-.19-.45.06-.948.51-1.135C7.2 12.01 11.97 12.54 15.28 14.59c.398.24.52.737.28 1.135M16.3 11.01c-.28.477-.87.63-1.348.35-3.32-2.028-8.375-2.47-11.667-1.353-.55.18-.1.08-.698-.37-.18-.55.08-.1.37-.698.55-.18C7.14 8.52 12.57 9 16.27 11.26c.477.28.63.87.35 1.348" />
                                                    </svg>
                                                </Button>
                                            </div>
                                        )}
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Card>
                    )}
                </Modal.Body>
                <Modal.Footer className="d-flex justify-content-between align-items-center">
                    <div style={{ width: '300px', height: '80px' }}>
                        {embeddedTrackId && (
                            <div className="position-relative h-100">
                                <Button
                                    variant="close"
                                    className="btn-close-xs position-absolute"
                                    style={{ zIndex: 10, right: '0.25rem', top: '0.25rem' }}
                                    onClick={() => setEmbeddedTrackId(null)}
                                    aria-label="Close Player"
                                />
                                <iframe
                                    title="Spotify Embed Player"
                                    src={`https://open.spotify.com/embed/track/${embeddedTrackId}?utm_source=generator`}
                                    width="100%"
                                    height="100" // Compact player
                                    frameBorder="0"
                                    allowFullScreen=""
                                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                    loading="lazy"
                                    className="rounded"
                                ></iframe>
                            </div>
                        )}
                    </div>
                    <div>
                        <Button variant="secondary" onClick={handleCloseModal} disabled={isSaving || isLoading} className="me-2">
                            Cancel
                        </Button>

                        {/* Only show Save button if we are NOT loading AND we have questions */}
                        {!isLoading && generatedQuestions.length > 0 && (
                            <Button
                                variant="success"
                                onClick={handleSaveQuestions}
                                disabled={isSaving || Object.values(selectedQuestions).filter(Boolean).length === 0}
                            >
                                {isSaving ? (
                                    <>
                                        <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            role="status"
                                            aria-hidden="true"
                                        />
                                        <span className="ms-1">Saving...</span>
                                    </>
                                ) : (
                                    `Save ${Object.values(selectedQuestions).filter(Boolean).length} Selected`
                                )}
                            </Button>
                        )}
                    </div>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}

export default QuizGenerator;


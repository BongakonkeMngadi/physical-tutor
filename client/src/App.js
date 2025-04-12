import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// Configure API URL based on environment
const apiUrl = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:5002/api';

function App() {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const [topic, setTopic] = useState('');
  const [pastPapers, setPastPapers] = useState([]);
  const [showPastPapers, setShowPastPapers] = useState(false);
  const [apiError, setApiError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse('');
    setPastPapers([]);
    setApiError(null);
    setShowPastPapers(false);

    try {
      console.log('Sending request to:', `${apiUrl}/questions`);
      // Make a real API call to our backend with the full URL
      const result = await axios.post(`${apiUrl}/questions`, {
        content: question,
        topic: topic
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Get the AI response and past papers from the result
      const { answer, relevantPastPapers } = result.data.data;
      
      setResponse(answer);
      setPastPapers(relevantPastPapers || []);
      setLoading(false);
      if (relevantPastPapers && relevantPastPapers.length > 0) {
        setShowPastPapers(true);
      }
    } catch (error) {
      console.error('Error details:', error);
      // Provide more detailed error information for debugging
      const errorMessage = error.response?.data?.message || 
                          (error.message ? `Error: ${error.message}` : 
                          'Failed to process your question. Please try again.');
      setApiError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>South African Grade 12 Physical Science Tutor</h1>
        <p>Ask any question about Grade 12 Physical Science</p>
      </header>
      <main className="App-main">
        <form onSubmit={handleSubmit} className="question-form">
          <div className="form-group">
            <label htmlFor="topic">Select Topic (Optional):</label>
            <select
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="topic-select"
            >
              <option value="">All Topics</option>
              <option value="Mechanics">Mechanics</option>
              <option value="Waves">Waves</option>
              <option value="Electricity & Magnetism">Electricity & Magnetism</option>
              <option value="Optical Phenomena">Optical Phenomena</option>
              <option value="Chemical Change">Chemical Change</option>
              <option value="Chemical Systems">Chemical Systems</option>
              <option value="Matter & Materials">Matter & Materials</option>
              <option value="Organic Chemistry">Organic Chemistry</option>
            </select>
          </div>
          
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter your Physical Science question here... (e.g., How do I apply Newton's Second Law to solve for acceleration?)"
            rows={5}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Submit Question'}
          </button>
        </form>
        
        {loading && <div className="loader">Processing your question...</div>}
        {apiError && <div className="error-message">{apiError}</div>}
        
        {response && (
          <div className="response">
            <h2>Answer:</h2>
            <div className="response-content">
              {response.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </div>
        )}
        
        {showPastPapers && pastPapers.length > 0 && (
          <div className="past-papers">
            <h2>Relevant Past Paper Questions:</h2>
            <div className="papers-list">
              {pastPapers.map((paper, index) => (
                <div key={index} className="paper-item">
                  <h3>{paper.paper} ({paper.year})</h3>
                  <p><strong>Question:</strong> {paper.question}</p>
                  <p><strong>Topic:</strong> {paper.topic} - {paper.subtopic}</p>
                  <p><strong>Answer:</strong> {paper.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <footer className="App-footer">
        <p>© 2025 SA Science Tutor | Powered by OpenAI</p>
      </footer>
    </div>
  );
}

export default App;

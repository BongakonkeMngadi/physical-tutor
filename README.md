# SA Science Tutor

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fsa-science-tutor)

An AI agent tutor for South African Grade 12 Physical Science that helps students prepare for their final exams using OpenAI's GPT-4 Turbo API and web scraping of past exam papers.

## Overview

SA Science Tutor is designed to help Grade 12 students in South Africa with their Physical Science studies. The application uses AI to provide detailed explanations of physics and chemistry concepts according to the CAPS curriculum, while also fetching relevant past paper questions from official educational websites.

## Key Features

1. **Question Answering**
   - Process student questions about Physical Science concepts
   - Generate detailed explanations with step-by-step breakdowns
   - Use South African curriculum-specific terminology and examples
   - Reference the CAPS curriculum requirements for Grade 12 Physical Science

2. **Past Paper Practice**
   - Access past NSC Physical Science papers (2015-2024) through web scraping
   - Scrapes from multiple educational websites including:
     - SAExamPapers
     - TestPapers
     - StanmorePhysics
     - Department of Basic Education
   - Practice specific question types or topics
   - View model answers with explanations

3. **Knowledge Enhancement**
   - Concept explanations for all key topics in the Grade 12 syllabus
   - Topics covered include:
     - Physics: Mechanics, Waves, Electricity & Magnetism, Optical Phenomena
     - Chemistry: Chemical Change, Chemical Systems, Matter & Materials, Organic Chemistry
   - South African context-specific examples

## Live Demo

[View Live Demo](https://sa-science-tutor-yourusername.vercel.app)

## Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js, Express
- **AI Integration**: OpenAI GPT-4 Turbo API
- **Web Scraping**: Axios, Cheerio, Puppeteer
- **PDF Processing**: pdf-parse
- **Deployment**: Vercel

## Project Structure

The project is divided into two main parts:

- `client`: React frontend application
- `server`: Node.js/Express backend API

## Local Development

### Prerequisites

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/sa-science-tutor.git
   cd sa-science-tutor
   ```

2. Install dependencies for both client and server:
   ```bash
   npm run install:all
   ```

3. Create a `.env` file in the server directory with the following configuration:
   ```
   PORT=5002
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/sa-science-tutor
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4-turbo
   ```

4. Replace `your_openai_api_key_here` with your actual OpenAI API key.

5. Start the development servers:
   ```bash
   npm run dev
   ```

## Deployment

### Deploying to Vercel

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Configure the environment variables in Vercel settings
4. Deploy

## API Documentation

### Main Endpoints

- `POST /api/questions`: Submit a new question
- `GET /api/questions`: Get all questions
- `GET /api/concepts`: Get all concepts
- `GET /api/papers`: Get all past papers

## Screenshots

![SA Science Tutor Screenshot](https://example.com/screenshot.png)

## Future Enhancements

- User authentication and student profiles
- Progress tracking and analytics
- Expanded past paper database
- Interactive diagrams and simulations
- Mobile application version

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

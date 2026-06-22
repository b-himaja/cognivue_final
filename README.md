# Cognivue - Dark Pattern Detection System

A comprehensive web application that analyzes websites for dark patterns and deceptive design techniques using web scraping and natural language processing.

## Features

### Frontend (React + TypeScript)
- Modern, responsive UI with dark theme
- Real-time website analysis
- Interactive results dashboard with multiple views
- Screenshot display of analyzed websites
- Detailed pattern breakdown and scoring

### Backend (Node.js + Express)
- **Web Scraping**: Uses Puppeteer to extract DOM content, screenshots, and text
- **NLP Analysis**: Employs Natural.js and Compromise.js for text analysis
- **Dark Pattern Detection**: Identifies 4 main categories:
  - **Urgency Patterns**: "Limited time", "Act now", "Expires soon"
  - **Scarcity Indicators**: "Only X left", "Limited stock", "Almost sold out"
  - **Confirm Shaming**: Manipulative decline options
  - **Default Opt-ins**: Pre-selected checkboxes and subscriptions

### Analysis Capabilities
- DOM content extraction (buttons, forms, modals, banners)
- Full-page screenshot capture
- Persuasive language detection (emotional words, action verbs, superlatives)
- Risk scoring and categorization
- Detailed insights and recommendations

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Install frontend dependencies:**
```bash
npm install
```

2. **Install backend dependencies:**
```bash
cd server
npm install
```

### Running the Application

1. **Start the backend server:**
```bash
cd server
npm start
```
The server will run on `http://localhost:3001`

2. **Start the frontend development server:**
```bash
npm run dev
```
The frontend will run on `http://localhost:5173`

### Usage

1. Enter a website URL in the input field
2. Click "Analyze URL" to start the analysis
3. View results across three tabs:
   - **Overview**: Risk scores, pattern analysis, and key insights
   - **Dark Patterns**: Detailed breakdown of detected patterns by category
   - **Screenshot**: Visual capture of the analyzed website

## API Endpoints

- `POST /api/analyze` - Analyze a website URL
- `GET /api/health` - Health check endpoint
- `GET /screenshots/:filename` - Serve screenshot images

## Technology Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- Vite for build tooling

### Backend
- Express.js server
- Puppeteer for web scraping
- Natural.js for sentiment analysis
- Compromise.js for NLP processing
- CORS enabled for cross-origin requests

## Dark Pattern Categories

### 1. Urgency Patterns
Detects time-pressure tactics like "limited time offer", "expires soon", "act now"

### 2. Scarcity Indicators  
Identifies artificial scarcity like "only 3 left", "limited stock", "selling fast"

### 3. Confirm Shaming
Finds manipulative decline options like "No thanks, I don't want to save money"

### 4. Default Opt-ins
Detects pre-selected checkboxes for newsletters, marketing emails, etc.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
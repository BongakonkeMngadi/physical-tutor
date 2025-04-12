const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

// Define the source websites for exam papers
const sourceSites = [
  {
    name: 'SAExamPapers',
    baseUrl: 'https://www.saexampapers.co.za/grade-12-physicalsciences/',
    type: 'static'
  },
  {
    name: 'TestPapers',
    baseUrl: 'https://www.testpapers.co.za/gr12-physics',
    type: 'dynamic'
  },
  {
    name: 'StanmorePhysics',
    baseUrl: 'https://stanmorephysics.com/physical-science-grade-12/',
    type: 'static'
  },
  {
    name: 'DBE',
    baseUrl: 'https://www.education.gov.za/Curriculum/NationalSeniorCertificate(NSC)Examinations/NSCPastExaminationpapers.aspx',
    type: 'static'
  }
];

// Cache to avoid repeated web scraping
let cachedPapers = [];
let lastCacheUpdate = null;

/**
 * Download and cache PDF files locally
 * @param {string} url - URL of the PDF to download
 * @param {string} siteName - Name of the source site
 * @param {string} year - Year of the exam paper
 * @returns {Promise<string>} - Path to the downloaded file
 */
const downloadPdf = async (url, siteName, year) => {
  try {
    // Create directory if it doesn't exist
    const dirPath = path.join(__dirname, '..', '..', 'cache', 'pdfs');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Generate a unique filename
    const filename = `${siteName}_${year}_${Date.now()}.pdf`;
    const filepath = path.join(dirPath, filename);
    
    // Download the file
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });
    
    // Save the file
    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(filepath));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Error downloading PDF from ${url}:`, error);
    return null;
  }
};

/**
 * Extract questions from a PDF file
 * @param {string} pdfPath - Path to the PDF file
 * @param {string} topic - Topic to filter by
 * @returns {Promise<Array>} - Array of extracted questions
 */
const extractQuestionsFromPdf = async (pdfPath, topic = '') => {
  try {
    if (!pdfPath || !fs.existsSync(pdfPath)) {
      return [];
    }
    
    // Read the PDF file
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    const text = data.text;
    
    // Extract questions using regex patterns
    // This is a simplified example - real implementation would be more sophisticated
    const questionMatches = text.match(/\d+\.(\d+)? [A-Z][^\n]+\?/g) || [];
    
    // Convert matches to structured data
    return questionMatches.map((questionText, index) => {
      // Extract potential answers from the text after the question
      const startIndex = text.indexOf(questionText) + questionText.length;
      const answerText = text.substring(startIndex, startIndex + 500);
      
      // Detect topic and subtopic based on keywords
      const detectedTopic = detectTopic(questionText + ' ' + answerText);
      
      return {
        year: extractYearFromPdfPath(pdfPath),
        paper: isPaper1(questionText) ? 'Physical Sciences P1 (Physics)' : 'Physical Sciences P2 (Chemistry)',
        question: questionText.trim(),
        topic: detectedTopic.topic,
        subtopic: detectedTopic.subtopic,
        answer: extractAnswer(answerText),
        source: 'PDF'
      };
    }).filter(q => !topic || q.topic.includes(topic.toLowerCase()));
  } catch (error) {
    console.error(`Error extracting questions from PDF ${pdfPath}:`, error);
    return [];
  }
};

/**
 * Detect topic and subtopic from question and answer text
 * @param {string} text - Combined question and answer text
 * @returns {Object} - Detected topic and subtopic
 */
const detectTopic = (text) => {
  const textLower = text.toLowerCase();
  
  // Topic detection logic based on keywords
  if (textLower.includes('force') || textLower.includes('newton') || 
      textLower.includes('acceleration') || textLower.includes('velocity') || 
      textLower.includes('momentum')) {
    return { topic: 'mechanics', subtopic: textLower.includes('newton') ? 'newton\'s laws' : 'kinematics' };
  }
  
  if (textLower.includes('circuit') || textLower.includes('current') || 
      textLower.includes('voltage') || textLower.includes('resistance') || 
      textLower.includes('ohm')) {
    return { topic: 'electricity & magnetism', subtopic: 'electric circuits' };
  }
  
  if (textLower.includes('acid') || textLower.includes('base') || 
      textLower.includes('ph') || textLower.includes('equilibrium')) {
    return { topic: 'chemical change', subtopic: 'acids and bases' };
  }
  
  if (textLower.includes('alcohol') || textLower.includes('alkane') || 
      textLower.includes('functional group') || textLower.includes('organic')) {
    return { topic: 'organic chemistry', subtopic: 'functional groups' };
  }
  
  // Default if no specific topic is detected
  return { topic: 'other', subtopic: 'general' };
};

/**
 * Extract a year from PDF path
 * @param {string} pdfPath - Path to the PDF file
 * @returns {number} - Extracted year or current year
 */
const extractYearFromPdfPath = (pdfPath) => {
  const yearMatch = pdfPath.match(/(20\d{2})/); 
  return yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
};

/**
 * Determine if question is from Physics (P1) or Chemistry (P2)
 * @param {string} questionText - The question text
 * @returns {boolean} - True if Physics, false if Chemistry
 */
const isPaper1 = (questionText) => {
  const physicsKeywords = ['force', 'motion', 'velocity', 'current', 'voltage', 
                          'circuit', 'wave', 'doppler', 'momentum', 'newton'];
  
  const chemistryKeywords = ['reaction', 'acid', 'base', 'equilibrium', 'organic', 
                            'molecule', 'compound', 'bond', 'oxidation', 'reduction'];
  
  const textLower = questionText.toLowerCase();
  
  const physicsScore = physicsKeywords.reduce((count, keyword) => 
    textLower.includes(keyword) ? count + 1 : count, 0);
  
  const chemistryScore = chemistryKeywords.reduce((count, keyword) => 
    textLower.includes(keyword) ? count + 1 : count, 0);
  
  return physicsScore >= chemistryScore;
};

/**
 * Extract a potential answer from text after a question
 * @param {string} text - Text after a question
 * @returns {string} - Extracted answer or placeholder
 */
const extractAnswer = (text) => {
  // Look for common answer patterns like "Answer:" or numbered lists
  const answerMatch = text.match(/Answer:\s*([^\n]+)/i) || 
                    text.match(/Solution:\s*([^\n]+)/i) ||
                    text.match(/A\.\s*([^\n]+)/);
  
  if (answerMatch) {
    return answerMatch[1].trim();
  }
  
  // If no explicit answer found, look for equations and key values
  const equationMatch = text.match(/[A-Za-z]\s*=\s*[\d\.]+\s*[A-Za-z]*/);
  if (equationMatch) {
    return equationMatch[0];
  }
  
  return "Answer needs to be extracted from the provided PDF";
};

/**
 * Scrape websites for past paper information
 * @param {string} topic - Topic to filter by
 * @returns {Promise<Array>} - Array of paper metadata
 */
const scrapePastPapers = async (topic = '') => {
  // Return cached results if available and recent (within 24 hours)
  if (cachedPapers.length > 0 && lastCacheUpdate && 
      (new Date() - lastCacheUpdate) < 24 * 60 * 60 * 1000) {
    return cachedPapers.filter(paper => !topic || paper.topic.includes(topic.toLowerCase()));
  }
  
  const allPapers = [];
  
  // Process each source site
  for (const site of sourceSites) {
    try {
      if (site.type === 'static') {
        // For static sites, use axios and cheerio
        const response = await axios.get(site.baseUrl);
        const $ = cheerio.load(response.data);
        
        // Look for PDF links - this selector would need to be customized for each site
        $('a[href$=".pdf"]').each((index, element) => {
          const pdfUrl = $(element).attr('href');
          const linkText = $(element).text().trim();
          
          // Extract year and paper info from link text
          const yearMatch = linkText.match(/(20\d{2})/);
          const isPaper1 = linkText.toLowerCase().includes('p1') || 
                         linkText.toLowerCase().includes('physics');
          
          if (yearMatch) {
            allPapers.push({
              year: parseInt(yearMatch[1]),
              paper: isPaper1 ? 'Physical Sciences P1 (Physics)' : 'Physical Sciences P2 (Chemistry)',
              url: pdfUrl.startsWith('http') ? pdfUrl : `${site.baseUrl}${pdfUrl}`,
              source: site.name,
              // These fields would be populated after downloading and parsing the PDF
              questions: []
            });
          }
        });
      } else if (site.type === 'dynamic') {
        // For JavaScript-heavy sites, use Puppeteer
        const browser = await puppeteer.launch({
          headless: 'new', // Use new headless mode
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.goto(site.baseUrl, { waitUntil: 'networkidle2' });
        
        // Extract PDF links - this selector would need to be customized
        const pdfLinks = await page.evaluate(() => {
          const links = [];
          document.querySelectorAll('a[href$=".pdf"]').forEach(link => {
            links.push({
              url: link.href,
              text: link.textContent.trim()
            });
          });
          return links;
        });
        
        await browser.close();
        
        // Process the extracted links
        for (const link of pdfLinks) {
          const yearMatch = link.text.match(/(20\d{2})/);
          const isPaper1 = link.text.toLowerCase().includes('p1') || 
                         link.text.toLowerCase().includes('physics');
          
          if (yearMatch) {
            allPapers.push({
              year: parseInt(yearMatch[1]),
              paper: isPaper1 ? 'Physical Sciences P1 (Physics)' : 'Physical Sciences P2 (Chemistry)',
              url: link.url,
              source: site.name,
              questions: []
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error scraping ${site.name}:`, error);
    }
  }
  
  // Update cache
  cachedPapers = allPapers;
  lastCacheUpdate = new Date();
  
  return allPapers.filter(paper => !topic || paper.paper.toLowerCase().includes(topic.toLowerCase()));
};

/**
 * Search for relevant past paper questions from South African educational websites
 * @param {string} query - The search query
 * @param {string} topic - The topic to search for (e.g., Mechanics, Chemical Change)
 * @returns {Promise<Array>} - Array of relevant past paper questions
 */
const searchPastPapers = async (query, topic = '') => {
  try {
    // For now, we'll use a hybrid approach: return both scraped data and backup data
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 3);
    const topicLower = topic.toLowerCase();
    
    // Try to get papers from the web
    let scrapedResults = [];
    try {
      // This would be a slow operation in real-time, so we'll make it non-blocking
      // In a production app, this would be scheduled as a background job
      scrapePastPapers(topicLower).then(papers => {
        // Update cached papers in the background
        cachedPapers = papers;
        lastCacheUpdate = new Date();
      });
      
      // For now, use cached results if available
      if (cachedPapers.length > 0) {
        scrapedResults = cachedPapers;
      }
    } catch (error) {
      console.error('Error during web scraping:', error);
    }
    
    // Backup data in case scraping fails or returns no results
    const backupDatabase = [
      {
        year: 2023,
        paper: 'Physical Sciences P1 (Physics)',
        question: 'A 2 kg object is subjected to a net force of 10 N. Calculate the acceleration of the object.',
        topic: 'mechanics',
        subtopic: 'newton\'s laws',
        answer: 'Using Newton\'s Second Law: F = ma\na = F/m = 10 N / 2 kg = 5 m/s²',
        source: 'backup'
      },
      {
        year: 2022,
        paper: 'Physical Sciences P1 (Physics)',
        question: 'A circuit has a resistance of 5 Ω and a potential difference of 20 V. Calculate the current flowing through the circuit.',
        topic: 'electricity & magnetism',
        subtopic: 'electric circuits',
        answer: 'Using Ohm\'s Law: V = IR\nI = V/R = 20 V / 5 Ω = 4 A',
        source: 'backup'
      },
      {
        year: 2023,
        paper: 'Physical Sciences P2 (Chemistry)',
        question: 'Calculate the pH of a solution with a hydrogen ion concentration of 1 × 10⁻³ mol·dm⁻³.',
        topic: 'chemical change',
        subtopic: 'acids and bases',
        answer: 'pH = -log[H⁺]\npH = -log(1 × 10⁻³)\npH = 3',
        source: 'backup'
      },
      {
        year: 2021,
        paper: 'Physical Sciences P2 (Chemistry)',
        question: 'Draw the structural formula for propan-1-ol.',
        topic: 'organic chemistry',
        subtopic: 'alcohols',
        answer: 'CH₃CH₂CH₂OH',
        source: 'backup'
      },
      {
        year: 2022,
        paper: 'Physical Sciences P1 (Physics)',
        question: 'A car accelerates uniformly from rest to 20 m/s in 5 seconds. Calculate the distance traveled during this time.',
        topic: 'mechanics',
        subtopic: 'kinematics',
        answer: 'Using x = ut + ½at²\nWhere u = 0 m/s, t = 5 s, and a = v/t = 20/5 = 4 m/s²\nx = 0(5) + ½(4)(5)² = 50 m',
        source: 'backup'
      }
    ];
    
    // Combine scraped results with backup data if needed
    let combinedResults = scrapedResults.length > 0 ? scrapedResults : backupDatabase;
    
    // Filter results based on query and topic
    const filteredResults = combinedResults.filter(paper => {
      // Match by topic if specified
      const topicMatch = !topicLower || 
                       paper.topic?.includes(topicLower) || 
                       paper.paper?.toLowerCase().includes(topicLower);
      
      // Match by search terms in question or subtopic
      const questionMatch = paper.question && searchTerms.some(term => 
        paper.question.toLowerCase().includes(term) || 
        (paper.subtopic && paper.subtopic.toLowerCase().includes(term))
      );
      
      return topicMatch && (questionMatch || !query);
    });
    
    // Limit results to avoid overwhelming response
    return filteredResults.slice(0, 5);
  } catch (error) {
    console.error('Error searching past papers:', error);
    return [];
  }
};

module.exports = {
  searchPastPapers,
  scrapePastPapers,
  extractQuestionsFromPdf
};

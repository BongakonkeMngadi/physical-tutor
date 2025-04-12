const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Question content is required'],
    trim: true
  },
  answer: {
    type: String,
    trim: true
  },
  topic: {
    type: String,
    enum: [
      'Mechanics', 
      'Waves', 
      'Electricity & Magnetism', 
      'Optical Phenomena',
      'Chemical Change', 
      'Chemical Systems', 
      'Matter & Materials',
      'Organic Chemistry',
      'Other'
    ],
    required: true
  },
  subtopic: {
    type: String,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  followupQuestions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  parentQuestion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    default: null
  },
  modelAnswerGenerated: {
    type: Boolean,
    default: false
  },
  aiModelVersion: {
    type: String,
    default: 'gpt-4-turbo'
  }
});

// Update 'updatedAt' on save
QuestionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Question', QuestionSchema);

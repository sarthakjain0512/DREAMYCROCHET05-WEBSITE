const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  heroTitle: {
    type: String,
    required: true
  },
  heroSubtitleLine1: {
    type: String,
    default: ''
  },
  heroSubtitleLine2: {
    type: String,
    default: ''
  },
  heroImage: {
    type: mongoose.Schema.Types.Mixed,
    default: ''
  }
});

module.exports = mongoose.model('Setting', settingSchema);

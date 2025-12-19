/**
 * Model Registry
 * Central registry for all models to avoid hardcoding table names
 */

const User = require('../models/User');
const Role = require('../models/Role');
const Account = require('../models/Account');
const Contact = require('../models/Contact');
const Opportunity = require('../models/Opportunity');
const Proposal = require('../models/Proposal');
const Note = require('../models/Note');
const Reminder = require('../models/Reminder');
const Email = require('../models/Email');
const EmailAttachment = require('../models/EmailAttachment');
const GmailLabelSync = require('../models/GmailLabelSync');
const EmailSyncLog = require('../models/EmailSyncLog');

/**
 * Model registry mapping model names to model classes
 */
const MODELS = {
  User,
  Role,
  Account,
  Contact,
  Opportunity,
  Proposal,
  Note,
  Reminder,
  Email,
  EmailAttachment,
  GmailLabelSync,
  EmailSyncLog
};

/**
 * Get model class by name
 */
function getModel(modelName) {
  const Model = MODELS[modelName];
  if (!Model) {
    throw new Error(`Model ${modelName} not found in registry`);
  }
  return Model;
}

/**
 * Get table name by model name
 */
function getTableName(modelName) {
  const Model = getModel(modelName);
  return Model.getTableName();
}

/**
 * Get all registered models
 */
function getAllModels() {
  return MODELS;
}

module.exports = {
  getModel,
  getTableName,
  getAllModels,
  MODELS
};


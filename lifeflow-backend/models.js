const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { getIsMongoConnected, readJSONDb, writeJSONDb } = require('./db');

// --- 1. Mongoose Schemas ---
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePic: { type: String, default: '' },
  streak: { type: Number, default: 0 },
  maxStreak: { type: Number, default: 0 },
  lastActiveDate: { type: String, default: '' }
}, { timestamps: true });

const TaskSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  isCompleted: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  dueDate: { type: String, default: '' },
  reminderTime: { type: String, default: '' },
  categoryTags: { type: [String], default: [] },
  subtasks: [{
    id: { type: String, required: true },
    title: { type: String, required: true },
    isCompleted: { type: Boolean, default: false }
  }],
  progress: { type: Number, default: 0 } // Subtask completion percentage
}, { timestamps: true });

const GoalSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  targetDate: { type: String, default: '' },
  progress: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['not-started', 'in-progress', 'completed'], default: 'not-started' },
  subgoals: [{
    title: { type: String, required: true },
    isCompleted: { type: Boolean, default: false }
  }]
}, { timestamps: true });

const EventSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  category: { type: String, enum: ['birthday', 'exam', 'interview', 'deadline', 'other'], default: 'other' },
  isRecurring: { type: String, enum: ['daily', 'weekly', 'monthly', 'none'], default: 'none' },
  color: { type: String, default: '#3b82f6' }, // hex or tailwind name
  reminder: { type: Boolean, default: false }
}, { timestamps: true });

const NoteSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, default: '' },
  isPinned: { type: Boolean, default: false },
  category: { type: String, default: 'General' }
}, { timestamps: true });

const HabitSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  frequency: { type: String, enum: ['daily', 'weekly'], default: 'daily' },
  completedDates: { type: [String], default: [] }, // array of YYYY-MM-DD
  currentStreak: { type: Number, default: 0 }
}, { timestamps: true });

const MongoUser = mongoose.model('User', UserSchema);
const MongoTask = mongoose.model('Task', TaskSchema);
const MongoGoal = mongoose.model('Goal', GoalSchema);
const MongoEvent = mongoose.model('Event', EventSchema);
const MongoNote = mongoose.model('Note', NoteSchema);
const MongoHabit = mongoose.model('Habit', HabitSchema);


// --- 2. Mock Model Implementation (JSON File DB) ---
function wrapDocument(doc, collectionName, writeCollectionFn, readCollectionFn) {
  if (!doc) return null;
  
  // Attach save method so user.save() or doc.save() works exactly like mongoose
  Object.defineProperty(doc, 'save', {
    enumerable: false,
    value: async function() {
      const collection = readCollectionFn();
      const index = collection.findIndex(item => item._id === this._id);
      this.updatedAt = new Date().toISOString();
      if (index === -1) {
        collection.push(this);
      } else {
        collection[index] = this;
      }
      writeCollectionFn(collection);
      return this;
    }
  });
  
  return doc;
}

class MockModel {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  _readCollection() {
    const db = readJSONDb();
    return db[this.collectionName] || [];
  }

  _writeCollection(collection) {
    const db = readJSONDb();
    db[this.collectionName] = collection;
    writeJSONDb(db);
  }

  async find(query = {}) {
    const collection = this._readCollection();
    const filtered = collection.filter(doc => {
      for (let key in query) {
        // Handle array matches or exact matches
        if (Array.isArray(query[key])) {
          // Simplistic array match
          if (!Array.isArray(doc[key]) || doc[key].length !== query[key].length) return false;
          for (let i = 0; i < query[key].length; i++) {
            if (doc[key][i] !== query[key][i]) return false;
          }
        } else {
          if (doc[key] !== query[key]) return false;
        }
      }
      return true;
    });
    return filtered.map(doc => wrapDocument(doc, this.collectionName, this._writeCollection.bind(this), this._readCollection.bind(this)));
  }

  async findOne(query = {}) {
    const results = await this.find(query);
    return results.length > 0 ? results[0] : null;
  }

  async findById(id) {
    const collection = this._readCollection();
    const doc = collection.find(doc => doc._id === id);
    return doc ? wrapDocument(doc, this.collectionName, this._writeCollection.bind(this), this._readCollection.bind(this)) : null;
  }

  async create(data) {
    const collection = this._readCollection();
    const newDoc = {
      _id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    collection.push(newDoc);
    this._writeCollection(collection);
    return wrapDocument(newDoc, this.collectionName, this._writeCollection.bind(this), this._readCollection.bind(this));
  }

  async findByIdAndUpdate(id, update, options = { new: true }) {
    const collection = this._readCollection();
    const index = collection.findIndex(doc => doc._id === id);
    if (index === -1) return null;
    
    const currentDoc = collection[index];
    let updatedFields = {};
    if (update.$set) {
      updatedFields = update.$set;
    } else {
      updatedFields = update;
    }

    const updatedDoc = {
      ...currentDoc,
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };
    
    collection[index] = updatedDoc;
    this._writeCollection(collection);
    return wrapDocument(updatedDoc, this.collectionName, this._writeCollection.bind(this), this._readCollection.bind(this));
  }

  async findByIdAndDelete(id) {
    const collection = this._readCollection();
    const doc = collection.find(doc => doc._id === id);
    if (!doc) return null;
    const newCollection = collection.filter(item => item._id !== id);
    this._writeCollection(newCollection);
    return wrapDocument(doc, this.collectionName, this._writeCollection.bind(this), this._readCollection.bind(this));
  }
}


// --- 3. Dynamic Model Wrapper ---
class ModelWrapper {
  constructor(mongoModel, collectionName) {
    this.mongoModel = mongoModel;
    this.mockModel = new MockModel(collectionName);
  }

  async find(query) {
    if (getIsMongoConnected()) {
      return this.mongoModel.find(query);
    }
    return this.mockModel.find(query);
  }

  async findOne(query) {
    if (getIsMongoConnected()) {
      return this.mongoModel.findOne(query);
    }
    return this.mockModel.findOne(query);
  }

  async findById(id) {
    if (getIsMongoConnected()) {
      return this.mongoModel.findById(id);
    }
    return this.mockModel.findById(id);
  }

  async create(data) {
    if (getIsMongoConnected()) {
      return this.mongoModel.create(data);
    }
    return this.mockModel.create(data);
  }

  async findByIdAndUpdate(id, update, options) {
    if (getIsMongoConnected()) {
      return this.mongoModel.findByIdAndUpdate(id, update, options);
    }
    return this.mockModel.findByIdAndUpdate(id, update, options);
  }

  async findByIdAndDelete(id) {
    if (getIsMongoConnected()) {
      return this.mongoModel.findByIdAndDelete(id);
    }
    return this.mockModel.findByIdAndDelete(id);
  }
}

// Exports wrapped models
module.exports = {
  User: new ModelWrapper(MongoUser, 'users'),
  Task: new ModelWrapper(MongoTask, 'tasks'),
  Goal: new ModelWrapper(MongoGoal, 'goals'),
  Event: new ModelWrapper(MongoEvent, 'events'),
  Note: new ModelWrapper(MongoNote, 'notes'),
  Habit: new ModelWrapper(MongoHabit, 'habits')
};

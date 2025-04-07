import mongoose, { Schema, Document, model } from 'mongoose';
import { 
  User, InsertUser, 
  Participant, InsertParticipant, 
  Criteria, InsertCriteria, 
  Evaluation, InsertEvaluation, 
  Settings, UpdateSettings,
  LeaderboardEntry
} from '@shared/schema';

// User Schema
export interface UserDocument extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  password: string;
  email: string;
  role: 'admin' | 'judge';
  name: string;
  createdAt: Date;
}

const userSchema = new Schema<UserDocument>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, required: true, enum: ['admin', 'judge'] },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Participant Schema
export interface ParticipantDocument extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  participantId: string;
  project: string;
  description: string;
  createdAt: Date;
}

const participantSchema = new Schema<ParticipantDocument>({
  name: { type: String, required: true },
  participantId: { type: String, required: true, unique: true },
  project: { type: String, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Criteria Schema
export interface CriteriaDocument extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  weight: number;
}

const criteriaSchema = new Schema<CriteriaDocument>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  weight: { type: Number, required: true }
});

// Evaluation Schema
export interface EvaluationDocument extends Document {
  _id: mongoose.Types.ObjectId;
  participantId: number;
  judgeId: number;
  projectDesign: number;
  functionality: number;
  presentation: number;
  webDesign: number;
  impact: number;
  comments: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const evaluationSchema = new Schema<EvaluationDocument>({
  participantId: { type: Number, required: true, ref: 'Participant' },
  judgeId: { type: Number, required: true, ref: 'User' },
  projectDesign: { type: Number, required: true },
  functionality: { type: Number, required: true },
  presentation: { type: Number, required: true },
  webDesign: { type: Number, required: true },
  impact: { type: Number, required: true },
  comments: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Settings Schema
export interface SettingsDocument extends Document {
  _id: mongoose.Types.ObjectId;
  allowEditEvaluations: boolean;
  showScoresToParticipants: boolean;
  requireComments: boolean;
  autoLogout: boolean;
}

const settingsSchema = new Schema<SettingsDocument>({
  allowEditEvaluations: { type: Boolean, default: true },
  showScoresToParticipants: { type: Boolean, default: false },
  requireComments: { type: Boolean, default: true },
  autoLogout: { type: Boolean, default: false }
});

// Create and export models
export const UserModel = model<UserDocument>('User', userSchema);
export const ParticipantModel = model<ParticipantDocument>('Participant', participantSchema);
export const CriteriaModel = model<CriteriaDocument>('Criteria', criteriaSchema);
export const EvaluationModel = model<EvaluationDocument>('Evaluation', evaluationSchema);
export const SettingsModel = model<SettingsDocument>('Settings', settingsSchema);

// Helper function to convert MongoDB document to schema type
export function toUserType(doc: UserDocument): User {
  return {
    id: parseInt(String(doc._id), 10) || 1, // Default to 1 if conversion fails
    username: doc.username,
    password: doc.password,
    name: doc.name,
    email: doc.email,
    role: doc.role,
  };
}

export function toParticipantType(doc: ParticipantDocument): Participant {
  return {
    id: parseInt(String(doc._id), 10) || 1, // Default to 1 if conversion fails
    participantId: doc.participantId,
    name: doc.name,
    project: doc.project,
    description: doc.description,
    createdAt: doc.createdAt,
  };
}

export function toCriteriaType(doc: CriteriaDocument): Criteria {
  return {
    id: parseInt(String(doc._id), 10) || 1, // Default to 1 if conversion fails
    name: doc.name,
    description: doc.description,
    weight: doc.weight,
  };
}

export function toEvaluationType(doc: EvaluationDocument): Evaluation {
  return {
    id: parseInt(String(doc._id), 10) || 1, // Default to 1 if conversion fails
    participantId: doc.participantId,
    judgeId: doc.judgeId,
    projectDesign: doc.projectDesign,
    functionality: doc.functionality,
    presentation: doc.presentation,
    webDesign: doc.webDesign,
    impact: doc.impact,
    comments: doc.comments,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function toSettingsType(doc: SettingsDocument): Settings {
  return {
    id: parseInt(String(doc._id), 10) || 1, // Default to 1 if conversion fails
    allowEditEvaluations: doc.allowEditEvaluations,
    showScoresToParticipants: doc.showScoresToParticipants,
    requireComments: doc.requireComments,
    autoLogout: doc.autoLogout,
  };
}
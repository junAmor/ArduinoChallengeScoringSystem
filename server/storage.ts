import { users, type User, type InsertUser, participants, type Participant, type InsertParticipant, criteria, type Criteria, type InsertCriteria, evaluations, type Evaluation, type InsertEvaluation, settings, type Settings, type UpdateSettings, type LeaderboardEntry } from "@shared/schema";
import session from "express-session";
import { config } from "dotenv";
import MemoryStoreModule from "memorystore";

// Load environment variables
config();

// Create memory store factory with correct import
const MemoryStore = MemoryStoreModule(session);

// Storage interface for all CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: number, password: string): Promise<User | undefined>;
  getUsers(role?: string): Promise<User[]>;
  deleteUser(id: number): Promise<boolean>;

  // Participant operations
  getParticipant(id: number): Promise<Participant | undefined>;
  getParticipantByCode(participantId: string): Promise<Participant | undefined>;
  createParticipant(participant: InsertParticipant): Promise<Participant>;
  getAllParticipants(): Promise<Participant[]>;
  deleteParticipant(id: number): Promise<boolean>;

  // Criteria operations
  getAllCriteria(): Promise<Criteria[]>;
  updateCriteria(criteriaUpdates: Criteria[]): Promise<Criteria[]>;

  // Evaluation operations
  getEvaluation(participantId: number, judgeId: number): Promise<Evaluation | undefined>;
  createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation>;
  updateEvaluation(id: number, evaluation: Partial<InsertEvaluation>): Promise<Evaluation | undefined>;
  getEvaluationsByParticipant(participantId: number): Promise<Evaluation[]>;
  getEvaluationsByJudge(judgeId: number): Promise<Evaluation[]>;
  getAllEvaluations(): Promise<Evaluation[]>;

  // Settings operations
  getSettings(): Promise<Settings>;
  updateSettings(updatedSettings: UpdateSettings): Promise<Settings>;

  // Leaderboard operations
  getLeaderboard(): Promise<LeaderboardEntry[]>;

  // Backup & reset operations
  resetAllData(): Promise<boolean>;
  exportAllData(): Promise<any>;
  
  // Session store
  sessionStore: any; // Changed to any to accommodate different session store types
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private participants: Map<number, Participant>;
  private criteriaList: Map<number, Criteria>;
  private evaluationsList: Map<number, Evaluation>;
  private appSettings: Settings;
  currentUserId: number;
  currentParticipantId: number;
  currentCriteriaId: number;
  currentEvaluationId: number;
  sessionStore: any; // Session store instance

  constructor() {
    this.users = new Map();
    this.participants = new Map();
    this.criteriaList = new Map();
    this.evaluationsList = new Map();
    
    this.currentUserId = 1;
    this.currentParticipantId = 1;
    this.currentCriteriaId = 1;
    this.currentEvaluationId = 1;

    // Initialize default criteria
    this.criteriaList.set(this.currentCriteriaId++, {
      id: 1,
      name: "Project Design",
      description: "Evaluate the overall design quality, aesthetics, and structure of the project",
      weight: 25.0,
    });
    this.criteriaList.set(this.currentCriteriaId++, {
      id: 2,
      name: "Functionality",
      description: "Rate how well the project works and fulfills its intended purpose",
      weight: 30.0,
    });
    this.criteriaList.set(this.currentCriteriaId++, {
      id: 3,
      name: "Presentation",
      description: "Evaluate the quality of the project presentation and documentation",
      weight: 15.0,
    });
    this.criteriaList.set(this.currentCriteriaId++, {
      id: 4,
      name: "Web Design",
      description: "Rate the quality of any web interfaces or web components of the project",
      weight: 15.0,
    });
    this.criteriaList.set(this.currentCriteriaId++, {
      id: 5,
      name: "Impact",
      description: "Evaluate the potential social, environmental, or economic impact of the project",
      weight: 15.0,
    });

    // Initialize default settings
    this.appSettings = {
      id: 1,
      allowEditEvaluations: true,
      showScoresToParticipants: false,
      requireComments: true,
      autoLogout: false,
    };

    // Create session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    // Ensure role is always set (default to "judge" if not specified)
    const newUser: User = { 
      ...user, 
      id,
      role: user.role || "judge" 
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUserPassword(id: number, password: string): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, password };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUsers(role?: string): Promise<User[]> {
    const allUsers = Array.from(this.users.values());
    if (role) {
      return allUsers.filter(user => user.role === role);
    }
    return allUsers;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Participant operations
  async getParticipant(id: number): Promise<Participant | undefined> {
    return this.participants.get(id);
  }

  async getParticipantByCode(participantId: string): Promise<Participant | undefined> {
    return Array.from(this.participants.values()).find(
      (participant) => participant.participantId === participantId,
    );
  }

  async createParticipant(participant: InsertParticipant): Promise<Participant> {
    const id = this.currentParticipantId++;
    const createdAt = new Date();
    const newParticipant: Participant = { ...participant, id, createdAt };
    this.participants.set(id, newParticipant);
    return newParticipant;
  }

  async getAllParticipants(): Promise<Participant[]> {
    return Array.from(this.participants.values());
  }

  async deleteParticipant(id: number): Promise<boolean> {
    return this.participants.delete(id);
  }

  // Criteria operations
  async getAllCriteria(): Promise<Criteria[]> {
    return Array.from(this.criteriaList.values());
  }

  async updateCriteria(criteriaUpdates: Criteria[]): Promise<Criteria[]> {
    for (const criteria of criteriaUpdates) {
      if (this.criteriaList.has(criteria.id)) {
        this.criteriaList.set(criteria.id, criteria);
      }
    }
    return this.getAllCriteria();
  }

  // Evaluation operations
  async getEvaluation(participantId: number, judgeId: number): Promise<Evaluation | undefined> {
    return Array.from(this.evaluationsList.values()).find(
      (evaluation) => evaluation.participantId === participantId && evaluation.judgeId === judgeId,
    );
  }

  async createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation> {
    const id = this.currentEvaluationId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    // Ensure comments is null if undefined
    const newEvaluation: Evaluation = { 
      ...evaluation, 
      id, 
      createdAt, 
      updatedAt,
      comments: evaluation.comments || null 
    };
    this.evaluationsList.set(id, newEvaluation);
    return newEvaluation;
  }

  async updateEvaluation(id: number, evaluation: Partial<InsertEvaluation>): Promise<Evaluation | undefined> {
    const existingEvaluation = this.evaluationsList.get(id);
    if (!existingEvaluation) return undefined;
    
    const updatedEvaluation: Evaluation = {
      ...existingEvaluation,
      ...evaluation,
      updatedAt: new Date(),
    };
    
    this.evaluationsList.set(id, updatedEvaluation);
    return updatedEvaluation;
  }

  async getEvaluationsByParticipant(participantId: number): Promise<Evaluation[]> {
    return Array.from(this.evaluationsList.values()).filter(
      (evaluation) => evaluation.participantId === participantId,
    );
  }

  async getEvaluationsByJudge(judgeId: number): Promise<Evaluation[]> {
    return Array.from(this.evaluationsList.values()).filter(
      (evaluation) => evaluation.judgeId === judgeId,
    );
  }

  async getAllEvaluations(): Promise<Evaluation[]> {
    return Array.from(this.evaluationsList.values());
  }

  // Settings operations
  async getSettings(): Promise<Settings> {
    return this.appSettings;
  }

  async updateSettings(updatedSettings: UpdateSettings): Promise<Settings> {
    this.appSettings = { ...this.appSettings, ...updatedSettings };
    return this.appSettings;
  }

  // Leaderboard operations
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const participants = await this.getAllParticipants();
    const allEvaluations = await this.getAllEvaluations();
    const criteria = await this.getAllCriteria();
    
    // Calculate weights
    const weights = {
      projectDesign: criteria.find(c => c.name === "Project Design")?.weight || 25,
      functionality: criteria.find(c => c.name === "Functionality")?.weight || 30,
      presentation: criteria.find(c => c.name === "Presentation")?.weight || 15,
      webDesign: criteria.find(c => c.name === "Web Design")?.weight || 15,
      impact: criteria.find(c => c.name === "Impact")?.weight || 15,
    };
    
    // Create leaderboard entries
    const entries: LeaderboardEntry[] = [];
    
    for (const participant of participants) {
      const participantEvals = allEvaluations.filter(
        evaluation => evaluation.participantId === participant.id
      );
      
      if (participantEvals.length === 0) continue; // Skip participants with no evaluations
      
      // Calculate average scores per criteria
      const totalScores = participantEvals.reduce(
        (acc, evaluation) => {
          return {
            projectDesign: acc.projectDesign + evaluation.projectDesign,
            functionality: acc.functionality + evaluation.functionality,
            presentation: acc.presentation + evaluation.presentation,
            webDesign: acc.webDesign + evaluation.webDesign,
            impact: acc.impact + evaluation.impact,
          };
        },
        { projectDesign: 0, functionality: 0, presentation: 0, webDesign: 0, impact: 0 }
      );
      
      const count = participantEvals.length;
      const avgScores = {
        projectDesign: parseFloat((totalScores.projectDesign / count).toFixed(1)),
        functionality: parseFloat((totalScores.functionality / count).toFixed(1)),
        presentation: parseFloat((totalScores.presentation / count).toFixed(1)),
        webDesign: parseFloat((totalScores.webDesign / count).toFixed(1)),
        impact: parseFloat((totalScores.impact / count).toFixed(1)),
      };
      
      // Calculate weighted total
      const weightedTotal = 
        (avgScores.projectDesign * weights.projectDesign / 100) +
        (avgScores.functionality * weights.functionality / 100) +
        (avgScores.presentation * weights.presentation / 100) +
        (avgScores.webDesign * weights.webDesign / 100) +
        (avgScores.impact * weights.impact / 100);
      
      const total = parseFloat(weightedTotal.toFixed(1));
      
      entries.push({
        participantId: participant.id,
        participantCode: participant.participantId,
        name: participant.name,
        project: participant.project,
        ...avgScores,
        total,
        rank: 0, // Will be assigned after sorting
      });
    }
    
    // Sort by total score and assign ranks
    entries.sort((a, b) => b.total - a.total);
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    
    return entries;
  }

  // Backup & reset operations
  async resetAllData(): Promise<boolean> {
    // Keep users, reset everything else
    this.participants = new Map();
    this.evaluationsList = new Map();
    this.currentParticipantId = 1;
    this.currentEvaluationId = 1;
    
    return true;
  }

  async exportAllData(): Promise<any> {
    return {
      participants: Array.from(this.participants.values()),
      evaluations: Array.from(this.evaluationsList.values()),
      criteria: Array.from(this.criteriaList.values()),
      settings: this.appSettings,
    };
  }
}

// Export the memory storage implementation
export const storage = new MemStorage();

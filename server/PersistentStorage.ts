import { db } from "@shared/db";
import { users, participants, criteria, evaluations, settings } from "@shared/schema";
import type { IStorage } from "./PersistentStorage";
import type { User, InsertUser, Participant, InsertParticipant, Criteria, Evaluation, InsertEvaluation, Settings, UpdateSettings, LeaderboardEntry } from "@shared/schema";

export class PersistentStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const user = await db.select().from(users).where(users.id.eq(id)).limit(1);
    return user[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await db.select().from(users).where(users.username.eq(username)).limit(1);
    return user[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUserPassword(id: number, password: string): Promise<User | undefined> {
    const [updatedUser] = await db.update(users).set({ password }).where(users.id.eq(id)).returning();
    return updatedUser;
  }

  async getUsers(role?: string): Promise<User[]> {
    if (role) {
      return await db.select().from(users).where(users.role.eq(role));
    }
    return await db.select().from(users);
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(users.id.eq(id));
    return result > 0;
  }

  // Participant operations
  async getParticipant(id: number): Promise<Participant | undefined> {
    const participant = await db.select().from(participants).where(participants.id.eq(id)).limit(1);
    return participant[0];
  }

  async getParticipantByCode(participantId: string): Promise<Participant | undefined> {
    const participant = await db.select().from(participants).where(participants.participantId.eq(participantId)).limit(1);
    return participant[0];
  }

  async createParticipant(participant: InsertParticipant): Promise<Participant> {
    const [newParticipant] = await db.insert(participants).values(participant).returning();
    return newParticipant;
  }

  async getAllParticipants(): Promise<Participant[]> {
    return await db.select().from(participants);
  }

  async deleteParticipant(id: number): Promise<boolean> {
    const result = await db.delete(participants).where(participants.id.eq(id));
    return result > 0;
  }

  // Criteria operations
  async getAllCriteria(): Promise<Criteria[]> {
    return await db.select().from(criteria);
  }

  async updateCriteria(criteriaUpdates: Criteria[]): Promise<Criteria[]> {
    for (const criteriaUpdate of criteriaUpdates) {
      await db.update(criteria).set(criteriaUpdate).where(criteria.id.eq(criteriaUpdate.id));
    }
    return this.getAllCriteria();
  }

  // Evaluation operations
  async getEvaluation(participantId: number, judgeId: number): Promise<Evaluation | undefined> {
    const evaluation = await db
      .select()
      .from(evaluations)
      .where(evaluations.participantId.eq(participantId).and(evaluations.judgeId.eq(judgeId)))
      .limit(1);
    return evaluation[0];
  }

  async createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation> {
    const [newEvaluation] = await db.insert(evaluations).values(evaluation).returning();
    return newEvaluation;
  }

  async updateEvaluation(id: number, evaluation: Partial<InsertEvaluation>): Promise<Evaluation | undefined> {
    const [updatedEvaluation] = await db.update(evaluations).set(evaluation).where(evaluations.id.eq(id)).returning();
    return updatedEvaluation;
  }

  async getEvaluationsByParticipant(participantId: number): Promise<Evaluation[]> {
    return await db.select().from(evaluations).where(evaluations.participantId.eq(participantId));
  }

  async getEvaluationsByJudge(judgeId: number): Promise<Evaluation[]> {
    return await db.select().from(evaluations).where(evaluations.judgeId.eq(judgeId));
  }

  async getAllEvaluations(): Promise<Evaluation[]> {
    return await db.select().from(evaluations);
  }

  // Settings operations
  async getSettings(): Promise<Settings> {
    const settingsData = await db.select().from(settings).limit(1);
    return settingsData[0];
  }

  async updateSettings(updatedSettings: UpdateSettings): Promise<Settings> {
    const [updated] = await db.update(settings).set(updatedSettings).where(settings.id.eq(1)).returning();
    return updated;
  }

  // Leaderboard operations
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    // Implement leaderboard logic similar to the in-memory version
    throw new Error("Leaderboard logic not implemented yet.");
  }

  // Backup & reset operations
  async resetAllData(): Promise<boolean> {
    await db.delete(participants).execute();
    await db.delete(evaluations).execute();
    return true;
  }

  async exportAllData(): Promise<any> {
    const participants = await this.getAllParticipants();
    const evaluations = await this.getAllEvaluations();
    const criteriaList = await this.getAllCriteria();
    const settingsData = await this.getSettings();
    return { participants, evaluations, criteria: criteriaList, settings: settingsData };
  }
}


// Export an instance of PersistentStorage
export const storage = new PersistentStorage();
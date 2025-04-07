import { pgTable, text, serial, integer, boolean, json, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema for both admin and judges
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "judge"] }).notNull().default("judge"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
});

// Participants
export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  participantId: text("participant_id").notNull().unique(), // like ARDC-001
  name: text("name").notNull(),
  project: text("project").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertParticipantSchema = createInsertSchema(participants).pick({
  participantId: true,
  name: true,
  project: true,
});

// Evaluation criteria
export const criteria = pgTable("criteria", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  weight: real("weight").notNull().default(20.0), // percentage, default 20% each
});

export const insertCriteriaSchema = createInsertSchema(criteria).pick({
  name: true,
  description: true,
  weight: true,
});

// Evaluations
export const evaluations = pgTable("evaluations", {
  id: serial("id").primaryKey(),
  participantId: integer("participant_id").notNull(),
  judgeId: integer("judge_id").notNull(),
  projectDesign: real("project_design").notNull(),
  functionality: real("functionality").notNull(),
  presentation: real("presentation").notNull(),
  webDesign: real("web_design").notNull(),
  impact: real("impact").notNull(),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertEvaluationSchema = createInsertSchema(evaluations).pick({
  participantId: true,
  judgeId: true,
  projectDesign: true,
  functionality: true,
  presentation: true,
  webDesign: true,
  impact: true,
  comments: true,
});

// Settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  allowEditEvaluations: boolean("allow_edit_evaluations").default(true),
  showScoresToParticipants: boolean("show_scores_to_participants").default(false),
  requireComments: boolean("require_comments").default(true),
  autoLogout: boolean("auto_logout").default(false),
});

export const updateSettingsSchema = createInsertSchema(settings).pick({
  allowEditEvaluations: true,
  showScoresToParticipants: true,
  requireComments: true,
  autoLogout: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Participant = typeof participants.$inferSelect;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;

export type Criteria = typeof criteria.$inferSelect;
export type InsertCriteria = z.infer<typeof insertCriteriaSchema>;

export type Evaluation = typeof evaluations.$inferSelect;
export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;

export type Settings = typeof settings.$inferSelect;
export type UpdateSettings = z.infer<typeof updateSettingsSchema>;

// Extended schemas for leaderboard data
export const leaderboardEntrySchema = z.object({
  participantId: z.number(),
  participantCode: z.string(),
  name: z.string(),
  project: z.string(),
  projectDesign: z.number(),
  functionality: z.number(),
  presentation: z.number(),
  webDesign: z.number(),
  impact: z.number(),
  total: z.number(),
  rank: z.number(),
  comments: z.array(z.object({
    judgeId: z.number(),
    judgeName: z.string().optional(),
    text: z.string(),
  })).optional(),
});

export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;

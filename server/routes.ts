import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./PersistentStorage";
import { setupAuth, hashPassword, comparePasswords } from "./auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertParticipantSchema, insertEvaluationSchema, updateSettingsSchema, insertUserSchema, User } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";



export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // API middleware to ensure authentication
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    // At this point, we know req.user exists because isAuthenticated() returns true
    next();
  };

  // API middleware to ensure admin role
  const requireAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // We know req.user exists because isAuthenticated() returns true
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admin permission required" });
    }
    next();
  };

  // Error handling middleware
  const handleZodError = (err: any, res: Response) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }
    return res.status(500).json({ message: err.message || "An error occurred" });
  };

  // =========== Participant Routes ============
  
  // Get all participants
  app.get("/api/participants", requireAuth, async (req, res) => {
    try {
      const participants = await storage.getAllParticipants();
      res.json(participants);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Add a participant (admin only)
  app.post("/api/participants", requireAdmin, async (req, res) => {
    try {
      const participantData = insertParticipantSchema.parse(req.body);
      
      // Check if participant ID already exists
      const existing = await storage.getParticipantByCode(participantData.participantId);
      if (existing) {
        return res.status(400).json({ message: "Participant ID already exists" });
      }
      
      const participant = await storage.createParticipant(participantData);
      res.status(201).json(participant);
    } catch (err: any) {
      handleZodError(err, res);
    }
  });
  
  // Delete a participant (admin only)
  app.delete("/api/participants/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const success = await storage.deleteParticipant(id);
      if (!success) {
        return res.status(404).json({ message: "Participant not found" });
      }
      
      res.status(200).json({ message: "Participant deleted successfully" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // =========== Judge/User Routes ============
  
  // Get all judges (admin only)
  app.get("/api/judges", requireAdmin, async (req, res) => {
    try {
      const judges = await storage.getUsers("judge");
      const safeJudges = judges.map(({ password, ...judge }) => judge);
      res.json(safeJudges);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Add a judge (admin only)
  app.post("/api/judges", requireAdmin, async (req, res) => {
    try {
      const judgeData = insertUserSchema.parse({
        ...req.body,
        role: "judge"
      });
      
      // Check if username already exists
      const existing = await storage.getUserByUsername(judgeData.username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash the password before storing
      const hashedPassword = await hashPassword(judgeData.password);
      const judgeWithHashedPassword = {
        ...judgeData,
        password: hashedPassword
      };
      
      const judge = await storage.createUser(judgeWithHashedPassword);
      
      // Remove password from response
      const { password, ...safeJudge } = judge;
      res.status(201).json(safeJudge);
    } catch (err: any) {
      handleZodError(err, res);
    }
  });
  
  // Delete a judge (admin only)
  app.delete("/api/judges/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "Judge not found" });
      }
      
      res.status(200).json({ message: "Judge deleted successfully" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // =========== Evaluation Routes ============
  
  // Get evaluations for a participant
  app.get("/api/evaluations/participant/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const evaluations = await storage.getEvaluationsByParticipant(id);
      res.json(evaluations);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Get evaluations by the current judge
  app.get("/api/evaluations/judge", requireAuth, async (req, res) => {
    try {
      // TypeScript needs non-null assertion here since we already checked in requireAuth
      const evaluations = await storage.getEvaluationsByJudge(req.user!.id);
      res.json(evaluations);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Submit an evaluation
  app.post("/api/evaluations", requireAuth, async (req, res) => {
    try {
      // Only judges can submit evaluations
      if (req.user!.role !== "judge") {
        return res.status(403).json({ message: "Only judges can submit evaluations" });
      }
      
      const evaluationData = insertEvaluationSchema.parse({
        ...req.body,
        judgeId: req.user!.id,
      });
      
      // Check if participant exists
      const participant = await storage.getParticipant(evaluationData.participantId);
      if (!participant) {
        return res.status(404).json({ message: "Participant not found" });
      }
      
      // Check if this judge has already evaluated this participant
      const existingEvaluation = await storage.getEvaluation(evaluationData.participantId, req.user!.id);
      
      if (existingEvaluation) {
        // Check if editing is allowed
        const settings = await storage.getSettings();
        if (!settings.allowEditEvaluations) {
          return res.status(403).json({ message: "Editing evaluations is not allowed" });
        }
        
        // Update existing evaluation
        const updated = await storage.updateEvaluation(existingEvaluation.id, evaluationData);
        return res.json(updated);
      }
      
      // Create new evaluation
      const evaluation = await storage.createEvaluation(evaluationData);
      res.status(201).json(evaluation);
    } catch (err: any) {
      handleZodError(err, res);
    }
  });

  // =========== Criteria Routes ============
  
  // Get all criteria
  app.get("/api/criteria", requireAuth, async (req, res) => {
    try {
      const criteria = await storage.getAllCriteria();
      res.json(criteria);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Update criteria weights (admin only)
  app.put("/api/criteria", requireAdmin, async (req, res) => {
    try {
      const criteriaUpdates = req.body;
      
      // Validate total weights add up to 100%
      const totalWeight = criteriaUpdates.reduce((sum: number, c: any) => sum + c.weight, 0);
      if (Math.abs(totalWeight - 100) > 0.01) {
        return res.status(400).json({ message: "Criteria weights must sum to 100%" });
      }
      
      const updatedCriteria = await storage.updateCriteria(criteriaUpdates);
      res.json(updatedCriteria);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // =========== Settings Routes ============
  
  // Get settings
  app.get("/api/settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Update settings (admin only)
  app.put("/api/settings", requireAdmin, async (req, res) => {
    try {
      const settingsData = updateSettingsSchema.parse(req.body);
      const updatedSettings = await storage.updateSettings(settingsData);
      res.json(updatedSettings);
    } catch (err: any) {
      handleZodError(err, res);
    }
  });

  // =========== Leaderboard Routes ============
  
  // Get leaderboard
  app.get("/api/leaderboard", requireAuth, async (req, res) => {
    try {
      const leaderboard = await storage.getLeaderboard();
      res.json(leaderboard);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // =========== Password Update Route ============
  
  // Update user's own password
  app.put("/api/password", requireAuth, async (req, res) => {
    try {
      const passwordSchema = z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6),
      });
      
      const { currentPassword, newPassword } = passwordSchema.parse(req.body);
      
      // Verify current password
      const user = await storage.getUserByUsername(req.user!.username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify the current password is correct
      if (!(await comparePasswords(currentPassword, user.password))) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      
      // Hash the new password
      const hashedNewPassword = await hashPassword(newPassword);
      
      // Update password
      const updatedUser = await storage.updateUserPassword(req.user!.id, hashedNewPassword);
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update password" });
      }
      
      res.json({ message: "Password updated successfully" });
    } catch (err: any) {
      handleZodError(err, res);
    }
  });

  // =========== Backup & Reset Routes ============
  
  // Export all data (admin only)
  app.get("/api/export", requireAdmin, async (req, res) => {
    try {
      const data = await storage.exportAllData();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Reset all data (admin only)
  app.post("/api/reset", requireAdmin, async (req, res) => {
    try {
      const success = await storage.resetAllData();
      if (!success) {
        return res.status(500).json({ message: "Failed to reset data" });
      }
      
      res.json({ message: "Data reset successfully" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

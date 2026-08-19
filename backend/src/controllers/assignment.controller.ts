import { Request, Response, NextFunction } from 'express';
import { AssignmentService } from '../services/assignment.service.js';

export class AssignmentController {
  static async createAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const assignment = await AssignmentService.createAssignment(req.user!.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Assignment created successfully.',
        data: assignment,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAssignments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { subjectId } = req.query;
      if (!subjectId) {
        res.status(400).json({ success: false, message: 'Subject ID is required.' });
        return;
      }

      const studentId = req.user!.role === 'STUDENT' ? req.user!.id : undefined;
      const assignments = await AssignmentService.getAssignmentsForSubject(
        subjectId as string,
        studentId
      );

      res.status(200).json({
        success: true,
        data: assignments,
      });
    } catch (err) {
      next(err);
    }
  }

  static async submitAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'Please attach your assignment answer file.' });
        return;
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      const submission = await AssignmentService.submitAssignment(req.params.id, req.user!.id, {
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        submissionText: req.body.submissionText,
      });

      res.status(200).json({
        success: true,
        message: `Assignment submitted successfully! Status: ${submission.status}`,
        data: submission,
      });
    } catch (err) {
      next(err);
    }
  }

  static async gradeSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const submission = await AssignmentService.gradeSubmission(req.params.id, req.user!.id, {
        marksObtained: req.body.marksObtained,
        feedback: req.body.feedback,
      });

      res.status(200).json({
        success: true,
        message: 'Submission graded successfully.',
        data: submission,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getSubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const submissions = await AssignmentService.getSubmissionsForAssignment(req.params.id);
      res.status(200).json({
        success: true,
        data: submissions,
      });
    } catch (err) {
      next(err);
    }
  }
}

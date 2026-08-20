import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User.js';
import { ClassMember } from '../models/ClassMember.js';
import { SubjectMember } from '../models/SubjectMember.js';
import { Subject } from '../models/Subject.js';

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized. Authentication required.',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized to access this resource.`,
        code: 'FORBIDDEN',
      });
      return;
    }

    next();
  };
};

export const requireClassMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const classId = req.params.classId || req.params.id || req.body.classId;
    if (!classId) {
      next();
      return;
    }

    if (req.user?.role === 'ADMIN' || req.user?.role === 'FACULTY') {
      next();
      return;
    }

    const member = await ClassMember.findOne({
      classId,
      userId: req.user?.id,
    });

    if (!member) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You are not an enrolled member of this class.',
        code: 'NOT_CLASS_MEMBER',
      });
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
};

export const requireSubjectMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const subjectId = req.params.subjectId || req.params.id || req.body.subjectId;
    if (!subjectId) {
      next();
      return;
    }

    if (req.user?.role === 'ADMIN') {
      next();
      return;
    }

    // Check if user is the primary faculty, co-faculty, or subject member
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      res.status(404).json({
        success: false,
        message: 'Subject not found.',
        code: 'SUBJECT_NOT_FOUND',
      });
      return;
    }

    const isPrimary = subject.primaryFacultyId.toString() === req.user?.id;
    const isCoFaculty = subject.coFaculties.some((id) => id.toString() === req.user?.id);

    if (isPrimary || isCoFaculty) {
      next();
      return;
    }

    // For students (and any other role), check SubjectMember enrollment
    const member = await SubjectMember.findOne({
      subjectId,
      userId: req.user?.id,
    });

    if (!member) {
      // Final fallback: If this user is any kind of FACULTY, check if they have class membership in this subject's class
      if (req.user?.role === 'FACULTY') {
        const classId = subject.classId;
        if (classId) {
          const classMember = await ClassMember.findOne({ classId, userId: req.user?.id });
          if (classMember) {
            next();
            return;
          }
        }
      }

      res.status(403).json({
        success: false,
        message: 'Access denied. You are not enrolled in this subject.',
        code: 'NOT_SUBJECT_MEMBER',
      });
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
};

export const requireSubjectFaculty = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const subjectId = req.params.subjectId || req.params.id || req.body.subjectId;
    if (!subjectId) {
      next();
      return;
    }

    if (req.user?.role === 'ADMIN') {
      next();
      return;
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      res.status(404).json({
        success: false,
        message: 'Subject not found.',
        code: 'SUBJECT_NOT_FOUND',
      });
      return;
    }

    const isPrimary = subject.primaryFacultyId.toString() === req.user?.id;
    const isCoFaculty = subject.coFaculties.some((id) => id.toString() === req.user?.id);

    if (!isPrimary && !isCoFaculty) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Only authorized faculty members can perform this action.',
        code: 'FORBIDDEN_NOT_FACULTY',
      });
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
};

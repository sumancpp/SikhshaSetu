import { Types } from 'mongoose';
import { ClassComment, IClassComment, CommentVisibility } from '../models/ClassComment.js';
import { Class } from '../models/Class.js';
import { ClassMember } from '../models/ClassMember.js';
import { UserRole } from '../models/User.js';
import { emitToClass, emitToUser } from '../config/socket.js';

export class ClassCommentService {
  /**
   * Create a new class comment with granular privacy controls
   */
  static async createComment(
    userId: string,
    userRole: UserRole,
    classId: string,
    data: {
      content: string;
      visibility?: CommentVisibility;
      targetUserIds?: string[];
      attachments?: { fileName: string; fileUrl: string; fileSize: number }[];
    }
  ): Promise<IClassComment> {
    const classDoc = await Class.findById(classId);
    if (!classDoc) throw new Error('Class not found');

    // Verify membership if student
    if (userRole === 'STUDENT') {
      const isMember = await ClassMember.findOne({ classId, userId });
      if (!isMember) throw new Error('You are not an enrolled member of this class.');
    }

    const visibility: CommentVisibility = data.visibility || 'ALL';
    const targetUserIds = (data.targetUserIds || []).map((id) => new Types.ObjectId(id));

    const comment = await ClassComment.create({
      classId: new Types.ObjectId(classId),
      authorId: new Types.ObjectId(userId),
      authorRole: userRole,
      content: data.content.trim(),
      visibility,
      targetUserIds,
      attachments: data.attachments || [],
    });

    const populated = await ClassComment.findById(comment._id)
      .populate('authorId', 'name email avatar role department studentId')
      .populate('targetUserIds', 'name email avatar role studentId');

    // Real-time Notification Dispatching via WebSockets
    if (visibility === 'ALL') {
      emitToClass(classId, 'class:comment:new', populated);
    } else if (visibility === 'TEACHER_ONLY') {
      // Notify all faculty members of the class + author
      const facultyMembers = await ClassMember.find({
        classId,
        role: { $in: ['FACULTY', 'ADMIN'] },
      });
      facultyMembers.forEach((fm) => {
        emitToUser(fm.userId.toString(), 'class:comment:new', populated);
      });
      if (classDoc.createdBy) {
        emitToUser(classDoc.createdBy.toString(), 'class:comment:new', populated);
      }
      emitToUser(userId, 'class:comment:new', populated);
    } else if (visibility === 'SELECTED') {
      // Notify specific targeted users + author
      targetUserIds.forEach((tId) => {
        emitToUser(tId.toString(), 'class:comment:new', populated);
      });
      emitToUser(userId, 'class:comment:new', populated);
    }

    return (populated || comment) as IClassComment;
  }

  /**
   * Get class comments accessible to the current user
   */
  static async getComments(
    userId: string,
    userRole: UserRole,
    classId: string,
    options: { filter?: 'ALL' | 'PRIVATE' | 'MY'; limit?: number } = {}
  ): Promise<any[]> {
    const classDoc = await Class.findById(classId);
    if (!classDoc) throw new Error('Class not found');

    const uId = new Types.ObjectId(userId);
    let query: any = { classId: new Types.ObjectId(classId) };

    if (userRole === 'ADMIN' || userRole === 'FACULTY') {
      // Faculty & Admins can see all comments in the class
      if (options.filter === 'PRIVATE') {
        query.visibility = { $in: ['TEACHER_ONLY', 'SELECTED'] };
      } else if (options.filter === 'MY') {
        query.authorId = uId;
      }
    } else {
      // Students can only see:
      // 1. Public comments ('ALL')
      // 2. Comments they authored (including private inquiry to teacher)
      // 3. Comments where they are targeted ('SELECTED')
      const studentVisibilityFilter = {
        $or: [
          { visibility: 'ALL' },
          { authorId: uId },
          { visibility: 'SELECTED', targetUserIds: uId },
        ],
      };

      if (options.filter === 'PRIVATE') {
        query = {
          classId: new Types.ObjectId(classId),
          $or: [
            { authorId: uId, visibility: { $in: ['TEACHER_ONLY', 'SELECTED'] } },
            { targetUserIds: uId, visibility: 'SELECTED' },
          ],
        };
      } else if (options.filter === 'MY') {
        query = {
          classId: new Types.ObjectId(classId),
          authorId: uId,
        };
      } else {
        query = {
          classId: new Types.ObjectId(classId),
          ...studentVisibilityFilter,
        };
      }
    }

    const comments = await ClassComment.find(query)
      .sort({ createdAt: -1 })
      .limit(options.limit || 100)
      .populate('authorId', 'name email avatar role department studentId')
      .populate('targetUserIds', 'name email avatar role studentId');

    return comments;
  }

  /**
   * Delete comment
   */
  static async deleteComment(commentId: string, userId: string, userRole: UserRole): Promise<boolean> {
    const comment = await ClassComment.findById(commentId);
    if (!comment) throw new Error('Comment not found');

    if (userRole !== 'ADMIN' && comment.authorId.toString() !== userId) {
      throw new Error('Not authorized to delete this comment.');
    }

    await ClassComment.findByIdAndDelete(commentId);
    return true;
  }
}

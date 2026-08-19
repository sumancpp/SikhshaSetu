import { Request, Response, NextFunction } from 'express';
import { Class } from '../models/Class.js';
import { Subject } from '../models/Subject.js';
import { Material } from '../models/Material.js';
import { Assignment } from '../models/Assignment.js';
import { Challenge } from '../models/Challenge.js';
import { ForumPost } from '../models/ForumPost.js';

export class SearchController {
  static async globalSearch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = (req.query.q as string || '').trim();
      if (!query || query.length < 2) {
        res.status(200).json({
          success: true,
          data: {
            classes: [],
            subjects: [],
            materials: [],
            assignments: [],
            challenges: [],
            forumPosts: [],
          },
        });
        return;
      }

      const regex = new RegExp(query, 'i');

      const [classes, subjects, materials, assignments, challenges, forumPosts] = await Promise.all([
        Class.find({
          $or: [{ name: regex }, { code: regex }, { department: regex }],
          isArchived: false,
        })
          .limit(5)
          .select('name code academicYear department bannerImage'),

        Subject.find({
          $or: [{ name: regex }, { code: regex }, { description: regex }],
          isArchived: false,
        })
          .limit(5)
          .populate('classId', 'name code')
          .select('name code classId semester subjectImage'),

        Material.find({
          $or: [{ title: regex }, { description: regex }, { tags: regex }],
        })
          .limit(5)
          .populate('subjectId', 'name code')
          .select('title type subjectId fileName fileSize'),

        Assignment.find({
          $or: [{ title: regex }, { description: regex }],
        })
          .limit(5)
          .populate('subjectId', 'name code')
          .select('title dueDate subjectId maxMarks rewardPoints'),

        Challenge.find({
          $or: [{ title: regex }, { description: regex }],
          isActive: true,
        })
          .limit(5)
          .select('title category difficulty rewardPoints timeLimitMinutes'),

        ForumPost.find({
          $or: [{ title: regex }, { description: regex }, { tags: regex }],
          isHidden: false,
        })
          .limit(5)
          .select('title tags upvotesCount answersCount hasAcceptedAnswer classId subjectId'),
      ]);

      res.status(200).json({
        success: true,
        data: {
          classes,
          subjects,
          materials,
          assignments,
          challenges,
          forumPosts,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

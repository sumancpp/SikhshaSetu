import { Types } from 'mongoose';
import { ForumPost, IForumPost } from '../models/ForumPost.js';
import { ForumAnswer, IForumAnswer } from '../models/ForumAnswer.js';
import { Vote } from '../models/Vote.js';
import { Notification } from '../models/Notification.js';
import { Subject } from '../models/Subject.js';
import { ClassMember } from '../models/ClassMember.js';
import { PointsService } from './points.service.js';
import { emitToForum, emitToSubject, emitToClass, emitToUser } from '../config/socket.js';
import { UserRole } from '../models/User.js';

export class ForumService {
  static async createPost(
    authorId: string,
    authorRole: UserRole,
    data: {
      classId?: string;
      subjectId?: string;
      title: string;
      description: string;
      tags?: string[];
      attachments?: string[];
      audience?: 'ALL' | 'DEPARTMENT_ONLY' | 'FACULTY_AND_PARENTS' | 'FACULTY_ONLY';
      targetDepartment?: string;
    }
  ): Promise<IForumPost> {
    const audience = data.audience || 'ALL';

    // Students cannot post to restricted Faculty/Parents boards
    if (authorRole === 'STUDENT' && (audience === 'FACULTY_AND_PARENTS' || audience === 'FACULTY_ONLY')) {
      throw new Error('Students are not authorized to post in the Faculty & Parents exclusive board.');
    }

    let classId = data.classId;
    if (!classId && data.subjectId) {
      const subject = await Subject.findById(data.subjectId);
      if (subject) {
        classId = typeof subject.classId === 'object' ? (subject.classId as any)._id : subject.classId;
      }
    }
    if (!classId && audience !== 'FACULTY_AND_PARENTS') {
      const userMember = await ClassMember.findOne({ userId: authorId });
      if (userMember) {
        classId = userMember.classId.toString();
      }
    }

    const post = await ForumPost.create({
      ...data,
      classId: classId || undefined,
      authorId,
      authorRole,
      audience,
      targetDepartment: data.targetDepartment || '',
      tags: data.tags || [],
      attachments: data.attachments || [],
    });

    const populated = await ForumPost.findById(post._id).populate('authorId', 'name email avatar role department');

    // Award initial question points
    await PointsService.awardPoints(authorId, 'FORUM_POST', 5, `Posted question: "${data.title}"`, post._id);

    if (data.subjectId) {
      emitToSubject(data.subjectId, 'forum:post-created', populated);
    } else if (classId) {
      emitToClass(classId, 'forum:post-created', populated);
    }

    return (populated || post) as IForumPost;
  }

  static async getPosts(
    options: {
      classId?: string;
      subjectId?: string;
      search?: string;
      tag?: string;
      filter?: 'all' | 'solved' | 'unanswered' | 'trending';
      sortBy?: 'newest' | 'upvotes' | 'answers';
      page?: number;
      limit?: number;
      audience?: 'ALL' | 'DEPARTMENT_ONLY' | 'FACULTY_AND_PARENTS' | 'FACULTY_ONLY';
      department?: string;
      userRole?: UserRole;
      userDepartment?: string;
    } = {}
  ): Promise<{ posts: any[]; total: number; page: number; pages: number }> {
    const filterQuery: any = { isHidden: false };

    // Role-based privacy enforcement
    if (options.userRole === 'STUDENT') {
      // Students can NEVER see Faculty/Parents exclusive posts
      filterQuery.audience = { $nin: ['FACULTY_AND_PARENTS', 'FACULTY_ONLY'] };

      // Department isolation: If post is department-specific, only show if student belongs to that department
      if (options.userDepartment) {
        filterQuery.$and = filterQuery.$and || [];
        filterQuery.$and.push({
          $or: [
            { audience: 'ALL' },
            { audience: 'DEPARTMENT_ONLY', targetDepartment: { $in: [options.userDepartment, ''] } },
            { targetDepartment: { $exists: false } },
            { targetDepartment: '' },
          ],
        });
      }
    } else if (options.audience) {
      filterQuery.audience = options.audience;
    }

    if (options.department) {
      filterQuery.targetDepartment = options.department;
    }

    if (options.classId) filterQuery.classId = options.classId;
    if (options.subjectId) filterQuery.subjectId = options.subjectId;

    if (options.tag) {
      filterQuery.tags = options.tag.toLowerCase().trim();
    }

    if (options.search) {
      const regex = new RegExp(options.search, 'i');
      filterQuery.$or = [{ title: regex }, { description: regex }, { tags: regex }];
    }

    if (options.filter === 'solved') {
      filterQuery.hasAcceptedAnswer = true;
    } else if (options.filter === 'unanswered') {
      filterQuery.answersCount = 0;
    }

    let sort: any = { createdAt: -1 };
    if (options.sortBy === 'upvotes' || options.filter === 'trending') {
      sort = { upvotesCount: -1, answersCount: -1, createdAt: -1 };
    } else if (options.sortBy === 'answers') {
      sort = { answersCount: -1, createdAt: -1 };
    }

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, options.limit || 20);
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      ForumPost.find(filterQuery)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('authorId', 'name email avatar role department')
        .populate('subjectId', 'name code')
        .populate('classId', 'name code'),
      ForumPost.countDocuments(filterQuery),
    ]);

    return {
      posts,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    };
  }

  static async getPostDetail(postId: string, currentUserId?: string, userRole?: UserRole): Promise<any> {
    const post = await ForumPost.findById(postId)
      .populate('authorId', 'name email avatar role department points')
      .populate('subjectId', 'name code')
      .populate('classId', 'name code');

    if (!post || post.isHidden) {
      throw new Error('Discussion post not found.');
    }

    // Role-based authorization for details
    if (
      userRole === 'STUDENT' &&
      (post.audience === 'FACULTY_AND_PARENTS' || post.audience === 'FACULTY_ONLY')
    ) {
      throw new Error('You do not have authorization to view the Faculty & Parents discussion board.');
    }

    const answers = await ForumAnswer.find({ postId })
      .sort({ isAccepted: -1, upvotesCount: -1, createdAt: 1 })
      .populate('authorId', 'name email avatar role department points');

    // Attach current user's votes if authenticated
    let userPostVote = 0;
    let userAnswerVotes: Record<string, number> = {};

    if (currentUserId) {
      const votes = await Vote.find({
        userId: currentUserId,
        targetId: { $in: [post._id, ...answers.map((a) => a._id)] },
      });

      votes.forEach((v) => {
        if (v.targetType === 'POST') {
          userPostVote = v.voteValue;
        } else {
          userAnswerVotes[v.targetId.toString()] = v.voteValue;
        }
      });
    }

    const enrichedAnswers = answers.map((a) => ({
      ...a.toObject(),
      userVote: userAnswerVotes[a._id.toString()] || 0,
    }));

    return {
      post: {
        ...post.toObject(),
        userVote: userPostVote,
      },
      answers: enrichedAnswers,
    };
  }

  static async createAnswer(
    authorId: string,
    authorRole: UserRole,
    postId: string,
    content: string
  ): Promise<IForumAnswer> {
    const post = await ForumPost.findById(postId);
    if (!post) throw new Error('Question post not found.');

    if (post.isLocked) {
      throw new Error('This discussion thread has been locked.');
    }

    const answer = await ForumAnswer.create({
      postId: post._id,
      classId: post.classId,
      subjectId: post.subjectId,
      content,
      authorId,
      authorRole,
    });

    // Increment answersCount on post
    post.answersCount += 1;
    await post.save();

    const populatedAnswer = await ForumAnswer.findById(answer._id).populate(
      'authorId',
      'name email avatar role department'
    );

    // Award answer points
    await PointsService.awardPoints(authorId, 'FORUM_ANSWER', 10, `Answered question: "${post.title}"`, post._id);

    // Real-time broadcast to post viewers
    emitToForum(postId, 'forum:answer-created', populatedAnswer);

    // Notify question author if different user
    if (post.authorId.toString() !== authorId) {
      const notif = await Notification.create({
        recipientId: post.authorId,
        senderId: new Types.ObjectId(authorId),
        type: 'FORUM_ANSWER',
        title: 'New Answer on Your Question',
        message: `Someone answered: "${post.title.slice(0, 45)}..."`,
        referenceUrl: `/forum/${postId}`,
        referenceId: post._id,
      });

      emitToUser(post.authorId.toString(), 'notification:new', notif);
    }

    return populatedAnswer || answer;
  }

  static async markAcceptedAnswer(postId: string, answerId: string, userId: string, userRole: UserRole): Promise<void> {
    const post = await ForumPost.findById(postId);
    if (!post) throw new Error('Post not found.');

    const isAuthor = post.authorId.toString() === userId;
    const isModerator = userRole === 'ADMIN' || userRole === 'FACULTY';

    if (!isAuthor && !isModerator) {
      throw new Error('Only the question author or faculty can accept an answer.');
    }

    // Reset existing accepted answers for this post
    await ForumAnswer.updateMany({ postId: post._id }, { $set: { isAccepted: false } });

    const acceptedAnswer = await ForumAnswer.findByIdAndUpdate(
      answerId,
      { $set: { isAccepted: true } },
      { new: true }
    ).populate('authorId', 'name email');

    if (!acceptedAnswer) throw new Error('Answer not found.');

    post.hasAcceptedAnswer = true;
    await post.save();

    // Award bonus points to the answer author
    await PointsService.awardPoints(
      acceptedAnswer.authorId._id,
      'FORUM_ACCEPTED',
      40,
      `Answer marked as accepted solution for: "${post.title}"`,
      post._id
    );

    // Notify answer author
    const notif = await Notification.create({
      recipientId: acceptedAnswer.authorId._id,
      senderId: new Types.ObjectId(userId),
      type: 'ANSWER_ACCEPTED',
      title: 'Answer Accepted as Solution! 🎉',
      message: `Your answer was marked as the accepted solution for: "${post.title}" (+40 pts)`,
      referenceUrl: `/forum/${postId}`,
      referenceId: post._id,
    });

    emitToUser(acceptedAnswer.authorId._id.toString(), 'notification:new', notif);
    emitToForum(postId, 'forum:answer-accepted', { postId, answerId });
  }

  static async handleVote(
    userId: string,
    targetType: 'POST' | 'ANSWER',
    targetId: string,
    voteValue: number // 1, -1, or 0 (remove)
  ): Promise<{ upvotesCount: number; downvotesCount: number; userVote: number }> {
    const existingVote = await Vote.findOne({ userId, targetId });

    if (voteValue === 0) {
      // Remove vote
      if (existingVote) {
        await Vote.deleteOne({ _id: existingVote._id });
      }
    } else {
      // Upsert vote
      await Vote.findOneAndUpdate(
        { userId, targetId },
        { $set: { targetType, voteValue } },
        { upsert: true, new: true }
      );
    }

    // Recalculate upvotes and downvotes from source of truth
    const upvotesCount = await Vote.countDocuments({ targetId, voteValue: 1 });
    const downvotesCount = await Vote.countDocuments({ targetId, voteValue: -1 });

    if (targetType === 'POST') {
      const post = await ForumPost.findByIdAndUpdate(
        targetId,
        { $set: { upvotesCount, downvotesCount } },
        { new: true }
      );
      if (post) {
        emitToForum(targetId, 'forum:vote-updated', { targetType, targetId, upvotesCount, downvotesCount });
      }
    } else {
      const answer = await ForumAnswer.findByIdAndUpdate(
        targetId,
        { $set: { upvotesCount, downvotesCount } },
        { new: true }
      );
      if (answer) {
        emitToForum(answer.postId.toString(), 'forum:vote-updated', {
          targetType,
          targetId,
          upvotesCount,
          downvotesCount,
        });

        // If upvoted (+1), award 5 points to answer author if upvote threshold met
        if (voteValue === 1 && upvotesCount % 3 === 0) {
          await PointsService.awardPoints(
            answer.authorId,
            'FORUM_UPVOTE',
            5,
            `Your answer received multiple upvotes!`,
            answer._id
          );
        }
      }
    }

    return { upvotesCount, downvotesCount, userVote: voteValue };
  }

  static async getTrendingTags(classId?: string): Promise<{ tag: string; count: number }[]> {
    const match: any = { isHidden: false };
    if (classId) match.classId = new Types.ObjectId(classId);

    const tags = await ForumPost.aggregate([
      { $match: match },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);

    return tags.map((t) => ({ tag: t._id, count: t.count }));
  }
}

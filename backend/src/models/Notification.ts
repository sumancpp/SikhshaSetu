import mongoose, { Document, Schema, Types } from 'mongoose';

export type NotificationType =
  | 'CLASS_INVITE'
  | 'SUBJECT_INVITE'
  | 'ASSIGNMENT_CREATED'
  | 'ASSIGNMENT_GRADED'
  | 'QUIZ_CREATED'
  | 'CHALLENGE_ACTIVE'
  | 'FORUM_ANSWER'
  | 'ANSWER_ACCEPTED'
  | 'ANSWER_UPVOTED'
  | 'POINTS_EARNED'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'ACADEMIC_ALERT'
  | 'SYSTEM_ANNOUNCEMENT';

export interface INotification extends Document {
  recipientId: Types.ObjectId;
  senderId?: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  referenceUrl?: string;
  referenceId?: Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      required: true,
      enum: [
        'CLASS_INVITE',
        'SUBJECT_INVITE',
        'ASSIGNMENT_CREATED',
        'ASSIGNMENT_GRADED',
        'QUIZ_CREATED',
        'CHALLENGE_ACTIVE',
        'FORUM_ANSWER',
        'ANSWER_ACCEPTED',
        'ANSWER_UPVOTED',
        'POINTS_EARNED',
        'ACHIEVEMENT_UNLOCKED',
        'ACADEMIC_ALERT',
        'SYSTEM_ANNOUNCEMENT',
      ],
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    referenceUrl: { type: String, default: '' },
    referenceId: { type: Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

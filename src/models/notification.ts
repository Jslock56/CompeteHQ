/**
 * Notification model for the inbox/message center
 */
import { Schema, model, models, Model } from 'mongoose';

export type NotificationType = 
  | 'invitation' 
  | 'request' 
  | 'approval' 
  | 'denial' 
  | 'team_update' 
  | 'game_reminder'
  | 'practice_reminder'
  | 'system';

export interface INotification {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string; // Could be teamId, invitationId, etc.
  actionUrl?: string; // URL to navigate to when clicking notification
  createdAt: number;
  read: boolean;
  expiresAt?: number; // Optional expiration time
}

const notificationSchema = new Schema<INotification>({
  userId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'invitation', 
      'request', 
      'approval', 
      'denial', 
      'team_update', 
      'game_reminder',
      'practice_reminder',
      'system'
    ]
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedId: {
    type: String
  },
  actionUrl: {
    type: String
  },
  createdAt: {
    type: Number,
    default: () => Date.now()
  },
  read: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Number
  }
});

// Indexes
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 }); // For fetching unread notifications
notificationSchema.index({ userId: 1, createdAt: -1 }); // For fetching all notifications
notificationSchema.index({ expiresAt: 1 }); // For cleanup of expired notifications

// Helper method to check if expired
notificationSchema.methods.isExpired = function(): boolean {
  if (!this.expiresAt) {
    return false;
  }
  return Date.now() > this.expiresAt;
};

// Define the model
export const Notification: Model<INotification> = models.Notification || 
  model<INotification>('Notification', notificationSchema);

export default Notification;
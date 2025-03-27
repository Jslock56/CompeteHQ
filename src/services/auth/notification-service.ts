/**
 * Notification service for handling the inbox/message center
 */
import { Notification, INotification, NotificationType } from '../../models/notification';

class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    relatedId?: string,
    actionUrl?: string,
    expiresInDays?: number
  ): Promise<INotification> {
    const expiresAt = expiresInDays ? Date.now() + (expiresInDays * 24 * 60 * 60 * 1000) : undefined;
    
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      relatedId,
      actionUrl,
      createdAt: Date.now(),
      read: false,
      expiresAt
    });
    
    await notification.save();
    return notification;
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    unreadOnly: boolean = false
  ): Promise<{
    notifications: INotification[];
    total: number;
    unreadCount: number;
  }> {
    // Query builder
    const query: any = { userId };
    
    // Filter for unread notifications if specified
    if (unreadOnly) {
      query.read = false;
    }
    
    // Get total count
    const total = await Notification.countDocuments(query);
    
    // Get unread count
    const unreadCount = await Notification.countDocuments({
      userId,
      read: false
    });
    
    // Get notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);
    
    return {
      notifications,
      total,
      unreadCount
    };
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        userId
      });
      
      if (!notification) {
        return {
          success: false,
          message: 'Notification not found'
        };
      }
      
      notification.read = true;
      await notification.save();
      
      return {
        success: true,
        message: 'Notification marked as read'
      };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to mark notification as read'
      };
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(
    userId: string
  ): Promise<{
    success: boolean;
    message: string;
    count: number;
  }> {
    try {
      const result = await Notification.updateMany(
        { userId, read: false },
        { $set: { read: true } }
      );
      
      return {
        success: true,
        message: 'All notifications marked as read',
        count: result.modifiedCount
      };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to mark all notifications as read',
        count: 0
      };
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const result = await Notification.findOneAndDelete({
        _id: notificationId,
        userId
      });
      
      if (!result) {
        return {
          success: false,
          message: 'Notification not found'
        };
      }
      
      return {
        success: true,
        message: 'Notification deleted'
      };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete notification'
      };
    }
  }

  /**
   * Create a system notification for all team members
   */
  async notifyTeamMembers(
    teamId: string,
    title: string,
    message: string,
    actionUrl?: string,
    excludeUserIds: string[] = []
  ): Promise<{
    success: boolean;
    message: string;
    count: number;
  }> {
    try {
      // Import here to avoid circular dependencies
      const { default: TeamMembership } = await import('../../models/team-membership');
      
      // Get all active team members
      const memberships = await TeamMembership.find({
        teamId,
        status: 'active',
        userId: { $nin: excludeUserIds }
      });
      
      const userIds = memberships.map(m => m.userId);
      
      // Create a notification for each user
      let count = 0;
      for (const userId of userIds) {
        await this.createNotification(
          userId,
          'team_update',
          title,
          message,
          teamId,
          actionUrl
        );
        count++;
      }
      
      return {
        success: true,
        message: `Notifications sent to ${count} team members`,
        count
      };
    } catch (error) {
      console.error('Error notifying team members:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to notify team members',
        count: 0
      };
    }
  }

  /**
   * Clean up expired notifications
   * This would typically be run by a scheduled job
   */
  async cleanupExpiredNotifications(): Promise<number> {
    try {
      const result = await Notification.deleteMany({
        expiresAt: { $lt: Date.now() }
      });
      
      return result.deletedCount;
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
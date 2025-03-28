/**
 * Email service for sending various types of emails
 */
import nodemailer from 'nodemailer';
import { IInvitation } from '../../models/invitation';
import { IUser } from '../../models/user';

// Email configuration
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587', 10);
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@competehq.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Create a nodemailer transporter
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465, // true for 465, false for other ports
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  // For development - allow self-signed certs
  ...(process.env.NODE_ENV === 'development' && {
    tls: {
      rejectUnauthorized: false,
    },
  }),
});

class EmailService {
  /**
   * Send an invitation email to join a team
   */
  async sendInvitationEmail(invitation: IInvitation): Promise<boolean> {
    try {
      const inviteUrl = `${APP_URL}/auth/join?token=${invitation.token}`;
      
      await transporter.sendMail({
        from: `"CompeteHQ" <${EMAIL_FROM}>`,
        to: invitation.email,
        subject: `You're invited to join ${invitation.teamName} on CompeteHQ`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Team Invitation</h2>
            <p>Hello,</p>
            <p>${invitation.inviterName || 'A coach'} has invited you to join <strong>${invitation.teamName}</strong> on CompeteHQ as a ${this.getRoleName(invitation.role)}.</p>
            <p>CompeteHQ is a baseball team management application that helps coaches manage lineups, track player positions, and organize practices.</p>
            <div style="margin: 30px 0;">
              <a href="${inviteUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Accept Invitation</a>
            </div>
            <p>This invitation will expire in 7 days.</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">CompeteHQ - Baseball Team Management</p>
          </div>
        `,
        text: `
          Team Invitation
          
          Hello,
          
          ${invitation.inviterName || 'A coach'} has invited you to join ${invitation.teamName} on CompeteHQ as a ${this.getRoleName(invitation.role)}.
          
          CompeteHQ is a baseball team management application that helps coaches manage lineups, track player positions, and organize practices.
          
          Accept the invitation by visiting this link:
          ${inviteUrl}
          
          This invitation will expire in 7 days.
          
          If you didn't expect this invitation, you can safely ignore this email.
          
          CompeteHQ - Baseball Team Management
        `,
      });
      
      return true;
    } catch (error) {
      console.error('Error sending invitation email:', error);
      return false;
    }
  }

  /**
   * Send a verification email to a new user
   */
  async sendVerificationEmail(user: IUser, token: string): Promise<boolean> {
    try {
      const verifyUrl = `${APP_URL}/auth/verify?token=${token}`;
      
      await transporter.sendMail({
        from: `"CompeteHQ" <${EMAIL_FROM}>`,
        to: user.email,
        subject: 'Verify your email address for CompeteHQ',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Email Verification</h2>
            <p>Hello ${user.name},</p>
            <p>Thank you for registering with CompeteHQ. Please verify your email address by clicking the button below:</p>
            <div style="margin: 30px 0;">
              <a href="${verifyUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email Address</a>
            </div>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create this account, you can safely ignore this email.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">CompeteHQ - Baseball Team Management</p>
          </div>
        `,
        text: `
          Email Verification
          
          Hello ${user.name},
          
          Thank you for registering with CompeteHQ. Please verify your email address by visiting this link:
          ${verifyUrl}
          
          This link will expire in 24 hours.
          
          If you didn't create this account, you can safely ignore this email.
          
          CompeteHQ - Baseball Team Management
        `,
      });
      
      return true;
    } catch (error) {
      console.error('Error sending verification email:', error);
      return false;
    }
  }

  /**
   * Send a password reset email
   */
  async sendPasswordResetEmail(user: IUser, token: string): Promise<boolean> {
    try {
      const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`;
      
      await transporter.sendMail({
        from: `"CompeteHQ" <${EMAIL_FROM}>`,
        to: user.email,
        subject: 'Reset your CompeteHQ password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Password Reset</h2>
            <p>Hello ${user.name},</p>
            <p>We received a request to reset your CompeteHQ password. Click the button below to set a new password:</p>
            <div style="margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
            </div>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">CompeteHQ - Baseball Team Management</p>
          </div>
        `,
        text: `
          Password Reset
          
          Hello ${user.name},
          
          We received a request to reset your CompeteHQ password. Please visit this link to set a new password:
          ${resetUrl}
          
          This link will expire in 1 hour.
          
          If you didn't request a password reset, you can safely ignore this email.
          
          CompeteHQ - Baseball Team Management
        `,
      });
      
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }

  /**
   * Send a notification email about being added to a team
   */
  async sendTeamAddedEmail(user: IUser, teamName: string): Promise<boolean> {
    try {
      const teamUrl = `${APP_URL}/teams`;
      
      await transporter.sendMail({
        from: `"CompeteHQ" <${EMAIL_FROM}>`,
        to: user.email,
        subject: `You've been added to ${teamName} on CompeteHQ`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Team Membership</h2>
            <p>Hello ${user.name},</p>
            <p>You have been added to <strong>${teamName}</strong> on CompeteHQ.</p>
            <p>You can now access the team's information, lineups, and other features based on your assigned role.</p>
            <div style="margin: 30px 0;">
              <a href="${teamUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View My Teams</a>
            </div>
            <hr style="border: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">CompeteHQ - Baseball Team Management</p>
          </div>
        `,
        text: `
          Team Membership
          
          Hello ${user.name},
          
          You have been added to ${teamName} on CompeteHQ.
          
          You can now access the team's information, lineups, and other features based on your assigned role.
          
          View your teams by visiting:
          ${teamUrl}
          
          CompeteHQ - Baseball Team Management
        `,
      });
      
      return true;
    } catch (error) {
      console.error('Error sending team added email:', error);
      return false;
    }
  }

  /**
   * Send a notification email about a join request approval
   */
  async sendJoinRequestApprovedEmail(user: IUser, teamName: string): Promise<boolean> {
    try {
      const teamUrl = `${APP_URL}/teams`;
      
      await transporter.sendMail({
        from: `"CompeteHQ" <${EMAIL_FROM}>`,
        to: user.email,
        subject: `Your request to join ${teamName} has been approved`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Join Request Approved</h2>
            <p>Hello ${user.name},</p>
            <p>Good news! Your request to join <strong>${teamName}</strong> on CompeteHQ has been approved.</p>
            <p>You now have access to the team's information based on your assigned role.</p>
            <div style="margin: 30px 0;">
              <a href="${teamUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View My Teams</a>
            </div>
            <hr style="border: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">CompeteHQ - Baseball Team Management</p>
          </div>
        `,
        text: `
          Join Request Approved
          
          Hello ${user.name},
          
          Good news! Your request to join ${teamName} on CompeteHQ has been approved.
          
          You now have access to the team's information based on your assigned role.
          
          View your teams by visiting:
          ${teamUrl}
          
          CompeteHQ - Baseball Team Management
        `,
      });
      
      return true;
    } catch (error) {
      console.error('Error sending join request approved email:', error);
      return false;
    }
  }

  /**
   * Helper method to get readable role name
   */
  private getRoleName(role: string): string {
    switch (role) {
      case 'headCoach':
        return 'Head Coach';
      case 'assistant':
        return 'Assistant Coach';
      case 'fan':
        return 'Parent/Fan';
      default:
        return 'Team Member';
    }
  }

  /**
   * Verify transporter connection
   */
  async verifyConnection(): Promise<boolean> {
    try {
      // Only verify in production to avoid unnecessary connection attempts in development
      if (process.env.NODE_ENV === 'production') {
        await transporter.verify();
      }
      return true;
    } catch (error) {
      console.error('Email service connection error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export class CalendarController {
  private oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  async connect(req: AuthRequest, res: Response) {
    try {
      const scopes = ['https://www.googleapis.com/auth/calendar'];
      
      const authUrl = this.oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        state: req.user?.id, // Pass user ID in state
      });

      res.json({
        success: true,
        data: {
          authUrl,
        },
        message: 'Please visit the URL to authorize Google Calendar access',
      });
    } catch (error) {
      console.error('Connect calendar error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async callback(req: Request, res: Response) {
    try {
      const { code, state } = req.query;

      if (!code || !state) {
        return res.status(400).json({
          success: false,
          error: 'Missing authorization code or state',
        });
      }

      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code as string);
      this.oauth2Client.setCredentials(tokens);

      // Get user info
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const userInfo = await oauth2.userinfo.get();

      // Store tokens in database
      await prisma.googleCalendar.upsert({
        where: { unitId: 'default' }, // For now, use a default unit
        update: {
          calendarId: userInfo.data.email || 'primary',
          accessToken: tokens.access_token || '',
          refreshToken: tokens.refresh_token || '',
          expiresAt: new Date(tokens.expiry_date || Date.now() + 3600000),
        },
        create: {
          unitId: 'default',
          calendarId: userInfo.data.email || 'primary',
          accessToken: tokens.access_token || '',
          refreshToken: tokens.refresh_token || '',
          expiresAt: new Date(tokens.expiry_date || Date.now() + 3600000),
        },
      });

      res.json({
        success: true,
        message: 'Google Calendar connected successfully',
      });
    } catch (error) {
      console.error('Calendar callback error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to connect Google Calendar',
      });
    }
  }

  async disconnect(req: AuthRequest, res: Response) {
    try {
      await prisma.googleCalendar.deleteMany({});

      res.json({
        success: true,
        message: 'Google Calendar disconnected successfully',
      });
    } catch (error) {
      console.error('Disconnect calendar error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async syncUnit(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if unit exists
      const unit = await prisma.unit.findUnique({
        where: { id },
      });

      if (!unit) {
        return res.status(404).json({
          success: false,
          error: 'Unit not found',
        });
      }

      // Check if Google Calendar is connected
      const calendarConfig = await prisma.googleCalendar.findFirst();
      if (!calendarConfig) {
        return res.status(400).json({
          success: false,
          error: 'Google Calendar not connected',
        });
      }

      // Update unit with calendar ID
      const updatedUnit = await prisma.unit.update({
        where: { id },
        data: { calendarId: calendarConfig.calendarId },
        include: {
          _count: {
            select: {
              reservations: true,
              cleaningTasks: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: updatedUnit,
        message: 'Unit synced with Google Calendar successfully',
      });
    } catch (error) {
      console.error('Sync unit error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async getUnitEvents(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { fromDate, toDate } = req.query;

      // Check if unit exists and has calendar ID
      const unit = await prisma.unit.findUnique({
        where: { id },
        select: { id: true, name: true, code: true, calendarId: true },
      });

      if (!unit || !unit.calendarId) {
        return res.status(404).json({
          success: false,
          error: 'Unit not found or not synced with calendar',
        });
      }

      // Get calendar configuration
      const calendarConfig = await prisma.googleCalendar.findFirst();
      if (!calendarConfig) {
        return res.status(400).json({
          success: false,
          error: 'Google Calendar not connected',
        });
      }

      // Set up OAuth2 client
      this.oauth2Client.setCredentials({
        access_token: calendarConfig.accessToken,
        refresh_token: calendarConfig.refreshToken,
      });

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      // Get events
      const timeMin = fromDate ? new Date(fromDate as string) : new Date();
      const timeMax = toDate ? new Date(toDate as string) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      const response = await calendar.events.list({
        calendarId: unit.calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];

      res.json({
        success: true,
        data: {
          unit: {
            id: unit.id,
            name: unit.name,
            code: unit.code,
            calendarId: unit.calendarId,
          },
          events: events.map(event => ({
            id: event.id,
            summary: event.summary,
            description: event.description,
            start: event.start?.dateTime || event.start?.date,
            end: event.end?.dateTime || event.end?.date,
            status: event.status,
            htmlLink: event.htmlLink,
          })),
        },
      });
    } catch (error) {
      console.error('Get unit events error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  async getStatus(req: Request, res: Response) {
    try {
      const calendarConfig = await prisma.googleCalendar.findFirst();

      if (!calendarConfig) {
        return res.json({
          success: true,
          data: {
            connected: false,
            message: 'Google Calendar not connected',
          },
        });
      }

      // Check if token is expired
      const isExpired = new Date() >= calendarConfig.expiresAt;

      res.json({
        success: true,
        data: {
          connected: true,
          calendarId: calendarConfig.calendarId,
          expiresAt: calendarConfig.expiresAt,
          isExpired,
          message: isExpired ? 'Token expired, please reconnect' : 'Connected and active',
        },
      });
    } catch (error) {
      console.error('Get calendar status error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  // Helper method to create calendar event
  async createCalendarEvent(reservationId: string, unitId: string, eventData: any) {
    try {
      const unit = await prisma.unit.findUnique({
        where: { id: unitId },
        select: { calendarId: true },
      });

      if (!unit?.calendarId) {
        return null; // Unit not synced with calendar
      }

      const calendarConfig = await prisma.googleCalendar.findFirst();
      if (!calendarConfig) {
        return null; // Calendar not connected
      }

      // Set up OAuth2 client
      this.oauth2Client.setCredentials({
        access_token: calendarConfig.accessToken,
        refresh_token: calendarConfig.refreshToken,
      });

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const event = await calendar.events.insert({
        calendarId: unit.calendarId,
        requestBody: eventData,
      });

      return event.data.id;
    } catch (error) {
      console.error('Create calendar event error:', error);
      return null;
    }
  }

  // Helper method to update calendar event
  async updateCalendarEvent(reservationId: string, unitId: string, eventId: string, eventData: any) {
    try {
      const unit = await prisma.unit.findUnique({
        where: { id: unitId },
        select: { calendarId: true },
      });

      if (!unit?.calendarId) {
        return false; // Unit not synced with calendar
      }

      const calendarConfig = await prisma.googleCalendar.findFirst();
      if (!calendarConfig) {
        return false; // Calendar not connected
      }

      // Set up OAuth2 client
      this.oauth2Client.setCredentials({
        access_token: calendarConfig.accessToken,
        refresh_token: calendarConfig.refreshToken,
      });

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      await calendar.events.update({
        calendarId: unit.calendarId,
        eventId,
        requestBody: eventData,
      });

      return true;
    } catch (error) {
      console.error('Update calendar event error:', error);
      return false;
    }
  }

  // Helper method to delete calendar event
  async deleteCalendarEvent(reservationId: string, unitId: string, eventId: string) {
    try {
      const unit = await prisma.unit.findUnique({
        where: { id: unitId },
        select: { calendarId: true },
      });

      if (!unit?.calendarId) {
        return false; // Unit not synced with calendar
      }

      const calendarConfig = await prisma.googleCalendar.findFirst();
      if (!calendarConfig) {
        return false; // Calendar not connected
      }

      // Set up OAuth2 client
      this.oauth2Client.setCredentials({
        access_token: calendarConfig.accessToken,
        refresh_token: calendarConfig.refreshToken,
      });

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      await calendar.events.delete({
        calendarId: unit.calendarId,
        eventId,
      });

      return true;
    } catch (error) {
      console.error('Delete calendar event error:', error);
      return false;
    }
  }
}

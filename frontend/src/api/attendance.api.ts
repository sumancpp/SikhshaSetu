import { apiClient } from './client';
import {
  ApiResponse,
  AttendanceSession,
  AttendanceRecord,
  LiveTokenResponse,
} from '../types';

export const attendanceApi = {
  // Faculty: Start a 5-minute dynamic attendance session with GPS
  createSession: async (
    classId: string,
    data: {
      title?: string;
      subjectId?: string;
      centerLatitude: number;
      centerLongitude: number;
      allowedRadiusMeters?: number;
      durationMinutes?: number;
    }
  ): Promise<ApiResponse<AttendanceSession>> => {
    const res = await apiClient.post<ApiResponse<AttendanceSession>>(
      `/attendance/class/${classId}/session`,
      data
    );
    return res.data;
  },

  // Faculty: Get current rotating HMAC QR token
  getLiveToken: async (sessionId: string): Promise<ApiResponse<LiveTokenResponse>> => {
    const res = await apiClient.get<ApiResponse<LiveTokenResponse>>(
      `/attendance/session/${sessionId}/live-token`
    );
    return res.data;
  },

  // Faculty: Get live session attendees & statistics
  getSessionDetails: async (
    sessionId: string
  ): Promise<
    ApiResponse<{
      session: AttendanceSession;
      records: AttendanceRecord[];
      totalEnrolledStudents: number;
      verifiedPresentCount: number;
      outOfRangeCount: number;
    }>
  > => {
    const res = await apiClient.get<
      ApiResponse<{
        session: AttendanceSession;
        records: AttendanceRecord[];
        totalEnrolledStudents: number;
        verifiedPresentCount: number;
        outOfRangeCount: number;
      }>
    >(`/attendance/session/${sessionId}`);
    return res.data;
  },

  // Faculty: Start a 5-minute dynamic attendance session for a subject with GPS
  createSubjectSession: async (
    subjectId: string,
    data: {
      title?: string;
      centerLatitude: number;
      centerLongitude: number;
      allowedRadiusMeters?: number;
      durationMinutes?: number;
    }
  ): Promise<ApiResponse<AttendanceSession>> => {
    const res = await apiClient.post<ApiResponse<AttendanceSession>>(
      `/attendance/subject/${subjectId}/session`,
      data
    );
    return res.data;
  },

  // Faculty / Student: Get subject attendance sessions history
  getSubjectHistory: async (subjectId: string): Promise<ApiResponse<AttendanceSession[]>> => {
    const res = await apiClient.get<ApiResponse<AttendanceSession[]>>(
      `/attendance/subject/${subjectId}/history`
    );
    return res.data;
  },

  // Faculty / Student: Get class attendance sessions history
  getClassHistory: async (classId: string): Promise<ApiResponse<AttendanceSession[]>> => {
    const res = await apiClient.get<ApiResponse<AttendanceSession[]>>(
      `/attendance/class/${classId}/history`
    );
    return res.data;
  },

  // Student: Submit dynamic QR token along with active mobile GPS
  submitAttendance: async (data: {
    sessionId: string;
    token: string;
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
    deviceFingerprint?: string;
  }): Promise<ApiResponse<AttendanceRecord>> => {
    const res = await apiClient.post<ApiResponse<AttendanceRecord>>('/attendance/submit', data);
    return res.data;
  },

  // Student: Get personal attendance logs
  getStudentHistory: async (params?: {
    classId?: string;
    subjectId?: string;
  }): Promise<
    ApiResponse<{
      records: AttendanceRecord[];
      totalPresent: number;
      attendancePercentage: number;
    }>
  > => {
    const res = await apiClient.get<
      ApiResponse<{
        records: AttendanceRecord[];
        totalPresent: number;
        attendancePercentage: number;
      }>
    >('/attendance/student/my-history', {
      params,
    });
    return res.data;
  },
};

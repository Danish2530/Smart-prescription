import crypto from 'crypto';

/**
 * Video Consultation Service Abstraction
 * Supports mock/development room sessions with seamless future provider integration (e.g., Daily.co, Twilio, Agora, Jitsi)
 */
class VideoService {
  constructor() {
    // In-memory or fallback meetings storage for mock/demo
    this.meetings = new Map();
  }

  /**
   * Create a unique secure video meeting room for an appointment
   */
  async createMeeting(appointmentId, doctorId, patientId) {
    const roomId = `room_${appointmentId}_${crypto.randomBytes(4).toString('hex')}`;
    const meeting = {
      roomId,
      appointmentId,
      doctorId,
      patientId,
      status: 'active',
      createdAt: new Date(),
      doctorToken: this.generateMeetingToken(roomId, doctorId, 'doctor'),
      patientToken: this.generateMeetingToken(roomId, patientId, 'patient'),
    };

    this.meetings.set(roomId, meeting);
    return meeting;
  }

  /**
   * Generate token or session credential for participant
   */
  generateMeetingToken(roomId, userId, role = 'patient') {
    const payload = `${roomId}:${userId}:${role}:${Date.now()}`;
    return crypto.createHash('sha256').update(payload).digest('hex').substring(0, 32);
  }

  /**
   * Retrieve meeting details by room ID or appointment ID
   */
  async getMeeting(identifier) {
    // Check by room ID
    if (this.meetings.has(identifier)) {
      return this.meetings.get(identifier);
    }

    // Check by appointment ID
    for (const meeting of this.meetings.values()) {
      if (meeting.appointmentId?.toString() === identifier?.toString()) {
        return meeting;
      }
    }

    // Fallback: generate a deterministic session for the appointment
    const generatedMeeting = {
      roomId: `room_${identifier}`,
      appointmentId: identifier,
      status: 'active',
      createdAt: new Date(),
      doctorToken: this.generateMeetingToken(`room_${identifier}`, 'doctor_user', 'doctor'),
      patientToken: this.generateMeetingToken(`room_${identifier}`, 'patient_user', 'patient'),
    };
    this.meetings.set(generatedMeeting.roomId, generatedMeeting);
    return generatedMeeting;
  }

  /**
   * Conclude a video consultation meeting
   */
  async endMeeting(roomId) {
    const meeting = this.meetings.get(roomId);
    if (meeting) {
      meeting.status = 'ended';
      meeting.endedAt = new Date();
      return meeting;
    }
    return { roomId, status: 'ended', endedAt: new Date() };
  }
}

export default new VideoService();

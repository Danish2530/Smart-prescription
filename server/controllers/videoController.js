import videoService from '../services/videoService.js';
import Appointment from '../models/Appointment.js';

// Helper: determine whether the authenticated user belongs
// to this appointment as either the patient or assigned doctor.
const getParticipantRole = (appointment, user) => {
  const userId = user?._id?.toString();

  if (!userId) {
    return null;
  }

  // Patient must be the exact patient assigned to this appointment.
  if (appointment.patientId?._id?.toString() === userId) {
    return 'patient';
  }

  // Doctor must be the doctor assigned to this appointment.
  if (appointment.doctorId?.userId?.toString() === userId) {
    return 'doctor';
  }

  return null;
};

// @desc    Get video meeting room and credentials for an appointment
// @route   GET /api/video/:appointmentId
// @access  Private
export const getVideoMeeting = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId)
      .populate('doctorId')
      .populate('patientId', 'name email');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.',
      });
    }

    // Video consultations only.
    if (appointment.type !== 'video') {
      return res.status(400).json({
        success: false,
        message: 'This appointment is not scheduled for video consultation.',
      });
    }

    // Verify that the authenticated user is actually part
    // of this appointment.
    const participantRole = getParticipantRole(appointment, req.user);

    if (!participantRole) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this video consultation.',
      });
    }

    // A video appointment should have a room associated with it.
    // If it does not, create one.
    let meeting;

    if (appointment.meetingRoomId) {
      meeting = await videoService.getMeeting(
        appointment.meetingRoomId
      );
    } else {
      meeting = await videoService.createMeeting(
        appointment._id,
        appointment.doctorId.userId,
        appointment.patientId._id
      );

      appointment.meetingRoomId = meeting.roomId;
      await appointment.save();
    }

    const token =
      participantRole === 'doctor'
        ? meeting.doctorToken
        : meeting.patientToken;

    res.json({
      success: true,
      meeting: {
        roomId: meeting.roomId,
        status: meeting.status,
        appointmentId: appointment._id,

        doctor: {
          name: appointment.doctorId?.name,
          specialization: appointment.doctorId?.specialization,
        },

        patient: {
          name: appointment.patientId?.name,
        },

        userRole: participantRole,
        token,
      },
    });
  } catch (error) {
    console.error('Error fetching video meeting:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve video session.',
    });
  }
};

// @desc    Create video meeting for appointment
// @route   POST /api/video/create
// @access  Private
export const createVideoMeeting = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID is required.',
      });
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate('doctorId')
      .populate('patientId', 'name email');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.',
      });
    }

    if (appointment.type !== 'video') {
      return res.status(400).json({
        success: false,
        message: 'This appointment is not scheduled for video consultation.',
      });
    }

    // Only the assigned patient or assigned doctor can create/access
    // the meeting.
    const participantRole = getParticipantRole(appointment, req.user);

    if (!participantRole) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to create this video consultation.',
      });
    }

    // Prevent unnecessary recreation of an existing meeting.
    if (appointment.meetingRoomId) {
      const existingMeeting = await videoService.getMeeting(
        appointment.meetingRoomId
      );

      return res.json({
        success: true,
        message: 'Video meeting already exists.',
        meeting: existingMeeting,
      });
    }

    const meeting = await videoService.createMeeting(
      appointment._id,
      appointment.doctorId.userId,
      appointment.patientId._id
    );

    appointment.meetingRoomId = meeting.roomId;
    await appointment.save();

    res.status(201).json({
      success: true,
      meeting,
    });
  } catch (error) {
    console.error('Error creating video meeting:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to create video meeting.',
    });
  }
};

// @desc    End video consultation session
// @route   POST /api/video/end
// @access  Private
export const endVideoMeeting = async (req, res) => {
  try {
    const { roomId, appointmentId } = req.body;

    if (!roomId || !appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID and appointment ID are required.',
      });
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate('doctorId')
      .populate('patientId', 'name email');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.',
      });
    }

    if (appointment.type !== 'video') {
      return res.status(400).json({
        success: false,
        message: 'This appointment is not a video consultation.',
      });
    }

    // Only participants of this appointment may end the session.
    const participantRole = getParticipantRole(appointment, req.user);

    if (!participantRole) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to end this video consultation.',
      });
    }

    // Prevent someone from ending an unrelated room.
    if (
      appointment.meetingRoomId &&
      appointment.meetingRoomId !== roomId
    ) {
      return res.status(403).json({
        success: false,
        message: 'This video room does not belong to the appointment.',
      });
    }

    const meeting = await videoService.endMeeting(roomId);

    // Completing the appointment should primarily be handled by
    // the queue/appointment lifecycle. We only mark the video
    // session as ended here.
    appointment.consultationEndedAt = new Date();

    if (appointment.status === 'in_consultation') {
      appointment.status = 'completed';
    }

    await appointment.save();

    res.json({
      success: true,
      message: 'Video consultation ended successfully.',
      meeting,
    });
  } catch (error) {
    console.error('Error ending video meeting:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to conclude video consultation.',
    });
  }
};
import videoService from '../services/videoService.js';
import Appointment from '../models/Appointment.js';

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

    if (appointment.type !== 'video') {
      return res.status(400).json({
        success: false,
        message: 'This appointment is not scheduled for video consultation.',
      });
    }

    const meeting = await videoService.getMeeting(appointment.meetingRoomId || appointment._id);

    const isDoctor = req.user.role === 'doctor' || appointment.doctorId?.userId?.toString() === req.user._id.toString();
    const token = isDoctor ? meeting.doctorToken : meeting.patientToken;

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
        userRole: isDoctor ? 'doctor' : 'patient',
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
    const appointment = await Appointment.findById(appointmentId).populate('doctorId');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.',
      });
    }

    const meeting = await videoService.createMeeting(
      appointment._id,
      appointment.doctorId.userId,
      appointment.patientId
    );

    appointment.meetingRoomId = meeting.roomId;
    await appointment.save();

    res.status(201).json({
      success: true,
      meeting,
    });
  } catch (error) {
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
    const meeting = await videoService.endMeeting(roomId);

    if (appointmentId) {
      await Appointment.findByIdAndUpdate(appointmentId, {
        status: 'completed',
        consultationEndedAt: new Date(),
      });
    }

    res.json({
      success: true,
      message: 'Video consultation ended successfully.',
      meeting,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to conclude video consultation.',
    });
  }
};

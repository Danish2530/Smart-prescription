import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import queueService from '../services/queueService.js';

// @desc    Get live queue analytics for a doctor
// @route   GET /api/queue/doctor/:doctorId
// @access  Public
export const getDoctorQueue = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    const stats = await queueService.getDoctorQueueStats(doctorId, date);
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve queue statistics.',
    });
  }
};

// @desc    Get patient position in queue
// @route   GET /api/queue/position/:appointmentId
// @access  Private
export const getPatientQueue = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const position = await queueService.getPatientQueuePosition(appointmentId);
    res.json({
      success: true,
      position,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve patient queue position.',
    });
  }
};

// @desc    Doctor action: Call next patient / start consultation
// @route   POST /api/queue/doctor/call-next
// @access  Private (Doctor)
export const callNextPatient = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found.',
      });
    }

    const today = new Date().toISOString().split('T')[0];

    // Find if there is an ongoing consultation and mark it completed
    const ongoing = await Appointment.findOne({
      doctorId: doctor._id,
      date: today,
      status: 'in_consultation',
    });

    if (ongoing) {
      ongoing.status = 'completed';
      ongoing.consultationEndedAt = new Date();
      await ongoing.save();
    }

    // Find the next waiting patient
    const nextPatient = await Appointment.findOne({
      doctorId: doctor._id,
      date: today,
      status: { $in: ['waiting', 'checked_in', 'confirmed'] },
    }).sort({ queueNumber: 1, time: 1 });

    if (!nextPatient) {
      return res.json({
        success: true,
        message: 'No more waiting patients in queue for today.',
        currentConsultation: null,
      });
    }

    nextPatient.status = 'in_consultation';
    nextPatient.consultationStartedAt = new Date();
    await nextPatient.save();

    const populated = await Appointment.findById(nextPatient._id).populate(
      'patientId',
      'name email phone'
    );

    const stats = await queueService.getDoctorQueueStats(doctor._id, today);

    res.json({
      success: true,
      message: `Patient #${nextPatient.queueNumber} called into consultation.`,
      currentConsultation: populated,
      queueStats: stats,
    });
  } catch (error) {
    console.error('Call next error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to call next patient.',
    });
  }
};

// @desc    Doctor action: Start consultation for specific appointment
// @route   POST /api/queue/:appointmentId/start
// @access  Private (Doctor)
export const startConsultation = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId).populate(
      'patientId',
      'name email phone'
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.',
      });
    }

    appointment.status = 'in_consultation';
    appointment.consultationStartedAt = new Date();
    await appointment.save();

    const queueStats = await queueService.getDoctorQueueStats(
      appointment.doctorId,
      appointment.date
    );

    res.json({
      success: true,
      message: `Consultation started for queue #${appointment.queueNumber}.`,
      appointment,
      queueStats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to start consultation.',
    });
  }
};

// @desc    Doctor action: Complete consultation
// @route   POST /api/queue/:appointmentId/complete
// @access  Private (Doctor)
export const completeConsultation = async (req, res) => {
  try {
    const { notes } = req.body;
    const appointment = await Appointment.findById(req.params.appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.',
      });
    }

    appointment.status = 'completed';
    appointment.consultationEndedAt = new Date();
    if (notes) appointment.notes = notes;
    await appointment.save();

    const queueStats = await queueService.getDoctorQueueStats(
      appointment.doctorId,
      appointment.date
    );

    res.json({
      success: true,
      message: `Consultation for queue #${appointment.queueNumber} completed.`,
      appointment,
      queueStats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to complete consultation.',
    });
  }
};

// @desc    Doctor action: Skip or mark absent (no-show)
// @route   POST /api/queue/:appointmentId/absent
// @access  Private (Doctor)
export const markPatientAbsent = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.',
      });
    }

    appointment.status = 'no_show';
    await appointment.save();

    const queueStats = await queueService.getDoctorQueueStats(
      appointment.doctorId,
      appointment.date
    );

    res.json({
      success: true,
      message: `Patient #${appointment.queueNumber} marked as no-show.`,
      appointment,
      queueStats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update patient attendance.',
    });
  }
};

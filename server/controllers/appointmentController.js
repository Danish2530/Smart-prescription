import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import queueService from '../services/queueService.js';
import videoService from '../services/videoService.js';

// @desc    Book a new doctor appointment
// @route   POST /api/appointments
// @access  Private (Patient)
export const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, type, reason } = req.body;

    if (!doctorId || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID, date, and time slot are required.',
      });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'The selected doctor was not found.',
      });
    }

    // Double booking prevention
    const existing = await Appointment.findOne({
      doctorId,
      date,
      time,
      status: { $nin: ['cancelled', 'no_show'] },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked. Please choose another available time.',
      });
    }

    // Assign sequential queue number for the day
    const queueNumber = await queueService.getNextQueueNumber(doctorId, date);

    // Initial status: if booked for today, can be confirmed/waiting
    const appointmentType = type === 'video' ? 'video' : 'in_person';

    const appointment = await Appointment.create({
      patientId: req.user._id,
      doctorId,
      date,
      time,
      type: appointmentType,
      status: 'confirmed',
      queueNumber,
      reason: reason || 'General Consultation',
    });

    // If video appointment, create video meeting session
    if (appointmentType === 'video') {
      const meeting = await videoService.createMeeting(
        appointment._id,
        doctor.userId,
        req.user._id
      );
      appointment.meetingRoomId = meeting.roomId;
      await appointment.save();
    }

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctorId', 'name specialization clinicName consultationFee status averageConsultationMinutes')
      .populate('patientId', 'name email phone');

    // Calculate queue stats for patient confirmation
    const queueInfo = await queueService.getPatientQueuePosition(appointment._id);

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully.',
      appointment: populatedAppointment,
      queueInfo,
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This time slot has just been reserved. Please pick another slot.',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to book appointment.',
    });
  }
};

// @desc    Get all appointments for the current patient
// @route   GET /api/appointments/my
// @access  Private (Patient)
export const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user._id })
      .populate('doctorId')
      .sort({ date: -1, time: -1 });

    // Enrich each appointment with live queue position
    const enrichedAppointments = await Promise.all(
      appointments.map(async (apt) => {
        try {
          const queueInfo = await queueService.getPatientQueuePosition(apt._id);
          return {
            ...apt.toObject(),
            queueInfo,
          };
        } catch {
          return apt.toObject();
        }
      })
    );

    res.json({
      success: true,
      count: enrichedAppointments.length,
      appointments: enrichedAppointments,
    });
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve appointments.',
    });
  }
};

// @desc    Get appointments for logged-in doctor
// @route   GET /api/appointments/doctor
// @access  Private (Doctor)
export const getDoctorAppointments = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found.',
      });
    }

    const { date, status } = req.query;
    const filter = { doctorId: doctor._id };
    if (date) filter.date = date;
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'name email phone')
      .sort({ date: 1, queueNumber: 1, time: 1 });

    res.json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve appointments.',
    });
  }
};

// @desc    Get single appointment details
// @route   GET /api/appointments/:id
// @access  Private
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctorId')
      .populate('patientId', 'name email phone');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.',
      });
    }

    const queueInfo = await queueService.getPatientQueuePosition(appointment._id);

    res.json({
      success: true,
      appointment,
      queueInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve appointment details.',
    });
  }
};

// @desc    Update appointment status
// @route   PATCH /api/appointments/:id/status
// @access  Private
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = [
      'pending',
      'confirmed',
      'checked_in',
      'waiting',
      'in_consultation',
      'completed',
      'cancelled',
      'no_show',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment status.',
      });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.',
      });
    }

    appointment.status = status;
    if (notes) appointment.notes = notes;

    if (status === 'checked_in' || status === 'waiting') {
      appointment.checkedInAt = new Date();
    } else if (status === 'in_consultation') {
      appointment.consultationStartedAt = new Date();
    } else if (status === 'completed') {
      appointment.consultationEndedAt = new Date();
    }

    await appointment.save();

    const queueInfo = await queueService.getPatientQueuePosition(appointment._id);

    res.json({
      success: true,
      message: `Appointment status updated to ${status}.`,
      appointment,
      queueInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment status.',
    });
  }
};

// @desc    Check-in patient to queue
// @route   POST /api/appointments/:id/check-in
// @access  Private
export const checkInAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.',
      });
    }

    appointment.status = 'waiting';
    appointment.checkedInAt = new Date();
    await appointment.save();

    const queueInfo = await queueService.getPatientQueuePosition(appointment._id);

    res.json({
      success: true,
      message: 'Patient checked in successfully. You are now in the active queue.',
      appointment,
      queueInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Check-in failed.',
    });
  }
};

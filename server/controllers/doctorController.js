import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import queueService from '../services/queueService.js';

// @desc    Get all doctors with optional filters and live queue stats
// @route   GET /api/doctors
// @access  Public
export const getDoctors = async (req, res) => {
  try {
    const { specialization, search, status, videoOnly, sort } = req.query;

    const query = {};
    if (specialization && specialization !== 'All') {
      query.specialization = new RegExp(`^${specialization}$`, 'i');
    }
    if (status) {
      query.status = status;
    }
    if (videoOnly === 'true') {
      query.videoConsultationAvailable = true;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } },
        { clinicName: { $regex: search, $options: 'i' } },
        { clinicAddress: { $regex: search, $options: 'i' } },
      ];
    }

    const doctors = await Doctor.find(query).sort({ rating: -1, experience: -1 });

    // Attach live traffic and queue metrics for today to each doctor
    const today = new Date().toISOString().split('T')[0];
    const enrichedDoctors = await Promise.all(
      doctors.map(async (doc) => {
        try {
          const queueStats = await queueService.getDoctorQueueStats(doc._id, today);
          return {
            ...doc.toObject(),
            liveQueue: {
              patientsWaiting: queueStats.patientsWaiting,
              estimatedWaitMinutes: queueStats.estimatedWaitMinutes,
              trafficLevel: queueStats.trafficLevel,
              nextAvailableSlot: queueStats.nextAvailableSlot,
              status: doc.status,
            },
          };
        } catch {
          return {
            ...doc.toObject(),
            liveQueue: {
              patientsWaiting: 0,
              estimatedWaitMinutes: 0,
              trafficLevel: 'LOW',
              nextAvailableSlot: 'Today 10:00 AM',
              status: doc.status,
            },
          };
        }
      })
    );

    // Optional sort by wait time
    if (sort === 'wait_asc') {
      enrichedDoctors.sort(
        (a, b) => a.liveQueue.estimatedWaitMinutes - b.liveQueue.estimatedWaitMinutes
      );
    } else if (sort === 'fee_asc') {
      enrichedDoctors.sort((a, b) => a.consultationFee - b.consultationFee);
    }

    res.json({
      success: true,
      count: enrichedDoctors.length,
      doctors: enrichedDoctors,
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve doctors list.',
    });
  }
};

// @desc    Get unique specializations
// @route   GET /api/doctors/specializations
// @access  Public
export const getSpecializations = async (req, res) => {
  try {
    const specializations = await Doctor.distinct('specialization');
    res.json({
      success: true,
      specializations: specializations.filter(Boolean).sort(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve specializations.',
    });
  }
};

// @desc    Get doctor by ID with complete live queue info
// @route   GET /api/doctors/:id
// @access  Public
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found.',
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const queueStats = await queueService.getDoctorQueueStats(doctor._id, today);

    res.json({
      success: true,
      doctor: {
        ...doctor.toObject(),
        liveQueue: queueStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve doctor details.',
    });
  }
};

// @desc    Get available slots for a doctor on a specific date
// @route   GET /api/doctors/:id/slots
// @access  Public
export const getDoctorSlots = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found.',
      });
    }

    const avgDuration = doctor.averageConsultationMinutes || 15;
    const startH = parseInt(doctor.availableHours?.start?.split(':')[0] || '9', 10);
    const endH = parseInt(doctor.availableHours?.end?.split(':')[0] || '18', 10);

    // Fetch existing appointments on that date
    const bookedAppointments = await Appointment.find({
      doctorId: doctor._id,
      date: targetDate,
      status: { $nin: ['cancelled', 'no_show'] },
    }).select('time');

    const bookedTimes = new Set(bookedAppointments.map((a) => a.time));

    // Generate slots
    const slots = [];
    for (let h = startH; h < endH; h++) {
      for (let m = 0; m < 60; m += avgDuration) {
        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        slots.push({
          time: timeStr,
          isBooked: bookedTimes.has(timeStr),
        });
      }
    }

    res.json({
      success: true,
      date: targetDate,
      slots,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate appointment slots.',
    });
  }
};

// @desc    Get current logged in doctor's profile
// @route   GET /api/doctors/me
// @access  Private (Doctor)
export const getMyDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'No doctor profile found associated with your account.',
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const queueStats = await queueService.getDoctorQueueStats(doctor._id, today);

    res.json({
      success: true,
      doctor,
      queueStats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve doctor profile.',
    });
  }
};

// @desc    Update doctor status (AVAILABLE, BUSY, OFFLINE, ON_BREAK)
// @route   PATCH /api/doctors/status
// @access  Private (Doctor)
export const updateDoctorStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['AVAILABLE', 'BUSY', 'OFFLINE', 'ON_BREAK'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be AVAILABLE, BUSY, OFFLINE, or ON_BREAK.',
      });
    }

    const doctor = await Doctor.findOneAndUpdate(
      { userId: req.user._id },
      { status },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found.',
      });
    }

    res.json({
      success: true,
      message: `Doctor status updated to ${status}`,
      doctor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update doctor status.',
    });
  }
};

// @desc    Update doctor availability and configuration
// @route   PUT /api/doctors/profile
// @access  Private (Doctor)
export const updateDoctorProfile = async (req, res) => {
  try {
    const {
      clinicName,
      clinicAddress,
      consultationFee,
      averageConsultationMinutes,
      availableHours,
      availableDays,
      videoConsultationAvailable,
      about,
    } = req.body;

    const doctor = await Doctor.findOneAndUpdate(
      { userId: req.user._id },
      {
        ...(clinicName && { clinicName }),
        ...(clinicAddress && { clinicAddress }),
        ...(consultationFee !== undefined && { consultationFee }),
        ...(averageConsultationMinutes !== undefined && { averageConsultationMinutes }),
        ...(availableHours && { availableHours }),
        ...(availableDays && { availableDays }),
        ...(videoConsultationAvailable !== undefined && { videoConsultationAvailable }),
        ...(about !== undefined && { about }),
      },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found.',
      });
    }

    res.json({
      success: true,
      message: 'Doctor profile updated successfully.',
      doctor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update doctor profile.',
    });
  }
};

// Helper for fallback distance calculation
const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// @desc    Get nearby PRESCRIPTO doctors based on patient coordinates
// @route   GET /api/doctors/nearby
// @access  Public
export const getNearbyDoctors = async (req, res) => {
  try {
    const { latitude, longitude, radius, specialization, search, status, videoOnly } = req.query;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Both latitude and longitude are required query parameters.',
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusMeters = radius ? parseFloat(radius) : 10000;

    if (isNaN(lat) || lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude. Must be a valid number between -90 and 90.',
      });
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid longitude. Must be a valid number between -180 and 180.',
      });
    }

    if (isNaN(radiusMeters) || radiusMeters <= 0 || radiusMeters > 500000) {
      return res.status(400).json({
        success: false,
        message: 'Invalid radius. Must be a positive number in meters (max 500000).',
      });
    }

    // Build filters
    const matchQuery = {};
    if (specialization && specialization !== 'All') {
      matchQuery.specialization = new RegExp(`^${specialization}$`, 'i');
    }
    if (status) {
      matchQuery.status = status;
    }
    if (videoOnly === 'true') {
      matchQuery.videoConsultationAvailable = true;
    }
    if (search) {
      matchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } },
        { clinicName: { $regex: search, $options: 'i' } },
        { clinicAddress: { $regex: search, $options: 'i' } },
      ];
    }

    let rawDoctors = [];
    try {
      const geoPipeline = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            distanceField: 'distanceMeters',
            maxDistance: radiusMeters,
            spherical: true,
            query: matchQuery,
          },
        },
        { $sort: { distanceMeters: 1 } },
      ];
      rawDoctors = await Doctor.aggregate(geoPipeline);
    } catch (geoError) {
      console.warn('GeoNear aggregation failed, using fallback query:', geoError.message);
      const allDocs = await Doctor.find(matchQuery);
      rawDoctors = allDocs
        .map((doc) => {
          const docObj = doc.toObject();
          const coords = docObj.location?.coordinates;
          if (Array.isArray(coords) && coords.length === 2) {
            const dKm = haversineDistanceKm(lat, lng, coords[1], coords[0]);
            docObj.distanceMeters = dKm * 1000;
            return docObj;
          }
          return null;
        })
        .filter((d) => d !== null && d.distanceMeters <= radiusMeters)
        .sort((a, b) => a.distanceMeters - b.distanceMeters);
    }

    const today = new Date().toISOString().split('T')[0];
    const enrichedDoctors = await Promise.all(
      rawDoctors.map(async (doc) => {
        const distanceKm = Number((doc.distanceMeters / 1000).toFixed(1));
        

        try {
          const queueStats = await queueService.getDoctorQueueStats(doc._id, today);
          return {
            ...doc,
            id: doc._id.toString(),
            distanceKm,
            queue: {
              patientsAhead: queueStats.patientsWaiting,
              estimatedWaitMinutes: queueStats.estimatedWaitMinutes,
              traffic: queueStats.trafficLevel,
            },
            liveQueue: {
              patientsWaiting: queueStats.patientsWaiting,
              estimatedWaitMinutes: queueStats.estimatedWaitMinutes,
              trafficLevel: queueStats.trafficLevel,
              nextAvailableSlot: queueStats.nextAvailableSlot,
              status: doc.status,
            },
          };
        } catch {
          return {
            ...doc,
            id: doc._id.toString(),
            distanceKm,
            queue: {
              patientsAhead: 0,
              estimatedWaitMinutes: 5,
              traffic: 'LOW',
            },
            liveQueue: {
              patientsWaiting: 0,
              estimatedWaitMinutes: 5,
              trafficLevel: 'LOW',
              nextAvailableSlot: 'Today 10:00 AM',
              status: doc.status,
            },
          };
        }
      })
    );

    res.json({
      success: true,
      count: enrichedDoctors.length,
      doctors: enrichedDoctors,
    });
  } catch (error) {
    console.error('Error fetching nearby doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve nearby doctors.',
    });
  }
};

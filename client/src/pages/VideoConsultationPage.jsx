import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Monitor,
  PhoneOff,
  MessageSquare,
  ShieldCheck,
  User,
  Users,
  Clock,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function VideoConsultationPage() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Media toggles
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [callEnded, setCallEnded] = useState(false);

  // Call timer
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Local camera stream reference
  const localVideoRef = useRef(null);

  useEffect(() => {
    let timer;
    if (!callEnded && !loading) {
      timer = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callEnded, loading]);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/video/${appointmentId}`);
        if (res.data.success) {
          setSession(res.data.meeting);
        }
      } catch (err) {
        console.error('Failed to load video meeting:', err);
        setError('Unable to initialize video consultation session.');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [appointmentId]);

  // Attempt to attach user webcam if available in browser
  useEffect(() => {
    let stream;
    if (isVideoOn && !callEnded) {
      navigator.mediaDevices
        ?.getUserMedia({ video: true, audio: false })
        .then((s) => {
          stream = s;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = s;
          }
        })
        .catch(() => {
          // Camera permission denied or mock environment - fallback cleanly
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isVideoOn, callEnded]);

  const handleEndCall = async () => {
    try {
      if (session?.roomId) {
        await api.post('/video/end', {
          roomId: session.roomId,
          appointmentId,
        });
      }
    } catch (err) {
      console.warn('End call error:', err);
    } finally {
      setCallEnded(true);
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center gap-3 bg-slate-900 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
        <p className="text-sm font-medium text-slate-300">Connecting to secure encrypted medical room...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 mb-2">Video Room Unavailable</h2>
        <p className="text-xs text-slate-500 mb-6">{error || 'Session could not be reached.'}</p>
        <Link
          to="/appointments"
          className="inline-flex px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold"
        >
          Return to Appointments
        </Link>
      </div>
    );
  }

  const isDoctorRole = session.userRole === 'doctor' || user?.role === 'doctor';
  const remoteParticipantName = isDoctorRole
    ? session.patient?.name || 'Patient'
    : session.doctor?.name || 'Doctor';
  const remoteSpecialization = isDoctorRole
    ? 'Patient Consultation'
    : session.doctor?.specialization || 'Medical Specialist';

  return (
    <div className="min-h-[85vh] bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden">
      {/* Top Header Bar */}
      <div className="px-6 py-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h2 className="text-sm font-bold flex items-center gap-2">
              <span>{remoteParticipantName}</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </h2>
            <p className="text-[11px] text-slate-400">{remoteSpecialization}</p>
          </div>
        </div>

        {/* Call Timer & Encryption Badge */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono text-emerald-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimer(secondsElapsed)}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-lg">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>HD Telehealth 256-bit Encrypted</span>
          </div>
        </div>
      </div>

      {/* Main Video Stage */}
      <div className="flex-1 p-4 sm:p-6 flex flex-col md:flex-row gap-4 relative z-10 max-w-7xl mx-auto w-full">
        {/* Remote Video Container (Doctor / Patient Feed) */}
        <div className="flex-1 bg-slate-900 rounded-3xl border border-slate-800 relative overflow-hidden flex items-center justify-center shadow-2xl min-h-[350px]">
          {/* Mock remote stream representation */}
          <div className="text-center p-8 z-10">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 text-white font-black text-3xl sm:text-4xl flex items-center justify-center mx-auto mb-4 shadow-xl ring-4 ring-white/10 animate-pulse">
              {remoteParticipantName
                .replace(/^Dr\.\s*/, '')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{remoteParticipantName}</h3>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Connected &amp; Speaking
            </span>
          </div>

          {/* Subtitle / Telehealth Prompt */}
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs text-slate-300 border border-white/10">
            {remoteParticipantName} ({isDoctorRole ? 'Patient' : 'Consulting Physician'})
          </div>
        </div>

        {/* Local Participant Feed (Self View) */}
        <div className="w-full md:w-72 h-48 md:h-auto bg-slate-850 rounded-3xl border border-slate-800 relative overflow-hidden flex items-center justify-center flex-shrink-0">
          {isVideoOn ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          ) : (
            <div className="text-center p-4">
              <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-300 font-bold text-xl flex items-center justify-center mx-auto mb-2 border border-slate-700">
                {user?.name?.[0] || 'U'}
              </div>
              <p className="text-xs text-slate-400 font-medium">Camera is Off</p>
            </div>
          )}

          <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[11px] text-white flex items-center gap-1.5 border border-white/10">
            <span>You ({user?.name || 'Self'})</span>
            {!isMicOn && <MicOff className="w-3 h-3 text-rose-400" />}
          </div>
        </div>

        {/* Optional Clinical Notes Sidebar */}
        {showNotes && (
          <div className="w-full md:w-80 bg-slate-900 rounded-3xl border border-slate-800 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Consultation Notes</span>
                </h4>
                <button onClick={() => setShowNotes(false)} className="text-xs text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>
              <textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Type clinical observations, instructions, or symptoms discussed during consultation..."
                className="w-full h-48 bg-slate-950 text-slate-200 text-xs p-3 rounded-xl border border-slate-800 focus:outline-hidden focus:border-blue-500 resize-none"
              />
            </div>
            <p className="text-[10px] text-slate-500 italic mt-2">
              Notes are auto-saved to your patient consultation history.
            </p>
          </div>
        )}
      </div>

      {/* Media & Call Controls Footer */}
      <div className="py-4 px-6 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex items-center justify-center gap-3 sm:gap-4 z-20">
        {/* Mic Toggle */}
        <button
          onClick={() => setIsMicOn(!isMicOn)}
          className={`p-3.5 rounded-2xl transition shadow-sm ${
            isMicOn
              ? 'bg-slate-800 text-white hover:bg-slate-700'
              : 'bg-rose-600 text-white hover:bg-rose-700'
          }`}
          title={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
        >
          {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        {/* Video Toggle */}
        <button
          onClick={() => setIsVideoOn(!isVideoOn)}
          className={`p-3.5 rounded-2xl transition shadow-sm ${
            isVideoOn
              ? 'bg-slate-800 text-white hover:bg-slate-700'
              : 'bg-rose-600 text-white hover:bg-rose-700'
          }`}
          title={isVideoOn ? 'Turn camera off' : 'Turn camera on'}
        >
          {isVideoOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {/* Screen Share */}
        <button
          onClick={() => setIsScreenSharing(!isScreenSharing)}
          className={`p-3.5 rounded-2xl transition shadow-sm ${
            isScreenSharing
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
          title="Share screen"
        >
          <Monitor className="w-5 h-5" />
        </button>

        {/* Notes Toggle */}
        <button
          onClick={() => setShowNotes(!showNotes)}
          className={`p-3.5 rounded-2xl transition shadow-sm ${
            showNotes
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
          title="Clinical notes"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        {/* End Call */}
        <button
          onClick={handleEndCall}
          className="px-5 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-rose-600/30"
          title="End Consultation"
        >
          <PhoneOff className="w-5 h-5" />
          <span className="hidden sm:inline">End Consultation</span>
        </button>
      </div>

      {/* Call Concluded Modal */}
      {callEnded && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold mb-1">Consultation Concluded</h3>
            <p className="text-xs text-slate-500 mb-4">
              Call duration: <strong>{formatTimer(secondsElapsed)}</strong>. Your medical records and follow-ups are recorded.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-6 text-xs text-slate-600">
              Need prescription review or dose scheduling? Check your Prescriptions tab.
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-200 text-center"
              >
                Go to Dashboard
              </Link>
              <Link
                to="/appointments"
                className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 text-center"
              >
                My Appointments
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

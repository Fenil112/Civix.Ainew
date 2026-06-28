import { useState, useRef, useCallback, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { analyzeComplaint } from '../../lib/gemini';
import {
  collection, addDoc, serverTimestamp, query,
  where, getDocs, updateDoc, doc, increment
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'react-hot-toast';
import {
  Camera, Mic, MapPin, Upload, X, Loader2, CheckCircle,
  AlertTriangle, Brain, Volume2, Navigation,
  ChevronRight, ChevronLeft, Zap, Info
} from 'lucide-react';
import type { ComplaintAnalysis } from '../../lib/gemini';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDzeUoFxUV7mgP2QOu9WXMaXqPo0mOwP1Q';



const SEVERITY_COLORS = {
  low: 'border-emerald-500 bg-emerald-500/10 text-emerald-400',
  medium: 'border-amber-500 bg-amber-500/10 text-amber-400',
  high: 'border-orange-500 bg-orange-500/10 text-orange-400',
  critical: 'border-red-500 bg-red-500/10 text-red-400',
};

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

export default function ReportIssue() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Details, 2: Location, 3: AI Analysis, 4: Submit
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [manualAddress, setManualAddress] = useState('');
  const [locating, setLocating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [analysis, setAnalysis] = useState<ComplaintAnalysis | null>(null);
  const [duplicateFound, setDuplicateFound] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Dropzone for photos
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setPhotos((prev) => {
      const newFiles = acceptedFiles.slice(0, 5 - prev.length);
      if (newFiles.length === 0) return prev;
      
      const urls = newFiles.map((f) => URL.createObjectURL(f));
      setPhotoUrls((prevUrls) => [...prevUrls, ...urls]);
      toast.success(`${newFiles.length} photo(s) added`);
      return [...prev, ...newFiles];
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'], 'video/*': ['.mp4', '.webm'] },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024,
  });

  const removePhoto = useCallback((index: number) => {
    setPhotoUrls((prevUrls) => {
      if (prevUrls[index]) {
        URL.revokeObjectURL(prevUrls[index]);
      }
      return prevUrls.filter((_, i) => i !== index);
    });
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // GPS Location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
          );
          const data = await res.json();
          const address = data.results?.[0]?.formatted_address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setLocation({ lat, lng, address });
          setManualAddress(address);
          toast.success('Location detected!');
        } catch {
          setLocation({ lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
        }
        setLocating(false);
      },
      () => {
        setLocating(false);
        toast.error('Could not get location. Please enter manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Voice Recording
  const startVoiceInput = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return toast.error('Voice input not supported in this browser');

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onresult = (event: any) => {
      const t = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join('');
      setDescription(t);
    };

    recognition.onerror = () => {
      setRecording(false);
      toast.error('Voice recognition error');
    };

    recognition.onend = () => setRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
    toast.success('Listening... speak your issue');
  }, []);

  const stopVoiceInput = useCallback(() => {
    recognitionRef.current?.stop();
    setRecording(false);
  }, []);

  // Check duplicates
  const checkDuplicates = async (): Promise<string | null> => {
    if (!location) return null;
    try {
      // Simple proximity check - check for complaints in same category near location
      const q = query(
        collection(db, 'complaints'),
        where('status', 'in', ['submitted', 'verified', 'assigned', 'in_progress']),
        where('category', '==', analysis?.category)
      );
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        const data = d.data();
        if (data.location?.lat && data.location?.lng) {
          const dist = Math.sqrt(
            Math.pow(data.location.lat - location.lat, 2) +
            Math.pow(data.location.lng - location.lng, 2)
          );
          if (dist < 0.005) { // ~500m radius
            return d.id;
          }
        }
      }
    } catch {}
    return null;
  };

  // AI Analysis
  const runAnalysis = async () => {
    if (!description.trim()) return toast.error('Please describe the issue');
    setAnalyzing(true);
    try {
      let imageBase64: string | undefined;
      if (photos[0]) {
        const reader = new FileReader();
        imageBase64 = await new Promise((resolve) => {
          reader.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
          reader.readAsDataURL(photos[0]);
        });
      }

      const result = await analyzeComplaint(description, imageBase64);
      setAnalysis(result);

      if (result.isSpam) {
        toast.error('This complaint appears to be spam. Please describe a real civic issue.');
        setAnalyzing(false);
        return;
      }

      const dupId = await checkDuplicates();
      if (dupId) {
        setDuplicateFound(dupId);
      }

      setStep(3);
    } catch (err) {
      toast.error('AI analysis failed. Please try again.');
    }
    setAnalyzing(false);
  };

  // Compress image using canvas to keep Firestore docs under 1MB
  const compressImage = (file: File, maxWidth = 600, quality = 0.5): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas not supported'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  // Compress all photos for Firestore storage (no Firebase Storage needed)
  const uploadFiles = async (): Promise<string[]> => {
    try {
      const promises = photos.map(file => compressImage(file));
      return await Promise.all(promises);
    } catch (err) {
      console.error('Error compressing images:', err);
      toast.error('Failed to process images.');
      return [];
    }
  };

  // Submit complaint
  const handleSubmit = async () => {
    if (!analysis || !user || !userProfile) return;

    if (duplicateFound) {
      // Merge with existing
      try {
        await updateDoc(doc(db, 'complaints', duplicateFound), {
          supporterCount: increment(1),
          supporters: [...([] as string[]), user.uid],
          updatedAt: serverTimestamp(),
        });
        toast.success('Your complaint has been merged with an existing report. Your support has been added!');
        navigate('/my-complaints');
        return;
      } catch {
        // Continue with creating new complaint
      }
    }

    setSubmitting(true);
    try {
      const uploadedUrls = await uploadFiles();

      const complaintData = {
        citizenId: user.uid,
        citizenName: userProfile.displayName,
        citizenAvatar: userProfile.photoURL || '',
        title: analysis.title,
        description: analysis.description,
        originalDescription: description,
        category: analysis.category,
        severity: analysis.severity,
        status: 'submitted',
        location: location
          ? { lat: location.lat, lng: location.lng, address: location.address }
          : { lat: 0, lng: 0, address: manualAddress },
        photos: uploadedUrls,
        videos: [],
        department: analysis.department,
        estimatedRepairTime: analysis.estimatedRepairTime,
        estimatedCost: analysis.estimatedCost,
        urgencyScore: analysis.urgencyScore,
        supporterCount: 1,
        supporters: [user.uid],
        tags: analysis.tags,
        timeline: [
          {
            status: 'submitted',
            timestamp: new Date(),
            message: 'Complaint submitted by citizen. AI analysis complete.',
            updatedBy: user.uid,
          },
        ],
        aiAnalysis: {
          impactSummary: analysis.impactSummary,
          recommendations: analysis.citizenUpdate,
        },
        repairImages: [],
        isSpam: false,
        isDuplicate: false,
        viewCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'complaints'), complaintData);

      // Update user's community score
      await updateDoc(doc(db, 'users', user.uid), {
        communityScore: increment(10),
        totalComplaints: increment(1),
        updatedAt: serverTimestamp(),
      });

      // Create notification
      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        title: 'Complaint Submitted!',
        message: `Your complaint "${analysis.title}" has been received and is being processed.`,
        type: 'complaint_update',
        complaintId: docRef.id,
        isRead: false,
        createdAt: serverTimestamp(),
      });

      toast.success('Complaint submitted successfully! +10 community points');
      navigate(`/complaints/${docRef.id}`);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to submit complaint. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <DashboardLayout role="citizen">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white font-display">Report an Issue</h1>
          <p className="text-slate-500 text-sm mt-1">AI will analyze and categorize your complaint automatically</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {['Describe', 'Location', 'AI Review', 'Submit'].map((label, i) => (
            <Fragment key={label}>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                step === i + 1
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : step > i + 1
                  ? 'text-emerald-400 bg-emerald-400/10'
                  : 'text-slate-600'
              }`}>
                {step > i + 1 ? <CheckCircle className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < 3 && <div className={`flex-1 h-px ${step > i + 1 ? 'bg-emerald-500/30' : 'bg-white/5'}`} />}
            </Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Description */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="glass rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Describe the Issue</h2>

                {/* Voice Input */}
                <div className="flex items-center gap-3 mb-4">
                  <button
                    type="button"
                    onClick={recording ? stopVoiceInput : startVoiceInput}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      recording
                        ? 'bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse'
                        : 'glass border border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {recording ? <><Volume2 className="w-4 h-4" /> Stop Recording</> : <><Mic className="w-4 h-4" /> Voice Input</>}
                  </button>
                  <span className="text-xs text-slate-600">or type below</span>
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the civic issue in detail. What is the problem? Where exactly? How long has it been there? Who is affected?"
                  rows={6}
                  className="w-full input-dark rounded-xl p-4 text-sm resize-none"
                />
                <p className="text-xs text-slate-600 mt-2">{description.length} characters</p>
              </div>

              {/* Photo Upload */}
              <div className="glass rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  <span className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-indigo-400" />
                    Attach Photos / Videos
                    <span className="text-xs text-slate-500 font-normal">(optional, improves AI accuracy)</span>
                  </span>
                </h2>

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    isDragActive ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/10 hover:border-indigo-500/30'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">
                    {isDragActive ? 'Drop files here' : 'Drag & drop or click to upload'}
                  </p>
                  <p className="text-slate-600 text-xs mt-1">JPG, PNG, MP4 up to 10MB each (max 5)</p>
                </div>

                {photoUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {photoUrls.map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url} className="w-full h-24 object-cover rounded-lg" alt="" />
                        <button
                          onClick={() => removePhoto(i)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  if (!description.trim()) return toast.error('Please describe the issue');
                  setStep(2);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 btn-primary text-white rounded-xl font-semibold"
              >
                Next: Add Location <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="glass rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Issue Location</h2>

                <button
                  onClick={getCurrentLocation}
                  disabled={locating}
                  className="w-full flex items-center justify-center gap-3 py-3 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400 font-medium hover:bg-indigo-600/30 transition-all mb-4 disabled:opacity-50"
                >
                  {locating ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Detecting location...</>
                  ) : (
                    <><Navigation className="w-5 h-5" /> Use Current GPS Location</>
                  )}
                </button>

                {location && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <p className="text-sm text-emerald-300 truncate">{location.address}</p>
                  </div>
                )}

                <div className="relative flex items-center mb-4">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="px-3 text-xs text-slate-600">or enter manually</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="Enter street address, landmark, or area"
                    className="w-full input-dark rounded-xl pl-10 pr-4 py-3 text-sm"
                  />
                </div>

                <p className="text-xs text-slate-600 mt-3 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Accurate location helps authorities resolve issues faster
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-5 py-3 glass border border-white/10 rounded-xl text-slate-400 font-medium hover:text-slate-200 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={runAnalysis}
                  disabled={analyzing || (!location && !manualAddress)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 btn-primary text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  {analyzing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> AI Analyzing...</>
                  ) : (
                    <><Brain className="w-4 h-4" /> Analyze with AI</>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: AI Analysis Results */}
          {step === 3 && analysis && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Duplicate Warning */}
              {duplicateFound && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-300 font-medium text-sm">Similar Complaint Found Nearby</p>
                    <p className="text-amber-400/70 text-xs mt-1">
                      A similar complaint already exists in this area. Submitting will merge your report and add your support to increase visibility.
                    </p>
                  </div>
                </div>
              )}

              {/* AI Analysis Card */}
              <div className="glass rounded-2xl p-6 border border-indigo-500/20">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-semibold text-white">AI Analysis Results</h2>
                  <span className="ml-auto text-xs px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-lg">Gemini AI</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wide">Generated Title</label>
                    <p className="text-white font-semibold mt-1">{analysis.title}</p>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wide">AI Description</label>
                    <p className="text-slate-300 text-sm mt-1 leading-relaxed">{analysis.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wide">Category</label>
                      <p className="text-indigo-400 font-medium text-sm mt-1">{analysis.category}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wide">Department</label>
                      <p className="text-purple-400 font-medium text-sm mt-1">{analysis.department}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wide">Severity</label>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-lg text-xs font-bold border capitalize ${
                        SEVERITY_COLORS[analysis.severity]
                      }`}>
                        {analysis.severity}
                      </span>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wide">Urgency Score</label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                            style={{ width: `${analysis.urgencyScore}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">{analysis.urgencyScore}/100</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wide">Est. Repair Time</label>
                      <p className="text-amber-400 font-medium text-sm mt-1">{analysis.estimatedRepairTime}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wide">Est. Cost</label>
                      <p className="text-emerald-400 font-medium text-sm mt-1">{analysis.estimatedCost}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wide">Community Impact</label>
                    <p className="text-slate-300 text-sm mt-1">{analysis.impactSummary}</p>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wide">Tags</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {analysis.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-lg bg-slate-700/50 text-xs text-slate-400">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* What happens next */}
              <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                <p className="text-indigo-300 text-sm font-medium mb-1">What happens next?</p>
                <p className="text-slate-400 text-xs leading-relaxed">{analysis.citizenUpdate}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-5 py-3 glass border border-white/10 rounded-xl text-slate-400 font-medium hover:text-slate-200 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 btn-primary text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                  ) : duplicateFound ? (
                    <><CheckCircle className="w-4 h-4" /> Merge & Support Existing Report</>
                  ) : (
                    <><CheckCircle className="w-4 h-4" /> Submit Complaint</>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintService } from '../../services/complaintService';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import DuplicateWarningModal from '../../components/complaints/DuplicateWarningModal';
import { 
  PlusCircle, 
  Building, 
  MapPin, 
  Tag, 
  AlertTriangle, 
  Upload, 
  X, 
  CheckCircle2, 
  Sparkles,
  Flame
} from 'lucide-react';

const SubmitComplaintPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [hierarchy, setHierarchy] = useState({ buildings: [], categories: [] });
  const [loadingHierarchy, setLoadingHierarchy] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [floorId, setFloorId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [severity, setSeverity] = useState(3);
  const [description, setDescription] = useState('');
  
  // Image upload
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Duplicate detection modal state
  const [duplicates, setDuplicates] = useState([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [supporting, setSupporting] = useState(false);

  // Fetch campus building & category hierarchy
  useEffect(() => {
    const loadHierarchy = async () => {
      try {
        const res = await complaintService.getCampusHierarchy();
        setHierarchy(res);
        if (res.categories?.length > 0) {
          setCategoryId(res.categories[0].id);
        }
        if (res.buildings?.length > 0) {
          const firstB = res.buildings[0];
          setBuildingId(firstB.id);
          if (firstB.floors?.length > 0) {
            const firstF = firstB.floors[0];
            setFloorId(firstF.id);
            if (firstF.rooms?.length > 0) {
              setRoomId(firstF.rooms[0].id);
            }
          }
        }
      } catch (err) {
        toast.error('Failed to load campus locations.');
      } finally {
        setLoadingHierarchy(false);
      }
    };
    loadHierarchy();
  }, []);

  // Update floors when building changes
  const selectedBuilding = hierarchy.buildings?.find((b) => b.id === buildingId);
  const availableFloors = selectedBuilding?.floors || [];

  const handleBuildingChange = (e) => {
    const newBId = e.target.value;
    setBuildingId(newBId);
    const b = hierarchy.buildings?.find((item) => item.id === newBId);
    if (b && b.floors?.length > 0) {
      setFloorId(b.floors[0].id);
      if (b.floors[0].rooms?.length > 0) {
        setRoomId(b.floors[0].rooms[0].id);
      } else {
        setRoomId('');
      }
    } else {
      setFloorId('');
      setRoomId('');
    }
  };

  const selectedFloor = availableFloors.find((f) => f.id === floorId);
  const availableRooms = selectedFloor?.rooms || [];

  const handleFloorChange = (e) => {
    const newFId = e.target.value;
    setFloorId(newFId);
    const f = availableFloors.find((item) => item.id === newFId);
    if (f && f.rooms?.length > 0) {
      setRoomId(f.rooms[0].id);
    } else {
      setRoomId('');
    }
  };

  // Image handling
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size exceeds 5MB limit.');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Submission handler with duplicate check
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !categoryId || !roomId) {
      toast.warning('Please fill in all required fields.');
      return;
    }

    setCheckingDuplicates(true);
    try {
      // Stage 1-4: Check for duplicates first
      const dupRes = await complaintService.checkDuplicates({
        title,
        description,
        category_id: categoryId,
        room_id: roomId
      });

      if (dupRes.found_duplicates && dupRes.duplicates.length > 0) {
        // Show duplicate warning dialog
        setDuplicates(dupRes.duplicates);
        setShowDuplicateModal(true);
        setCheckingDuplicates(false);
        return;
      }

      // No duplicates found, execute submission directly
      await executeSubmission();
    } catch (err) {
      toast.error(err.message || 'Error checking for duplicates.');
      setCheckingDuplicates(false);
    }
  };

  // Actually save complaint
  const executeSubmission = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category_id', categoryId);
      formData.append('room_id', roomId);
      formData.append('severity', severity);
      if (imageFile) {
        formData.append('photograph', imageFile);
      }

      const res = await complaintService.createComplaint(formData);
      toast.success(`Complaint #${res.complaint.complaint_number} submitted successfully!`);
      setShowDuplicateModal(false);
      navigate(`/student/complaints/${res.complaint.id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  // Support existing complaint from modal
  const handleSupportExisting = async (existingId) => {
    setSupporting(true);
    try {
      const res = await complaintService.supportComplaint(existingId);
      toast.success('Successfully added your support! Priority boosted.');
      setShowDuplicateModal(false);
      navigate(`/student/complaints/${existingId}`);
    } catch (err) {
      toast.error(err.message || 'Failed to support existing complaint.');
    } finally {
      setSupporting(false);
    }
  };

  const severityOptions = [
    { level: 1, label: '1 – Minor (Cosmetic / Low urgency)' },
    { level: 2, label: '2 – Low (Inconvenient but functional)' },
    { level: 3, label: '3 – Moderate (Impacting regular use)' },
    { level: 4, label: '4 – High (Disrupts classes or labs)' },
    { level: 5, label: '5 – Critical (Hazard / Immediate safety risk)' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-main tracking-tight">Report a Campus Issue</h2>
        <p className="text-xs text-muted mt-1">
          Submit maintenance requests with photo evidence. Our intelligent engine verifies similarity and computes priority.
        </p>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Section 1: Issue Info */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/60 text-xs font-bold uppercase tracking-wider text-primary-light">
            <Tag className="w-4 h-4 text-cyan" />
            <span>Section 1 — Issue Information</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">
              Complaint Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ceiling Projector HDMI cable loose or not displaying"
              required
              className="w-full bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-main placeholder-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5">
                Issue Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-main focus:outline-none focus:border-primary transition-colors"
              >
                {hierarchy.categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5">
                Severity Level *
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(Number(e.target.value))}
                className="w-full bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-main focus:outline-none focus:border-primary transition-colors"
              >
                {severityOptions.map((opt) => (
                  <option key={opt.level} value={opt.level}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Section 2: Location Cascading */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/60 text-xs font-bold uppercase tracking-wider text-primary-light">
            <Building className="w-4 h-4 text-cyan" />
            <span>Section 2 — Campus Location</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5">
                Building *
              </label>
              <select
                value={buildingId}
                onChange={handleBuildingChange}
                className="w-full bg-elevated border border-border rounded-xl px-3 py-2.5 text-sm text-main focus:outline-none focus:border-primary transition-colors"
              >
                {hierarchy.buildings?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5">
                Floor *
              </label>
              <select
                value={floorId}
                onChange={handleFloorChange}
                disabled={availableFloors.length === 0}
                className="w-full bg-elevated border border-border rounded-xl px-3 py-2.5 text-sm text-main focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
              >
                {availableFloors.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.floor_name || `Floor ${f.floor_number}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5">
                Room Number *
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                disabled={availableRooms.length === 0}
                className="w-full bg-elevated border border-border rounded-xl px-3 py-2.5 text-sm text-main focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
              >
                {availableRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Room {r.room_number} ({r.room_type || 'General'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Section 3: Description */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-light">
              <MapPin className="w-4 h-4 text-cyan" />
              <span>Section 3 — Detailed Description</span>
            </div>
            <span className="text-[11px] text-muted font-mono">{description.length} / 1000 chars</span>
          </div>

          <div>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what is wrong, when it started, and specific instructions for maintenance staff..."
              required
              maxLength={1000}
              className="w-full bg-elevated border border-border rounded-xl p-3.5 text-sm text-main placeholder-muted focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>
        </Card>

        {/* Section 4: Photograph Upload */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/60 text-xs font-bold uppercase tracking-wider text-primary-light">
            <Upload className="w-4 h-4 text-cyan" />
            <span>Section 4 — Issue Photograph (Optional)</span>
          </div>

          {!imagePreview ? (
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border hover:border-cyan/50 rounded-xl cursor-pointer bg-elevated/40 hover:bg-elevated/80 transition-all group">
              <Upload className="w-8 h-8 text-muted group-hover:text-cyan transition-colors mb-2" />
              <p className="text-xs font-semibold text-main">Click to browse or drag & drop photograph</p>
              <p className="text-[11px] text-muted mt-1">PNG, JPG, WEBP up to 5MB</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-border max-w-sm">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-48 object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-critical text-main transition-colors"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </Card>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/student')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="cyan"
            icon={PlusCircle}
            loading={checkingDuplicates || submitting}
          >
            Submit Complaint
          </Button>
        </div>
      </form>

      {/* Duplicate Warning Modal */}
      <DuplicateWarningModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        duplicates={duplicates}
        onSupportExisting={handleSupportExisting}
        onSubmitAnyway={executeSubmission}
        isSubmitting={submitting}
        isSupporting={supporting}
      />
    </div>
  );
};

export default SubmitComplaintPage;

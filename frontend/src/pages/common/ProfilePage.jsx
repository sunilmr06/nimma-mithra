import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/authService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { 
  User as UserIcon, 
  Camera, 
  Mail, 
  Phone, 
  Building, 
  FileText, 
  ShieldCheck, 
  Wrench, 
  GraduationCap, 
  LogOut, 
  CheckCircle2, 
  Sparkles,
  Calendar
} from 'lucide-react';

const ProfilePage = () => {
  const { user, role, updateUser, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    department: '',
    bio: '',
  });

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        department: user.department || '',
        bio: user.bio || '',
      });
      setAvatarPreview(user.avatar_url || null);
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size exceeds 5MB limit.');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('name', formData.name.trim());
      payload.append('phone', formData.phone.trim());
      payload.append('department', formData.department.trim());
      payload.append('bio', formData.bio.trim());
      if (avatarFile) {
        payload.append('avatar', avatarFile);
      }

      const res = await authService.updateProfile(payload);
      updateUser(res.user);
      toast.success('Profile and picture updated successfully!');
      setAvatarFile(null);
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.info('Logged out.');
    navigate('/login');
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="w-5 h-5 text-primary-light" />;
      case 'staff':
        return <Wrench className="w-5 h-5 text-cyan" />;
      default:
        return <GraduationCap className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-main tracking-tight">Account Profile</h2>
          <p className="text-xs text-muted mt-1">
            Manage your personal profile, credentials, and profile photograph.
          </p>
        </div>

        <Button
          variant="danger"
          size="sm"
          icon={LogOut}
          onClick={handleLogout}
        >
          Sign Out of Account
        </Button>
      </div>

      {/* Main Profile Card */}
      <Card className="p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar & Basic Info Header */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-border/80 text-center sm:text-left">
            {/* Avatar with Camera upload button */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-elevated border-2 border-primary/40 shadow-xl flex items-center justify-center text-primary-light text-2xl font-bold">
                {avatarPreview ? (
                  <img src={avatarPreview} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.name ? user.name.charAt(0) : 'U'}</span>
                )}
              </div>

              <label className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-cyan hover:bg-cyan-hover text-background font-bold shadow-lg cursor-pointer transition-transform group-hover:scale-110">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-xl font-bold text-main">{user?.name}</h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/20 text-primary-light border border-primary/30 uppercase tracking-wider text-[10px]">
                  {getRoleIcon()}
                  {role} Account
                </span>
              </div>
              <p className="text-xs text-muted">{user?.email}</p>
              <p className="text-xs text-cyan-light font-medium">
                {user?.department || 'Department not specified'}
              </p>
              {avatarFile && (
                <span className="text-[11px] text-amber-300 font-medium block">
                  New picture selected. Click "Save Changes" below to apply.
                </span>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-elevated border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-main focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5">
                Email Address (Read-only)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-elevated/40 border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-muted opacity-75 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5">
                Department / Program
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. Computer Science & Eng."
                  className="w-full bg-elevated border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-main focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-elevated border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-main focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-muted mb-1.5">
                Bio / Status Message
              </label>
              <textarea
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell the campus community a little about yourself or your campus role..."
                className="w-full bg-elevated border border-border rounded-xl p-3 text-xs text-main placeholder-muted focus:outline-none focus:border-primary resize-none"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/80">
            <Button
              type="submit"
              variant="cyan"
              loading={saving}
              icon={CheckCircle2}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ProfilePage;

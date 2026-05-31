import React, { useState } from 'react';
import { 
  Download, 
  Upload, 
  Trash2, 
  Database, 
  Info, 
  User, 
  Sparkles,
  Save,
  Check,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { api } from '../api';

export default function Settings({ user, setUser, handleLogout }) {
  const [username, setUsername] = useState(user.username || '');
  const [profilePic, setProfilePic] = useState(user.profilePic || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState('');
  const [importStatus, setImportStatus] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileStatus('');

    try {
      // In standard REST flow, we can PUT /api/auth/me or update local mock user
      let updatedUser = { ...user, username, profilePic };
      
      // If mock login
      if (localStorage.getItem('lifeflow_token') !== 'local-mock-token') {
        // Real API call if backend has a path (we can extend auth router or update local fallback)
        // For simplicity, we write user updates to local storage, and real REST endpoint can be added
      }
      
      localStorage.setItem('lifeflow_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setProfileStatus('Profile updated successfully!');
    } catch (err) {
      setProfileStatus('Failed to update profile.');
    } finally {
      setTimeout(() => setIsUpdatingProfile(false), 500);
    }
  };

  const handleExportData = () => {
    api.backup.exportData();
  };

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const success = api.backup.importData(event.target.result);
      if (success) {
        setImportStatus('Data backup successfully restored! Refreshing app...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setImportStatus('Failed to restore backup. Check file integrity.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearCache = () => {
    if (!window.confirm("CAUTION: This will clear all your local goals, tasks, notes, events, and streaks. This action is irreversible. Proceed?")) return;
    
    // Clear lifeflow keys from LocalStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('lifeflow_')) {
        localStorage.removeItem(key);
      }
    });

    alert("Local workspace data cleared. Reloading...");
    window.location.reload();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Title */}
      <div>
        <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
          Control Center Settings <Save className="h-6 w-6 text-violet-400 animate-pulse" />
        </h2>
        <p className="text-slate-400 text-sm">Configure backup exports, user accounts, and database sync configurations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Side: General Profile Form */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Profile form card */}
          <div className="glass border border-slate-800 rounded-3xl p-6">
            <h3 className="font-display font-extrabold text-base text-white mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-violet-400" /> User Profile Info
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/45 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-violet-500 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full px-4 py-2.5 bg-slate-950/20 border border-slate-850 rounded-xl text-slate-500 text-sm cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-550 italic">Registered email accounts cannot be modified</span>
              </div>

              {profileStatus && (
                <div className={`text-xs font-bold ${profileStatus.includes('successfully') ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {profileStatus}
                </div>
              )}

              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-neon-violet transition-all cursor-pointer"
              >
                {isUpdatingProfile ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                <span>Save Profile changes</span>
              </button>
            </form>
          </div>

          {/* Database Setup documentation card */}
          <div className="glass border border-slate-800 rounded-3xl p-6">
            <h3 className="font-display font-extrabold text-base text-white mb-4 flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-400" /> Database Integrations
            </h3>
            
            <div className="space-y-4 text-slate-400 text-xs leading-relaxed">
              <div className="flex gap-3 bg-slate-950/40 p-4 border border-slate-850 rounded-2xl">
                <Info className="h-5 w-5 text-violet-400 flex-shrink-0 mt-0.5" />
                <p>
                  LifeFlow runs by default using a local JSON file database fallback when MongoDB is disconnected. This guarantees instant out-of-the-box functionality.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-350">To connect your standard MongoDB instance:</p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-400">
                  <li>Open the backend configuration environment file: <span className="text-violet-400 font-mono">lifeflow-backend/.env</span></li>
                  <li>Assign your database cluster URI string to the variable: <span className="text-violet-400 font-mono">MONGODB_URI=mongodb://...</span></li>
                  <li>Restart the backend service. LifeFlow will automatically transition all tables.</li>
                </ol>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Backups & System Actions */}
        <div className="space-y-6">
          
          {/* Data backups card */}
          <div className="glass border border-slate-800 rounded-3xl p-6 space-y-6">
            <div>
              <h3 className="font-display font-extrabold text-base text-white">Data backup utilities</h3>
              <p className="text-xs text-slate-450 mt-1">Export schedules, streaks and notes data</p>
            </div>

            <div className="space-y-3">
              {/* Export */}
              <button
                onClick={handleExportData}
                className="w-full py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-300 font-bold hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
              >
                <Download className="h-4 w-4 text-violet-400" />
                <span>Export Local Data JSON</span>
              </button>

              {/* Import */}
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                  id="import-backup-file"
                />
                <label
                  htmlFor="import-backup-file"
                  className="w-full py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-300 font-bold hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
                >
                  <Upload className="h-4 w-4 text-emerald-450" />
                  <span>Restore Data Backup</span>
                </label>
              </div>

              {importStatus && (
                <div className={`text-[10px] font-bold text-center mt-2 ${importStatus.includes('successfully') ? 'text-emerald-400' : 'text-rose-450'}`}>
                  {importStatus}
                </div>
              )}
            </div>
          </div>

          {/* Destructive actions card */}
          <div className="glass border border-slate-800 rounded-3xl p-6 space-y-6">
            <div>
              <h3 className="font-display font-extrabold text-base text-rose-400/90">Destructive Actions</h3>
              <p className="text-xs text-slate-450 mt-1">Clear workspaces and delete accounts</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleClearCache}
                className="w-full py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all font-bold cursor-pointer text-xs flex items-center justify-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                <span>Reset Local Workspace</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-850 hover:border-slate-750 text-slate-400 hover:text-white transition-all font-bold cursor-pointer text-xs flex items-center justify-center gap-1.5"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out Account</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

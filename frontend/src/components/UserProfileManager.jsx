// ===========================================================================
// UserProfileManager.jsx — หน้าจัดการและแสดงผลโปรไฟล์นักฟุตบอล (Full CRUD Form & Profile Card)
// ===========================================================================

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  Video, 
  Trophy, 
  Briefcase, 
  Award, 
  Globe, 
  User, 
  Phone, 
  Mail, 
  Save, 
  Check, 
  AlertCircle,
  RefreshCw,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { API_ENDPOINTS } from '../config';

export function UserProfileManager() {
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('1');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Dynamic Array Inputs
  const [skillInput, setSkillInput] = useState('');
  const [socialInput, setSocialInput] = useState('');
  const [secPosInput, setSecPosInput] = useState('');

  // Default Form State
  const defaultProfile = {
    personal: {
      fullName: '',
      dob: '',
      height: 180,
      weight: 75,
      nationality: '',
    },
    contact: {
      phone: '',
      email: '',
      socialLinks: [],
      highlightVideoUrl: '',
    },
    playerInfo: {
      mainPosition: '',
      secondaryPositions: [],
    },
    careerHistory: [],
    honours: [],
    skills: [],
  };

  const [formData, setFormData] = useState(defaultProfile);

  // 1. ดึงข้อมูลโปรไฟล์จาก Backend
  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.profiles);
      if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลโปรไฟล์ได้');
      const data = await res.json();
      setProfiles(data);
      if (data.length > 0) {
        setFormData(data[0]);
        setSelectedProfileId(data[0].id);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'เชื่อมต่อกับ API Backend ไม่สำเร็จ' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  // เลือกลิสต์โปรไฟล์
  const handleSelectProfile = (profile) => {
    setFormData(profile);
    setSelectedProfileId(profile.id);
    setIsEditing(false);
  };

  // สร้างโปรไฟล์ใหม่
  const handleCreateNew = () => {
    setFormData({
      ...defaultProfile,
      personal: {
        fullName: 'นักเตะใหม่',
        dob: '2000-01-01',
        height: 180,
        weight: 75,
        nationality: 'Thailand',
      },
      contact: {
        phone: '0812345678',
        email: 'player@example.com',
        socialLinks: [],
        highlightVideoUrl: '',
      },
      playerInfo: {
        mainPosition: 'Forward',
        secondaryPositions: [],
      },
    });
    setSelectedProfileId(null);
    setIsEditing(true);
  };

  // Helper Nested Change
  const handlePersonalChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      personal: { ...prev.personal, [field]: value },
    }));
  };

  const handleContactChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      contact: { ...prev.contact, [field]: value },
    }));
  };

  const handlePlayerInfoChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      playerInfo: { ...prev.playerInfo, [field]: value },
    }));
  };

  // Career History
  const addCareer = () => {
    setFormData((prev) => ({
      ...prev,
      careerHistory: [...prev.careerHistory, { clubName: '', years: '', level: '' }],
    }));
  };

  const updateCareer = (index, field, value) => {
    const updated = [...formData.careerHistory];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, careerHistory: updated }));
  };

  const removeCareer = (index) => {
    setFormData((prev) => ({
      ...prev,
      careerHistory: prev.careerHistory.filter((_, i) => i !== index),
    }));
  };

  // Honours
  const addHonour = () => {
    setFormData((prev) => ({
      ...prev,
      honours: [...prev.honours, { title: '', year: new Date().getFullYear() }],
    }));
  };

  const updateHonour = (index, field, value) => {
    const updated = [...formData.honours];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, honours: updated }));
  };

  const removeHonour = (index) => {
    setFormData((prev) => ({
      ...prev,
      honours: prev.honours.filter((_, i) => i !== index),
    }));
  };

  // Add / Remove Arrays
  const addSkill = () => {
    if (!skillInput.trim()) return;
    setFormData((prev) => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }));
    setSkillInput('');
  };

  const removeSkill = (index) => {
    setFormData((prev) => ({ ...prev, skills: prev.skills.filter((_, i) => i !== index) }));
  };

  const addSocial = () => {
    if (!socialInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      contact: { ...prev.contact, socialLinks: [...prev.contact.socialLinks, socialInput.trim()] },
    }));
    setSocialInput('');
  };

  const removeSocial = (index) => {
    setFormData((prev) => ({
      ...prev,
      contact: {
        ...prev.contact,
        socialLinks: prev.contact.socialLinks.filter((_, i) => i !== index),
      },
    }));
  };

  const addSecPos = () => {
    if (!secPosInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      playerInfo: {
        ...prev.playerInfo,
        secondaryPositions: [...prev.playerInfo.secondaryPositions, secPosInput.trim()],
      },
    }));
    setSecPosInput('');
  };

  const removeSecPos = (index) => {
    setFormData((prev) => ({
      ...prev,
      playerInfo: {
        ...prev.playerInfo,
        secondaryPositions: prev.playerInfo.secondaryPositions.filter((_, i) => i !== index),
      },
    }));
  };

  // บันทึกข้อมูลไปยัง Backend (POST / PUT)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      let res;
      if (selectedProfileId) {
        // Update
        res = await fetch(API_ENDPOINTS.profileById(selectedProfileId), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        // Create
        res = await fetch(API_ENDPOINTS.profiles, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      if (!res.ok) throw new Error('บันทึกข้อมูลไม่สำเร็จ');
      const savedData = await res.json();
      
      setMessage({ type: 'success', text: 'บันทึกข้อมูลโปรไฟล์สำเร็จเรียบร้อย!' });
      setIsEditing(false);
      await fetchProfiles();
      setSelectedProfileId(savedData.id);
      setFormData(savedData);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    } finally {
      setSaving(false);
    }
  };

  // ลบโปรไฟล์
  const handleDelete = async (id) => {
    if (!window.confirm('คุณต้องการลบโปรไฟล์นี้หรือไม่?')) return;
    try {
      const res = await fetch(API_ENDPOINTS.profileById(id), { method: 'DELETE' });
      if (!res.ok) throw new Error('ลบไม่สำเร็จ');
      setMessage({ type: 'success', text: 'ลบโปรไฟล์สำเร็จ' });
      fetchProfiles();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'ไม่สามารถลบโปรไฟล์ได้' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <User className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-black text-gray-900">ระบบจัดการโปรไฟล์นักเตะ (User Profile)</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            สร้าง, แก้ไข และแสดงข้อมูลประวัติส่วนตัว สถิติ และผลงานของนักฟุตบอล
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleCreateNew}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> สร้างโปรไฟล์ใหม่
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
          >
            {isEditing ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            {isEditing ? 'ดูหน้าพรีวิวการ์ด' : 'แก้ไขข้อมูล'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className={`p-4 rounded-xl mb-6 flex items-center gap-2 text-sm font-medium ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {message.type === 'success' ? <Check className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Profile Selector (ถ้ามีหลายโปรไฟล์) */}
      {profiles.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectProfile(p)}
              className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition border ${
                selectedProfileId === p.id 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{p.personal?.fullName || `Profile #${p.id}`}</span>
              {selectedProfileId === p.id && profiles.length > 1 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(p.id);
                  }}
                  className="p-1 hover:bg-blue-700 rounded-md ml-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {isEditing ? (
        /* =========================================================================
           FORM MODE (แบบฟอร์มบันทึก / แก้ไขข้อมูล)
           ========================================================================= */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Personal Info */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" /> ข้อมูลส่วนตัว (Personal Info)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">ชื่อ-นามสกุล (Full Name) *</label>
                <input
                  type="text"
                  required
                  value={formData.personal?.fullName || ''}
                  onChange={(e) => handlePersonalChange('fullName', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
                  placeholder="เช่น Kevin De Bruyne"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">วัน/เดือน/ปีเกิด (Date of Birth) *</label>
                <input
                  type="date"
                  required
                  value={formData.personal?.dob || ''}
                  onChange={(e) => handlePersonalChange('dob', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">ส่วนสูง (Height in cm) *</label>
                <input
                  type="number"
                  required
                  value={formData.personal?.height || ''}
                  onChange={(e) => handlePersonalChange('height', Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">น้ำหนัก (Weight in kg) *</label>
                <input
                  type="number"
                  required
                  value={formData.personal?.weight || ''}
                  onChange={(e) => handlePersonalChange('weight', Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">สัญชาติ (Nationality) *</label>
                <input
                  type="text"
                  required
                  value={formData.personal?.nationality || ''}
                  onChange={(e) => handlePersonalChange('nationality', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
                  placeholder="เช่น Belgium, Thailand, England"
                />
              </div>
            </div>
          </div>

          {/* 2. Contact & Media */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-600" /> ข้อมูลติดต่อ & สื่อไฮไลท์ (Contact & Media)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">เบอร์โทรศัพท์ (Phone) *</label>
                <input
                  type="tel"
                  required
                  value={formData.contact?.phone || ''}
                  onChange={(e) => handleContactChange('phone', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">อีเมล (Email) *</label>
                <input
                  type="email"
                  required
                  value={formData.contact?.email || ''}
                  onChange={(e) => handleContactChange('email', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">ลิงก์วิดีโอไฮไลท์ (Highlight Video URL)</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={formData.contact?.highlightVideoUrl || ''}
                  onChange={(e) => handleContactChange('highlightVideoUrl', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">ลิงก์ Social Media</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="url"
                    placeholder="https://instagram.com/..."
                    value={socialInput}
                    onChange={(e) => setSocialInput(e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={addSocial}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition"
                  >
                    เพิ่มลิงก์
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.contact?.socialLinks?.map((link, idx) => (
                    <span key={idx} className="bg-gray-100 border border-gray-200 px-3 py-1 rounded-lg text-xs flex items-center gap-2 text-gray-700">
                      <Globe className="w-3 h-3 text-blue-600" />
                      {link}
                      <button type="button" onClick={() => removeSocial(idx)} className="text-rose-500 hover:text-rose-700">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Player Info (Positions) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" /> ตำแหน่งการเล่น (Player Position)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">ตำแหน่งหลัก (Main Position) *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น Striker (ST), Playmaker (CAM)"
                  value={formData.playerInfo?.mainPosition || ''}
                  onChange={(e) => handlePlayerInfoChange('mainPosition', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">ตำแหน่งรอง (Secondary Positions)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="เช่น LW, RW, CM"
                    value={secPosInput}
                    onChange={(e) => setSecPosInput(e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={addSecPos}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition"
                  >
                    เพิ่ม
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.playerInfo?.secondaryPositions?.map((pos, idx) => (
                    <span key={idx} className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-lg text-xs flex items-center gap-2 font-medium">
                      {pos}
                      <button type="button" onClick={() => removeSecPos(idx)} className="text-rose-500 hover:text-rose-700">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Career History */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" /> ประวัติการเล่นกับสโมสร (Career History)
              </h2>
              <button
                type="button"
                onClick={addCareer}
                className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" /> เพิ่มสโมสร
              </button>
            </div>
            {formData.careerHistory?.length === 0 && (
              <p className="text-xs text-gray-400 py-2">ยังไม่มีข้อมูลประวัติสโมสร กดปุ่ม "เพิ่มสโมสร" ด้านบนเพื่อเพิ่ม</p>
            )}
            {formData.careerHistory?.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200 items-center">
                <input
                  type="text"
                  placeholder="ชื่อสโมสร"
                  value={item.clubName}
                  onChange={(e) => updateCareer(idx, 'clubName', e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg p-2 text-sm text-gray-900 focus:border-blue-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="ช่วงปี เช่น 2019 - 2023"
                  value={item.years}
                  onChange={(e) => updateCareer(idx, 'years', e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg p-2 text-sm text-gray-900 focus:border-blue-500 outline-none"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ระดับลีก / U23 / อาชีพ"
                    value={item.level}
                    onChange={(e) => updateCareer(idx, 'level', e.target.value)}
                    className="flex-1 bg-white border border-gray-200 rounded-lg p-2 text-sm text-gray-900 focus:border-blue-500 outline-none"
                  />
                  <button type="button" onClick={() => removeCareer(idx)} className="p-2 text-rose-500 hover:text-rose-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 5. Honours */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-blue-600" /> ถ้วยรางวัล & เกียรติประวัติ (Honours)
              </h2>
              <button
                type="button"
                onClick={addHonour}
                className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" /> เพิ่มรางวัล
              </button>
            </div>
            {formData.honours?.length === 0 && (
              <p className="text-xs text-gray-400 py-2">ยังไม่มีข้อมูลถ้วยรางวัล กดปุ่ม "เพิ่มรางวัล" ด้านบนเพื่อเพิ่ม</p>
            )}
            {formData.honours?.map((item, idx) => (
              <div key={idx} className="flex gap-3 mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200 items-center">
                <input
                  type="text"
                  placeholder="ชื่อถ้วยรางวัล / เกียรติประวัติ"
                  value={item.title}
                  onChange={(e) => updateHonour(idx, 'title', e.target.value)}
                  className="flex-1 bg-white border border-gray-200 rounded-lg p-2 text-sm text-gray-900 focus:border-blue-500 outline-none"
                />
                <input
                  type="number"
                  placeholder="ปี ค.ศ."
                  value={item.year}
                  onChange={(e) => updateHonour(idx, 'year', Number(e.target.value))}
                  className="w-28 bg-white border border-gray-200 rounded-lg p-2 text-sm text-gray-900 focus:border-blue-500 outline-none"
                />
                <button type="button" onClick={() => removeHonour(idx)} className="p-2 text-rose-500 hover:text-rose-700">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* 6. Skills */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" /> ทักษะและความสามารถพิเศษ (Skills)
            </h2>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="เช่น การยิงฟรีคิก, ความเร็ว, การเลี้ยงบอลทะลุช่อง"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition"
              >
                เพิ่มทักษะ
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills?.map((skill, idx) => (
                <span key={idx} className="bg-blue-50 border border-blue-200 text-blue-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                  {skill}
                  <button type="button" onClick={() => removeSkill(idx)} className="text-rose-500 hover:text-rose-700">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'กำลังบันทึกข้อมูล...' : 'บันทึกโปรไฟล์ไปยังระบบ (Save Profile)'}
          </button>
        </form>
      ) : (
        /* =========================================================================
           DISPLAY CARD MODE (หน้าพรีวิวข้อมูลโปรไฟล์สวยงาม)
           ========================================================================= */
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-100/40 via-transparent to-transparent pointer-events-none rounded-full blur-2xl"></div>

            {/* Profile Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-gray-100 relative">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">{formData.personal?.fullName || 'ไม่ได้ระบุชื่อ'}</h2>
                  <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full">
                    Active Player
                  </span>
                </div>
                <div className="flex items-center gap-2 text-blue-600 font-bold mt-2">
                  <span>{formData.playerInfo?.mainPosition || 'ตำแหน่งหลัก'}</span>
                  {formData.playerInfo?.secondaryPositions?.length > 0 && (
                    <span className="text-gray-400 font-normal text-sm">
                      ({formData.playerInfo.secondaryPositions.join(', ')})
                    </span>
                  )}
                </div>
              </div>

              {formData.contact?.highlightVideoUrl && (
                <a
                  href={formData.contact.highlightVideoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 rounded-xl text-white text-sm font-bold shadow-md shadow-rose-600/20 transition"
                >
                  <Video className="w-4 h-4" /> ดูวิดีโอไฮไลท์
                </a>
              )}
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-gray-100">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">สัญชาติ</span>
                <span className="font-extrabold text-gray-900 text-base">{formData.personal?.nationality || '-'}</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">วันเกิด</span>
                <span className="font-extrabold text-gray-900 text-base">{formData.personal?.dob || '-'}</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">ส่วนสูง</span>
                <span className="font-extrabold text-gray-900 text-base">{formData.personal?.height} ซม.</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">น้ำหนัก</span>
                <span className="font-extrabold text-gray-900 text-base">{formData.personal?.weight} กก.</span>
              </div>
            </div>

            {/* Career & Honours 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-gray-100">
              {/* Career History */}
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" /> ประวัติสโมสร (Club Career)
                </h3>
                <div className="space-y-3">
                  {formData.careerHistory?.length > 0 ? (
                    formData.careerHistory.map((item, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100 border-l-4 border-l-blue-600">
                        <p className="font-bold text-gray-900 text-sm">{item.clubName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.years} • {item.level}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">ไม่มีข้อมูลประวัติสโมสร</p>
                  )}
                </div>
              </div>

              {/* Honours */}
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" /> รางวัลเกียรติยศ (Honours)
                </h3>
                <div className="space-y-2.5">
                  {formData.honours?.length > 0 ? (
                    formData.honours.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl text-sm">
                        <span className="font-bold text-gray-800">{item.title}</span>
                        <span className="text-amber-700 font-extrabold text-xs px-2 py-0.5 bg-white rounded-md border border-amber-200">
                          {item.year}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">ไม่มีข้อมูลถ้วยรางวัล</p>
                  )}
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="py-6 border-b border-gray-100">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" /> ทักษะและความโดดเด่น
              </h3>
              <div className="flex flex-wrap gap-2">
                {formData.skills?.map((skill, idx) => (
                  <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-200 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-2xs">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Contact Details */}
            <div className="pt-6 flex flex-wrap gap-6 text-sm text-gray-600 items-center">
              <div className="flex items-center gap-2 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200">
                <Phone className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-800">{formData.contact?.phone || '-'}</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-800">{formData.contact?.email || '-'}</span>
              </div>
              {formData.contact?.socialLinks?.map((link, idx) => (
                <a
                  key={idx}
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold text-xs bg-blue-50 px-3 py-2 rounded-xl border border-blue-100"
                >
                  <Globe className="w-3.5 h-3.5" /> โซเชียล #{idx + 1}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

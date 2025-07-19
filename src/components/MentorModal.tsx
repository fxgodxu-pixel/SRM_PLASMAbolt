import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { User } from '../types';

interface MentorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mentor: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => void;
  mentor?: User | null;
}

const MentorModal: React.FC<MentorModalProps> = ({ isOpen, onClose, onSave, mentor }) => {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    isActive: true,
  });
  const [showPassword, setShowPassword] = useState(false);

  const departments = [
    'Cyber Security',
    'Gaming Technology',
    'Computer Science',
    'Information Technology',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'Chemical Engineering',
    'Biotechnology',
  ];

  useEffect(() => {
    if (mentor) {
      setFormData({
        username: mentor.username,
        name: mentor.name,
        email: mentor.email || '',
        phone: mentor.phone || '',
        department: mentor.department || '',
        isActive: mentor.isActive,
      });
    } else {
      setFormData({
        username: '',
        name: '',
        email: '',
        phone: '',
        department: '',
        isActive: true,
      });
    }
  }, [mentor, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSave({
      username: formData.username,
      role: 'mentor',
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      department: formData.department,
      isActive: formData.isActive,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {mentor ? 'Edit Mentor' : 'Add New Mentor'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Close"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="input-field"
                placeholder="e.g., mentor5"
                disabled={!!mentor} // Disable editing username for existing mentors
              />
              {mentor && (
                <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="e.g., Dr. John Smith"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                placeholder="john.smith@university.edu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
                placeholder="+1-555-0123"
              />
            </div>
          </div>

          <div>
            <label htmlFor="department-select" className="block text-sm font-medium text-gray-700 mb-1">
              Department *
            </label>
            <select
              id="department-select"
              required
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="select-field"
            >
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active Account
            </label>
          </div>

          {!mentor && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Default Password:</strong> mentor123
              </p>
              <p className="text-xs text-blue-600 mt-1">
                The mentor can change their password after first login. Admin can reset passwords anytime.
              </p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
            >
              {mentor ? 'Update' : 'Add'} Mentor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MentorModal;
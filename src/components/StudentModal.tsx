import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import { Student } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useDepartments } from '../utils/departmentUtils';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => void;
  student?: Student | null;
}

const StudentModal: React.FC<StudentModalProps> = ({ isOpen, onClose, onSave, student }) => {
  const { user, mentors } = useAuth();
  const { departmentNames } = useDepartments();
  const [formData, setFormData] = useState({
    rollNumber: '',
    studentName: '',
    email: '',
    personalEmail: '',
    mobileNumber: '',
    department: '',
    section: '',
    gender: '' as 'Male' | 'Female' | 'Other' | '',
    dateOfBirth: '',
    numberOfBacklogs: '',
    resumeLink: '',
    mentorId: user?.role === 'mentor' ? user.id : '',
    tenthPercentage: '',
    twelfthPercentage: '',
    ugPercentage: '',
    cgpa: '',
    status: 'eligible' as 'eligible' | 'ineligible' | 'higher_studies',
  });
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const activeMentors = mentors.filter(mentor => mentor.role === 'mentor' && mentor.isActive);

  const statusOptions = [
    { value: 'eligible', label: 'Eligible' },
    { value: 'ineligible', label: 'Ineligible' },
    { value: 'higher_studies', label: 'Higher Studies' },
  ];

  const sections = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  useEffect(() => {
    if (student) {
      setFormData({
        rollNumber: student.rollNumber,
        studentName: student.studentName,
        email: student.email,
        personalEmail: student.personalEmail || '',
        mobileNumber: student.mobileNumber,
        department: student.department,
        section: student.section,
        gender: student.gender || '',
        dateOfBirth: student.dateOfBirth || '',
        numberOfBacklogs: student.numberOfBacklogs?.toString() || '',
        resumeLink: student.resumeLink || '',
        mentorId: student.mentorId,
        tenthPercentage: student.academicDetails.tenthPercentage.toString(),
        twelfthPercentage: student.academicDetails.twelfthPercentage.toString(),
        ugPercentage: student.academicDetails.ugPercentage.toString(),
        cgpa: student.academicDetails.cgpa?.toString() || '',
        status: student.status === 'placed' ? 'eligible' : student.status,
      });
      setPhotoPreview(student.photoUrl || '');
    } else {
      setFormData({
        rollNumber: '',
        studentName: '',
        email: '',
        personalEmail: '',
        mobileNumber: '',
        department: '',
        section: '',
        gender: '',
        dateOfBirth: '',
        numberOfBacklogs: '',
        resumeLink: '',
        mentorId: user?.role === 'mentor' ? user.id : '',
        tenthPercentage: '',
        twelfthPercentage: '',
        ugPercentage: '',
        cgpa: '',
        status: 'eligible',
      });
      setPhotoFile(null);
      setPhotoPreview('');
    }
  }, [student, isOpen, user]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (JPG, PNG, GIF, etc.)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Photo size must be less than 5MB');
        return;
      }
      
      setPhotoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
  };
  
  const uploadPhotoToStorage = async (file: File): Promise<string> => {
    // Simulate photo upload - in real app, upload to cloud storage
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate a mock URL - in real app, this would be the actual uploaded URL
        const mockUrl = `https://storage.example.com/photos/${Date.now()}_${file.name}`;
        resolve(mockUrl);
      }, 1000);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitForm = async () => {
      setIsUploadingPhoto(true);
      
      let photoUrl = photoPreview;
      
      // Upload photo if a new file is selected
      if (photoFile) {
        try {
          photoUrl = await uploadPhotoToStorage(photoFile);
        } catch (error) {
          alert('Failed to upload photo. Please try again.');
          setIsUploadingPhoto(false);
          return;
        }
      }
      
    const tenthPercentage = parseFloat(formData.tenthPercentage);
    const twelfthPercentage = parseFloat(formData.twelfthPercentage);
    const ugPercentage = parseFloat(formData.ugPercentage);
    const cgpa = formData.cgpa ? parseFloat(formData.cgpa) : undefined;

    // Determine eligibility based on academic performance (UG is out of 10)
    let finalStatus = formData.status;
    const ugEligible = ugPercentage >= 6.0; // UG out of 10
    const cgpaEligible = !cgpa || cgpa >= 6.0; // CGPA check only if provided
    
    if (tenthPercentage >= 60 && twelfthPercentage >= 60 && ugEligible && cgpaEligible) {
      finalStatus = 'eligible';
    } else {
      finalStatus = 'ineligible';
    }

    onSave({
      rollNumber: formData.rollNumber,
      studentName: formData.studentName,
      email: formData.email,
      personalEmail: formData.personalEmail || undefined,
      mobileNumber: formData.mobileNumber,
      department: formData.department,
      section: formData.section,
      gender: formData.gender || undefined,
      dateOfBirth: formData.dateOfBirth || undefined,
      numberOfBacklogs: formData.numberOfBacklogs ? parseInt(formData.numberOfBacklogs) : undefined,
      resumeLink: formData.resumeLink || undefined,
      photoUrl: photoUrl || undefined,
      mentorId: formData.mentorId,
      academicDetails: {
        tenthPercentage,
        twelfthPercentage,
        ugPercentage,
        cgpa,
      },
      status: finalStatus,
    });
      
      setIsUploadingPhoto(false);
    onClose();
    };
    
    submitForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {student ? 'Edit Student' : 'Add New Student'}
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Roll Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.rollNumber}
                  onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                  className="input-field"
                  placeholder="e.g., 2024CS001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  className="input-field"
                  placeholder="e.g., John Doe"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Official Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  placeholder="e.g., john.doe@student.university.edu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personal Email Address
                </label>
                <input
                  type="email"
                  value={formData.personalEmail}
                  onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                  className="input-field"
                  placeholder="e.g., john.personal@gmail.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  className="input-field"
                  placeholder="e.g., +1-555-0123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Male' | 'Female' | 'Other' | '' })}
                  className="select-field"
                  aria-label="Gender"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Academic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <select
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="select-field"
                  aria-label="Department"
                >
                  <option value="">Select Department</option>
                  {departmentNames.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section *
                </label>
                <select
                  required
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="select-field"
                  aria-label="Section"
                >
                  <option value="">Select Section</option>
                  {sections.map(section => (
                    <option key={section} value={section}>Section {section}</option>
                  ))}
                </select>
              </div>
              {user?.role === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mentor *
                  </label>
                  <select
                    required
                    value={formData.mentorId}
                    onChange={(e) => setFormData({ ...formData, mentorId: e.target.value })}
                    className="select-field"
                    aria-label="Mentor"
                  >
                    <option value="">Select Mentor</option>
                    {activeMentors.map(mentor => (
                      <option key={mentor.id} value={mentor.id}>{mentor.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Academic Performance */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Academic Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  10th Percentage *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  value={formData.tenthPercentage}
                  onChange={(e) => setFormData({ ...formData, tenthPercentage: e.target.value })}
                  className="input-field"
                  placeholder="e.g., 85.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  12th Percentage *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  value={formData.twelfthPercentage}
                  onChange={(e) => setFormData({ ...formData, twelfthPercentage: e.target.value })}
                  className="input-field"
                  placeholder="e.g., 78.2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  UG CGPA (out of 10) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  required
                  value={formData.ugPercentage}
                  onChange={(e) => setFormData({ ...formData, ugPercentage: e.target.value })}
                  className="input-field"
                  placeholder="e.g., 7.74"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CGPA
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={formData.cgpa}
                  onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                  className="input-field"
                  placeholder="e.g., 8.5"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Backlogs
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.numberOfBacklogs}
                  onChange={(e) => setFormData({ ...formData, numberOfBacklogs: e.target.value })}
                  className="input-field"
                  placeholder="e.g., 0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resume Link
                </label>
                <input
                  type="url"
                  value={formData.resumeLink}
                  onChange={(e) => setFormData({ ...formData, resumeLink: e.target.value })}
                  className="input-field"
                  placeholder="e.g., https://drive.google.com/file/d/..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student Photo
                </label>
                <div className="space-y-3">
                  {photoPreview && (
                    <div className="flex items-center space-x-3">
                      <img 
                        src={photoPreview} 
                        alt="Student photo preview"
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Remove Photo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="btn-secondary flex items-center space-x-2 cursor-pointer"
                    >
                      <Upload className="h-4 w-4" />
                      <span>{photoPreview ? 'Change Photo' : 'Upload Photo'}</span>
                    </label>
                    <span className="text-xs text-gray-500">
                      Max 5MB • JPG, PNG, GIF
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="select-field"
              aria-label="Status"
            >
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Eligibility Rules:</strong> Students must have:
              <br />• 10th Percentage ≥ 60%
              <br />• 12th Percentage ≥ 60% 
              <br />• UG CGPA ≥ 6.0 (out of 10)
              <br />• CGPA ≥ 6.0 (if provided)
              <br />Students not meeting these criteria will be automatically marked as ineligible for placement.
            </p>
          </div>

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
              disabled={isUploadingPhoto}
              className="btn-primary flex-1"
            >
              {isUploadingPhoto ? 'Uploading...' : (student ? 'Update' : 'Add')} Student
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentModal;
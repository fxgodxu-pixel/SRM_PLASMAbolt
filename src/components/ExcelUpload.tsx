import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download, Info } from 'lucide-react';
import { parseStudentsFromExcel, generateExcelTemplate } from '../utils/excelUtils';
import { Student } from '../types';
import { useDepartments } from '../utils/departmentUtils';

interface ExcelUploadProps {
  onUpload: (students: Student[]) => void;
}

const ExcelUpload: React.FC<ExcelUploadProps> = ({ onUpload }) => {
  const { activeDepartments } = useDepartments();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadedCount, setUploadedCount] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      const students = await parseStudentsFromExcel(file, activeDepartments);
      onUpload(students);
      setUploadedCount(students.length);
      setUploadStatus('success');
      setUploadMessage(`Successfully imported ${students.length} student records`);
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage('Failed to parse Excel file. Please check the format and try again.');
      console.error('Excel import error:', error);
    } finally {
      setIsUploading(false);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  const handleDownloadTemplate = () => {
    generateExcelTemplate();
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Import Student Data</h3>
        <button
          onClick={handleDownloadTemplate}
          className="btn-secondary flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Download Template</span>
        </button>
      </div>
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          {isUploading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          ) : (
            <FileSpreadsheet className="h-12 w-12 text-gray-400" />
          )}
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragActive ? 'Drop the file here' : 'Drag & drop Excel file here'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or click to select file (.xlsx, .xls, .csv)
            </p>
          </div>
          
          {!isUploading && (
            <button className="btn-primary">
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </button>
          )}
        </div>
      </div>

      {uploadStatus !== 'idle' && (
        <div className={`mt-4 p-4 rounded-lg flex items-center space-x-2 ${
          uploadStatus === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {uploadStatus === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{uploadMessage}</span>
        </div>
      )}

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">Excel Import Format Requirements:</p>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-green-700">✅ Flexible Column Matching:</p>
                <p className="text-sm mt-1">The system automatically detects columns regardless of order or exact naming. Missing data will be left empty and can be edited later.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Supported Column Names:</p>
                  <div className="text-xs mt-2 space-y-1">
                    <div><strong>REG NO:</strong> "REG NO", "Roll Number", "Roll No", "Student ID", "ID"</div>
                    <div><strong>NAME:</strong> "NAME", "Student Name", "Name", "Full Name"</div>
                    <div><strong>Official Email:</strong> "OFFICIAL MAIL.ID", "Email", "Official Email"</div>
                    <div><strong>Personal Email:</strong> "PERSONAL  MAIL ID", "Personal Email"</div>
                    <div><strong>Mobile:</strong> "MOBILE NUMBER", "Mobile Number", "Phone"</div>
                    <div><strong>Department:</strong> "DEPARTMENT", "Department", "Dept"</div>
                    <div><strong>Gender:</strong> "GENDER", "Gender", "Sex"</div>
                    <div><strong>DOB:</strong> "DOB", "Date of Birth", "Birth Date"</div>
                  </div>
                </div>
                <div>
                  <p className="font-medium">Academic & Additional:</p>
                  <div className="text-xs mt-2 space-y-1">
                    <div><strong>10th %:</strong> "10th Percentage", "10th %", "Class 10", "SSC"</div>
                    <div><strong>12th %:</strong> "12th Percentage", "12th %", "HSC", "Intermediate"</div>
                    <div><strong>CGPA:</strong> "CGPA", "GPA", "UG Percentage", "Grade Point Average"</div>
                    <div><strong>Backlogs:</strong> "NO OF BACKLOG", "Number of Backlogs", "Backlogs"</div>
                    <div><strong>Resume:</strong> "RESUME LINK", "Resume Link", "CV Link"</div>
                    <div><strong>Photo:</strong> "pHoto", "Photo URL", "Photo Link", "Image URL"</div>
                    <div><strong>Company:</strong> "Company", "Company Name", "Employer"</div>
                    <div><strong>Package:</strong> "Package (LPA)", "Package", "Salary", "CTC"</div>
                    <div><strong>Date:</strong> "Placement Date", "Joining Date"</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <p className="font-medium text-green-800">Smart Import Features:</p>
                <ul className="list-disc list-inside text-xs mt-1 space-y-1 text-green-700">
                  <li><strong>Any Column Order:</strong> Columns can be in any sequence</li>
                  <li><strong>Flexible Naming:</strong> Multiple accepted names for each field</li>
                  <li><strong>Missing Data OK:</strong> Empty fields will be left blank for later editing</li>
                  <li><strong>Auto-Detection:</strong> System automatically maps your columns</li>
                  <li><strong>Safe Import:</strong> Invalid data won't break the import process</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-100 rounded">
              <p className="font-medium">Eligibility Rules:</p>
              <p>Students with less than 60% in any of 10th, 12th, or UG will be automatically marked as ineligible for placement.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded">
        <p className="font-medium text-gray-700 mb-2">Example Excel Formats (All Valid):</p>
        <div className="text-xs text-gray-600 space-y-1">
          <div><strong>Format 1:</strong> REG NO | NAME | DEPARTMENT | GENDER | DOB | 10th % | 12th % | CGPA | NO OF BACKLOG | OFFICIAL MAIL.ID | PERSONAL  MAIL ID | MOBILE NUMBER | RESUME LINK | pHoto</div>
          <div><strong>Format 2:</strong> Roll Number | Student Name | Email | Department | Gender | Date of Birth | 10th % | 12th % | CGPA | Backlogs | Resume Link | Photo URL</div>
          <div><strong>Format 3:</strong> ID | Name | Official Email | Personal Email | Phone | Dept | Sex | Birth Date | Class 10 | HSC | GPA | CV Link</div>
          <p className="text-blue-600 mt-2">💡 <strong>Tip:</strong> Use any column names you prefer - the system will automatically match them!</p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <p className="font-medium text-yellow-800 mb-2">Default Values for Missing Data:</p>
        <ul className="list-disc list-inside text-xs text-yellow-700 space-y-1">
          <li><strong>REG NO:</strong> Auto-generated if missing</li>
          <li><strong>Section:</strong> Defaults to "A" if not provided</li>
          <li><strong>Mentor:</strong> Assigned to first available mentor</li>
          <li><strong>Academic Data:</strong> Defaults to 0 if missing (can be edited later)</li>
          <li><strong>Gender/DOB:</strong> Left empty if not provided</li>
          <li><strong>Links:</strong> Resume and photo links left empty if not provided</li>
          <li><strong>Photos:</strong> Must be uploaded individually through the student edit form</li>
          <li><strong>Other Fields:</strong> Left empty for manual entry</li>
        </ul>
      </div>
    </div>
  );
};

export default ExcelUpload;
import React, { createContext, useContext, useState, useEffect } from 'react';
import { PlacementRecord, Student, FilterOptions } from '../types';
import { useAuth } from './AuthContext';
import { useEnvironment } from './EnvironmentContext';
import { useDepartments } from '../utils/departmentUtils';
import { supabase, DatabaseStudent, DatabasePlacementRecord } from '../lib/supabase';

interface DataContextType {
  students: Student[];
  filteredStudents: Student[];
  filters: FilterOptions;
  setFilters: (filters: FilterOptions) => void;
  addStudent: (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateStudent: (id: string, student: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  addPlacementRecord: (studentId: string, record: Omit<PlacementRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePlacementRecord: (studentId: string, record: Partial<PlacementRecord>) => Promise<void>;
  importStudents: (students: Student[]) => Promise<void>;
  clearFilters: () => void;
  getStudentsByMentor: (mentorId: string) => Student[];
  getMentorStudents: () => Student[];
  showMyStudentsOnly: boolean;
  setShowMyStudentsOnly: (show: boolean) => void;
  showInactiveDepartments: boolean;
  setShowInactiveDepartments: (show: boolean) => void;
  isLoading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const initialFilters: FilterOptions = {
  department: '',
  section: '',
  company: '',
  year: '',
  mentor: '',
  status: '',
  packageRange: { min: 0, max: 0 },
  dateRange: { start: '', end: '' },
  search: '',
};

// Convert database student to app student format
const convertDatabaseStudent = (dbStudent: DatabaseStudent, placementRecord?: DatabasePlacementRecord): Student => {
  return {
    id: dbStudent.id,
    rollNumber: dbStudent.roll_number,
    studentName: dbStudent.student_name,
    email: dbStudent.email,
    personalEmail: dbStudent.personal_email,
    mobileNumber: dbStudent.mobile_number,
    department: dbStudent.department,
    section: dbStudent.section,
    gender: dbStudent.gender as 'Male' | 'Female' | 'Other' | undefined,
    dateOfBirth: dbStudent.date_of_birth,
    numberOfBacklogs: dbStudent.number_of_backlogs,
    resumeLink: dbStudent.resume_link,
    photoUrl: dbStudent.photo_url,
    mentorId: dbStudent.mentor_id,
    academicDetails: {
      tenthPercentage: dbStudent.tenth_percentage,
      twelfthPercentage: dbStudent.twelfth_percentage,
      ugPercentage: dbStudent.ug_percentage,
      cgpa: dbStudent.cgpa,
    },
    status: dbStudent.status,
    placementRecord: placementRecord ? {
      id: placementRecord.id,
      studentName: dbStudent.student_name,
      rollNumber: dbStudent.roll_number,
      department: dbStudent.department,
      company: placementRecord.company,
      package: placementRecord.package,
      placementDate: placementRecord.placement_date,
      mentorId: dbStudent.mentor_id,
      createdAt: placementRecord.created_at,
      updatedAt: placementRecord.updated_at,
    } : undefined,
    createdAt: dbStudent.created_at,
    updatedAt: dbStudent.updated_at,
  };
};

// Convert app student to database format
const convertToDatabase = (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Omit<DatabaseStudent, 'id' | 'created_at' | 'updated_at'> => {
  return {
    roll_number: student.rollNumber,
    student_name: student.studentName,
    email: student.email,
    personal_email: student.personalEmail,
    mobile_number: student.mobileNumber,
    department: student.department,
    section: student.section,
    gender: student.gender,
    date_of_birth: student.dateOfBirth,
    number_of_backlogs: student.numberOfBacklogs,
    resume_link: student.resumeLink,
    photo_url: student.photoUrl,
    mentor_id: student.mentorId,
    tenth_percentage: student.academicDetails.tenthPercentage,
    twelfth_percentage: student.academicDetails.twelfthPercentage,
    ug_percentage: student.academicDetails.ugPercentage,
    cgpa: student.academicDetails.cgpa,
    status: student.status,
  };
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { currentEnvironment } = useEnvironment();
  const { activeDepartments } = useDepartments();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);
  const [showMyStudentsOnly, setShowMyStudentsOnly] = useState(false);
  const [showInactiveDepartments, setShowInactiveDepartments] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load students from database
  const loadStudents = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch students with their placement records
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*');

      if (studentsError) throw studentsError;

      const { data: placementData, error: placementError } = await supabase
        .from('placement_records')
        .select('*');

      if (placementError) throw placementError;

      // Convert and combine data
      const convertedStudents = studentsData.map(dbStudent => {
        const placementRecord = placementData.find(p => p.student_id === dbStudent.id);
        return convertDatabaseStudent(dbStudent, placementRecord);
      });

      setStudents(convertedStudents);
    } catch (err) {
      console.error('Error loading students:', err);
      setError('Failed to load students. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    // Apply filters whenever filters, students, user, or showMyStudentsOnly changes
    let filtered = [...students];

    // Filter out students from inactive departments unless explicitly showing them
    if (!showInactiveDepartments) {
      const activeDepartmentNames = activeDepartments.map(dept => dept.name);
      filtered = filtered.filter(student => 
        activeDepartmentNames.includes(student.department)
      );
    }

    // First apply mentor filter if showMyStudentsOnly is true
    if (user?.role === 'mentor' && showMyStudentsOnly) {
      filtered = filtered.filter(student => student.mentorId === user.id);
    }

    // Then apply all other filters
    if (filters.department) {
      filtered = filtered.filter(student => 
        student.department.toLowerCase().includes(filters.department.toLowerCase())
      );
    }

    if (filters.section) {
      filtered = filtered.filter(student => 
        student.section === filters.section
      );
    }

    if (filters.company && filters.company !== '') {
      filtered = filtered.filter(student => 
        student.placementRecord?.company.toLowerCase().includes(filters.company.toLowerCase())
      );
    }

    if (filters.year) {
      filtered = filtered.filter(student => 
        student.placementRecord && 
        new Date(student.placementRecord.placementDate).getFullYear().toString() === filters.year
      );
    }

    if (filters.mentor && user?.role === 'admin') {
      filtered = filtered.filter(student => student.mentorId === filters.mentor);
    }

    if (filters.status) {
      filtered = filtered.filter(student => student.status === filters.status);
    }

    if (filters.packageRange.min > 0 || filters.packageRange.max > 0) {
      filtered = filtered.filter(student => {
        if (!student.placementRecord) return false;
        const pkg = student.placementRecord.package;
        const min = filters.packageRange.min || 0;
        const max = filters.packageRange.max || Infinity;
        return pkg >= min && pkg <= max;
      });
    }

    if (filters.dateRange.start && filters.dateRange.end) {
      filtered = filtered.filter(student => {
        if (!student.placementRecord) return false;
        const date = new Date(student.placementRecord.placementDate);
        const start = new Date(filters.dateRange.start);
        const end = new Date(filters.dateRange.end);
        return date >= start && date <= end;
      });
    }

    if (filters.search) {
      filtered = filtered.filter(student => 
        student.studentName.toLowerCase().includes(filters.search.toLowerCase()) ||
        student.rollNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
        student.department.toLowerCase().includes(filters.search.toLowerCase()) ||
        (student.placementRecord?.company.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    setFilteredStudents(filtered);
  }, [students, filters, user, showMyStudentsOnly, showInactiveDepartments, activeDepartments]);

  const addStudent = async (studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      const dbStudent = convertToDatabase(studentData);
      
      const { data, error } = await supabase
        .from('students')
        .insert([dbStudent])
        .select()
        .single();

      if (error) throw error;

      const newStudent = convertDatabaseStudent(data);
      setStudents(prev => [...prev, newStudent]);
    } catch (err) {
      console.error('Error adding student:', err);
      setError('Failed to add student. Please try again.');
      throw err;
    }
  };

  const updateStudent = async (id: string, updatedStudent: Partial<Student>) => {
    try {
      setError(null);
      
      // Convert partial student data to database format
      const updateData: any = {};
      
      if (updatedStudent.rollNumber) updateData.roll_number = updatedStudent.rollNumber;
      if (updatedStudent.studentName) updateData.student_name = updatedStudent.studentName;
      if (updatedStudent.email) updateData.email = updatedStudent.email;
      if (updatedStudent.personalEmail !== undefined) updateData.personal_email = updatedStudent.personalEmail;
      if (updatedStudent.mobileNumber) updateData.mobile_number = updatedStudent.mobileNumber;
      if (updatedStudent.department) updateData.department = updatedStudent.department;
      if (updatedStudent.section) updateData.section = updatedStudent.section;
      if (updatedStudent.gender !== undefined) updateData.gender = updatedStudent.gender;
      if (updatedStudent.dateOfBirth !== undefined) updateData.date_of_birth = updatedStudent.dateOfBirth;
      if (updatedStudent.numberOfBacklogs !== undefined) updateData.number_of_backlogs = updatedStudent.numberOfBacklogs;
      if (updatedStudent.resumeLink !== undefined) updateData.resume_link = updatedStudent.resumeLink;
      if (updatedStudent.photoUrl !== undefined) updateData.photo_url = updatedStudent.photoUrl;
      if (updatedStudent.mentorId) updateData.mentor_id = updatedStudent.mentorId;
      if (updatedStudent.status) updateData.status = updatedStudent.status;
      
      if (updatedStudent.academicDetails) {
        if (updatedStudent.academicDetails.tenthPercentage !== undefined) {
          updateData.tenth_percentage = updatedStudent.academicDetails.tenthPercentage;
        }
        if (updatedStudent.academicDetails.twelfthPercentage !== undefined) {
          updateData.twelfth_percentage = updatedStudent.academicDetails.twelfthPercentage;
        }
        if (updatedStudent.academicDetails.ugPercentage !== undefined) {
          updateData.ug_percentage = updatedStudent.academicDetails.ugPercentage;
        }
        if (updatedStudent.academicDetails.cgpa !== undefined) {
          updateData.cgpa = updatedStudent.academicDetails.cgpa;
        }
      }

      const { data, error } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Get placement record if exists
      const { data: placementData } = await supabase
        .from('placement_records')
        .select('*')
        .eq('student_id', id)
        .single();

      const updatedStudentData = convertDatabaseStudent(data, placementData);
      setStudents(prev => prev.map(student => 
        student.id === id ? updatedStudentData : student
      ));
    } catch (err) {
      console.error('Error updating student:', err);
      setError('Failed to update student. Please try again.');
      throw err;
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setStudents(prev => prev.filter(student => student.id !== id));
    } catch (err) {
      console.error('Error deleting student:', err);
      setError('Failed to delete student. Please try again.');
      throw err;
    }
  };

  const addPlacementRecord = async (studentId: string, recordData: Omit<PlacementRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('placement_records')
        .insert([{
          student_id: studentId,
          company: recordData.company,
          package: recordData.package,
          placement_date: recordData.placementDate,
        }])
        .select()
        .single();

      if (error) throw error;

      // Update student status to placed
      await supabase
        .from('students')
        .update({ status: 'placed' })
        .eq('id', studentId);

      // Reload students to get updated data
      await loadStudents();
    } catch (err) {
      console.error('Error adding placement record:', err);
      setError('Failed to add placement record. Please try again.');
      throw err;
    }
  };

  const updatePlacementRecord = async (studentId: string, updatedRecord: Partial<PlacementRecord>) => {
    try {
      setError(null);
      
      const updateData: any = {};
      if (updatedRecord.company) updateData.company = updatedRecord.company;
      if (updatedRecord.package) updateData.package = updatedRecord.package;
      if (updatedRecord.placementDate) updateData.placement_date = updatedRecord.placementDate;

      const { error } = await supabase
        .from('placement_records')
        .update(updateData)
        .eq('student_id', studentId);

      if (error) throw error;

      // Reload students to get updated data
      await loadStudents();
    } catch (err) {
      console.error('Error updating placement record:', err);
      setError('Failed to update placement record. Please try again.');
      throw err;
    }
  };

  const importStudents = async (newStudents: Student[]) => {
    try {
      setError(null);
      
      const dbStudents = newStudents.map(student => convertToDatabase(student));
      
      const { data, error } = await supabase
        .from('students')
        .upsert(dbStudents, { onConflict: 'roll_number' })
        .select();

      if (error) throw error;

      // Reload students to get updated data
      await loadStudents();
    } catch (err) {
      console.error('Error importing students:', err);
      setError('Failed to import students. Please try again.');
      throw err;
    }
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setShowMyStudentsOnly(false);
    setShowInactiveDepartments(false);
  };

  const getStudentsByMentor = (mentorId: string) => {
    return students.filter(student => student.mentorId === mentorId);
  };

  const getMentorStudents = () => {
    if (user?.role === 'mentor') {
      return students.filter(student => student.mentorId === user.id);
    }
    return students;
  };

  return (
    <DataContext.Provider value={{
      students,
      filteredStudents,
      filters,
      setFilters,
      addStudent,
      updateStudent,
      deleteStudent,
      addPlacementRecord,
      updatePlacementRecord,
      importStudents,
      clearFilters,
      getStudentsByMentor,
      getMentorStudents,
      showMyStudentsOnly,
      setShowMyStudentsOnly,
      showInactiveDepartments,
      setShowInactiveDepartments,
      isLoading,
      error,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
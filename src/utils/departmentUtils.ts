import { useState, useEffect } from 'react';
import { supabase, DatabaseDepartment } from '../lib/supabase';

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Convert database department to app department format
const convertDatabaseDepartment = (dbDept: DatabaseDepartment): Department => {
  return {
    id: dbDept.id,
    name: dbDept.name,
    code: dbDept.code,
    description: dbDept.description,
    isActive: dbDept.is_active,
    createdAt: dbDept.created_at,
    updatedAt: dbDept.updated_at,
  };
};

// Convert app department to database format
const convertToDatabase = (dept: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>): Omit<DatabaseDepartment, 'id' | 'created_at' | 'updated_at'> => {
  return {
    name: dept.name,
    code: dept.code,
    description: dept.description,
    is_active: dept.isActive,
  };
};

// Default departments that will be used as fallback
const DEFAULT_DEPARTMENTS: Department[] = [
  {
    id: 'dept_1',
    name: 'Computer Science',
    code: 'CS',
    description: 'Computer Science and Engineering',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'dept_2',
    name: 'Information Technology',
    code: 'IT',
    description: 'Information Technology',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'dept_3',
    name: 'Electronics & Communication',
    code: 'EC',
    description: 'Electronics and Communication Engineering',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'dept_4',
    name: 'Mechanical Engineering',
    code: 'ME',
    description: 'Mechanical Engineering',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'dept_5',
    name: 'Civil Engineering',
    code: 'CE',
    description: 'Civil Engineering',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'dept_6',
    name: 'Electrical Engineering',
    code: 'EE',
    description: 'Electrical Engineering',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
];

// Function to get default departments
export const getDefaultDepartments = (): Department[] => {
  return DEFAULT_DEPARTMENTS;
};

// Hook to manage departments with database
export const useDepartments = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load departments from database
  const loadDepartments = async () => {
    try {
      setError(null);
      
      // Set RLS bypass for service operations
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (deptError) throw deptError;

      const convertedDepartments = data.map(convertDatabaseDepartment);
      setDepartments(convertedDepartments);
    } catch (err) {
      console.error('Error loading departments:', err);
      setError('Failed to load departments. Using defaults.');
      setDepartments(DEFAULT_DEPARTMENTS);
    } finally {
      setIsLoading(false);
    }
  };

  // Add new department
  const addDepartment = async (departmentData: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      
      const dbDepartment = convertToDatabase(departmentData);
      
      const { data, error } = await supabase
        .from('departments')
        .insert([dbDepartment])
        .select()
        .single();

      if (error) throw error;

      const newDepartment = convertDatabaseDepartment(data);
      setDepartments(prev => [...prev, newDepartment]);
      return newDepartment;
    } catch (err) {
      console.error('Error adding department:', err);
      setError('Failed to add department. Please try again.');
      throw err;
    }
  };

  // Update department
  const updateDepartment = async (id: string, updates: Partial<Department>) => {
    try {
      setError(null);
      
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.code) updateData.code = updates.code;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { data, error } = await supabase
        .from('departments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedDepartment = convertDatabaseDepartment(data);
      setDepartments(prev => prev.map(dept => 
        dept.id === id ? updatedDepartment : dept
      ));
      return updatedDepartment;
    } catch (err) {
      console.error('Error updating department:', err);
      setError('Failed to update department. Please try again.');
      throw err;
    }
  };

  // Delete department
  const deleteDepartment = async (id: string) => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDepartments(prev => prev.filter(dept => dept.id !== id));
    } catch (err) {
      console.error('Error deleting department:', err);
      setError('Failed to delete department. Please try again.');
      throw err;
    }
  };

  // Load departments on mount
  useEffect(() => {
    loadDepartments();
  }, []);

  const activeDepartments = departments.filter(dept => dept.isActive);
  const departmentNames = activeDepartments.map(dept => dept.name);
  
  return {
    departments,
    activeDepartments,
    departmentNames,
    isLoading,
    error,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    reloadDepartments: loadDepartments,
    getDepartmentByName: (name: string) => departments.find(dept => dept.name === name),
    getDepartmentById: (id: string) => departments.find(dept => dept.id === id),
  };
};
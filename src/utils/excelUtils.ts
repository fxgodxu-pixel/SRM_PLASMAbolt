import * as XLSX from 'xlsx';

// Helper function to export data to CSV
export function exportToCSV(data: any[], filename: string = 'export.csv'): void {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    // Header row
    headers.join(','),
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ].join('\n');

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Helper function to export data to Excel
export function exportToExcel(data: any[], filename: string = 'export.xlsx'): void {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Create worksheet from JSON data
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Create workbook and add worksheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  
  // Write file
  XLSX.writeFile(wb, filename);
}

// Helper function to convert Excel date serial to YYYY-MM-DD string
function convertExcelDateToString(excelDate: any): string | null {
  if (!excelDate) return null;
  
  try {
    // If it's already a string, return as is
    if (typeof excelDate === 'string') {
      return excelDate;
    }
    
    // If it's a number (Excel date serial), convert it
    if (typeof excelDate === 'number') {
      const date = XLSX.SSF.parse_date_code(excelDate);
      if (date) {
        const year = date.y;
        const month = String(date.m).padStart(2, '0');
        const day = String(date.d).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error converting Excel date:', error);
    return null;
  }
}

// Helper function to map department names to active departments
function mapDepartmentName(importedDept: string, availableDepartments: any[] = []): string {
  if (!importedDept || !availableDepartments.length) {
    return availableDepartments[0]?.name || 'Computer Science';
  }

  const deptLower = importedDept.toLowerCase().trim();
  
  // Department mapping with common variations
  const departmentMappings: { [key: string]: string[] } = {
    'Computer Science': ['cs', 'cse', 'computer science', 'computer science and engineering', 'comp sci', 'computer science engineering'],
    'Information Technology': ['it', 'info tech', 'information technology', 'information tech'],
    'Electronics & Communication': ['ece', 'electronics', 'electronics and communication', 'electronics and communication engineering', 'electronics & communication'],
    'Mechanical Engineering': ['me', 'mech', 'mechanical', 'mechanical engineering'],
    'Civil Engineering': ['ce', 'civil', 'civil engineering'],
    'Electrical Engineering': ['ee', 'electrical', 'electrical engineering'],
    'Chemical Engineering': ['che', 'chemical', 'chemical engineering'],
    'Biotechnology': ['bt', 'biotech', 'biotechnology'],
  };

  // First try exact match with available departments
  for (const dept of availableDepartments) {
    if (dept.name.toLowerCase() === deptLower) {
      return dept.name;
    }
  }

  // Then try mapping variations
  for (const [standardName, variations] of Object.entries(departmentMappings)) {
    if (variations.includes(deptLower)) {
      // Find if this standard name exists in available departments
      const matchedDept = availableDepartments.find(dept => 
        dept.name.toLowerCase().includes(standardName.toLowerCase()) ||
        standardName.toLowerCase().includes(dept.name.toLowerCase())
      );
      if (matchedDept) {
        return matchedDept.name;
      }
    }
  }

  // Fallback to partial matching
  for (const dept of availableDepartments) {
    if (dept.name.toLowerCase().includes(deptLower) || deptLower.includes(dept.name.toLowerCase())) {
      return dept.name;
    }
  }

  // If no match found, return the first available department
  return availableDepartments[0]?.name || 'Unknown';
}

// Helper function to convert UG percentage from 100 scale to 10 scale
function convertUGPercentageToScale10(value: number): number {
  if (value > 10) {
    return Number((value / 10).toFixed(2));
  }
  return value;
}

// Helper function to determine eligibility based on academic performance
function determineEligibility(tenthPercentage: number, twelfthPercentage: number, ugPercentage: number, cgpa?: number): string {
  const minTenth = 60;
  const minTwelfth = 60;
  const minUG = 6.0; // Out of 10
  const minCGPA = 6.0; // Out of 10

  if (tenthPercentage >= minTenth && 
      twelfthPercentage >= minTwelfth && 
      ugPercentage >= minUG && 
      (!cgpa || cgpa >= minCGPA)) {
    return 'eligible';
  }
  return 'ineligible';
}

export function parseStudentsFromExcel(file: File, availableDepartments: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const students = jsonData.map((row: any) => {
          // Convert UG percentage from 100 scale to 10 scale
          const rawUGValue = Number(row['UG Percentage'] || row['UG CGPA'] || row['ug_percentage'] || row['ugPercentage'] || row['CGPA'] || row['cgpa'] || 0);
          const ugPercentage = convertUGPercentageToScale10(rawUGValue);
          
          // Handle separate CGPA field if provided
          const rawCGPAValue = row['CGPA'] || row['cgpa'];
          const cgpa = rawCGPAValue ? convertUGPercentageToScale10(Number(rawCGPAValue)) : null;

          const tenthPercentage = Number(row['10th Percentage'] || row['10th %'] || row['Class 10'] || row['SSC'] || row['tenth_percentage'] || 0);
          const twelfthPercentage = Number(row['12th Percentage'] || row['12th %'] || row['HSC'] || row['Intermediate'] || row['twelfth_percentage'] || 0);

          const student = {
            id: String(row['REG NO'] || row['Roll Number'] || row['roll_number'] || row['Student ID'] || row['ID'] || ''),
            roll_number: String(row['REG NO'] || row['Roll Number'] || row['roll_number'] || row['Student ID'] || row['ID'] || ''),
            student_name: String(row['NAME'] || row['Student Name'] || row['student_name'] || row['Name'] || row['Full Name'] || ''),
            email: String(row['OFFICIAL MAIL.ID'] || row['Email'] || row['Official Email'] || row['email'] || ''),
            personal_email: String(row['PERSONAL  MAIL ID'] || row['Personal Email'] || row['personal_email'] || ''),
            mobile_number: String(row['MOBILE NUMBER'] || row['Mobile Number'] || row['Phone'] || row['mobile_number'] || ''),
            department: mapDepartmentName(String(row['Department'] || row['department'] || ''), availableDepartments),
            section: String(row['Section'] || row['section'] || 'A'),
            gender: String(row['GENDER'] || row['Gender'] || row['Sex'] || row['gender'] || ''),
            date_of_birth: convertExcelDateToString(row['DOB'] || row['Date of Birth'] || row['Birth Date'] || row['date_of_birth']),
            number_of_backlogs: Number(row['NO OF BACKLOG'] || row['Number of Backlogs'] || row['Backlogs'] || row['number_of_backlogs'] || 0),
            resume_link: String(row['RESUME LINK'] || row['Resume Link'] || row['CV Link'] || row['resume_link'] || ''),
            photo_url: String(row['pHoto'] || row['Photo URL'] || row['Photo Link'] || row['Image URL'] || row['photo_url'] || ''),
            mentor_id: String(row['Mentor ID'] || row['mentor_id'] || availableDepartments[0]?.mentors?.[0]?.id || ''),
            academicDetails: {
              tenthPercentage: tenthPercentage,
              twelfthPercentage: twelfthPercentage,
              ugPercentage: ugPercentage,
              cgpa: cgpa
            },
            status: determineEligibility(tenthPercentage, twelfthPercentage, ugPercentage, cgpa),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          return student;
        });

        resolve(students);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export function parsePlacementsFromExcel(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const placements = jsonData.map((row: any) => ({
          student_id: String(row['Student ID'] || row['student_id'] || ''),
          company_name: String(row['Company Name'] || row['company_name'] || ''),
          job_role: String(row['Job Role'] || row['job_role'] || ''),
          package_lpa: Number(row['Package (LPA)'] || row['package_lpa'] || 0),
          placement_date: convertExcelDateToString(row['Placement Date'] || row['placement_date']),
          placement_type: String(row['Placement Type'] || row['placement_type'] || 'full_time'),
          status: String(row['Status'] || row['status'] || 'placed')
        }));

        resolve(placements);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export function generateExcelTemplate(): void {
  const studentTemplate = [
    {
      'Roll Number': 'CS001',
      'Student Name': 'John Doe',
      'Email': 'john.doe@college.edu',
      'Personal Email': 'john.doe@gmail.com',
      'Mobile Number': '9876543210',
      'Department': 'Computer Science',
      'Section': 'A',
      'Gender': 'Male',
      'Date of Birth': '2000-01-15',
      'Number of Backlogs': 0,
      'Resume Link': 'https://example.com/resume.pdf',
      'Photo URL': 'https://example.com/photo.jpg',
      'Mentor ID': 'MENTOR001',
      '10th Percentage': 85.5,
      '12th Percentage': 88.2,
      'UG Percentage': 75.8,
      'CGPA': 7.58
    }
  ];

  const ws = XLSX.utils.json_to_sheet(studentTemplate);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Students');
  XLSX.writeFile(wb, 'student_template.xlsx');
}
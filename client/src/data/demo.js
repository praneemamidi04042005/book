export const demoHospitals = [
  { _id: '64f100000000000000000001', name: 'Aarogya Multispeciality', city: 'Hyderabad', area: 'Banjara Hills', address: 'Road No. 12, Banjara Hills', rating: 4.9, distance: '1.2 km', departments: ['Cardiology', 'Neurology', 'Orthopedics'], openSlots: 18, color: 'mint' },
  { _id: '64f100000000000000000002', name: 'Olive Tree Medical Centre', city: 'Hyderabad', area: 'Jubilee Hills', address: 'Plot 44, Jubilee Hills Rd', rating: 4.8, distance: '2.8 km', departments: ['Endocrinology', 'Dermatology', 'General Medicine'], openSlots: 12, color: 'peach' },
  { _id: '64f100000000000000000003', name: 'Carewell Heart Institute', city: 'Hyderabad', area: 'Madhapur', address: 'Hitech City Main Road', rating: 4.7, distance: '4.1 km', departments: ['Cardiology', 'Nephrology'], openSlots: 9, color: 'blue' },
  { _id: '64f100000000000000000004', name: 'Sanjeevani City Hospital', city: 'Hyderabad', area: 'Kondapur', address: 'Masjid Banda, Kondapur', rating: 4.8, distance: '5.3 km', departments: ['Gastroenterology', 'Ophthalmology', 'Pediatrics'], openSlots: 15, color: 'lilac' },
  { _id: '64f100000000000000000005', name: 'Nivara Health & Wellness', city: 'Secunderabad', area: 'Begumpet', address: 'Greenlands Road, Begumpet', rating: 4.6, distance: '7.5 km', departments: ['Orthopedics', 'Neurology', 'General Medicine'], openSlots: 11, color: 'sand' },
]

export const demoDoctors = [
  { _id: '64f200000000000000000001', name: 'Dr. Ananya Rao', specialization: 'Cardiologist', hospitalId: '64f100000000000000000001', hospital: 'Aarogya Multispeciality', experience: '12 years', rating: 4.9, fee: 800, slots: ['10:00 AM', '10:30 AM', '11:30 AM', '04:00 PM'], initials: 'AR', tint: 'mint' },
  { _id: '64f200000000000000000002', name: 'Dr. Karthik Menon', specialization: 'Endocrinologist', hospitalId: '64f100000000000000000002', hospital: 'Olive Tree Medical Centre', experience: '9 years', rating: 4.8, fee: 700, slots: ['09:30 AM', '11:00 AM', '02:30 PM', '05:00 PM'], initials: 'KM', tint: 'peach' },
  { _id: '64f200000000000000000003', name: 'Dr. Meera Iyer', specialization: 'Dermatologist', hospitalId: '64f100000000000000000002', hospital: 'Olive Tree Medical Centre', experience: '11 years', rating: 4.9, fee: 600, slots: ['10:30 AM', '12:00 PM', '03:00 PM'], initials: 'MI', tint: 'lilac' },
  { _id: '64f200000000000000000004', name: 'Dr. Rohan Desai', specialization: 'Neurologist', hospitalId: '64f100000000000000000001', hospital: 'Aarogya Multispeciality', experience: '15 years', rating: 4.8, fee: 900, slots: ['09:00 AM', '11:30 AM', '04:30 PM'], initials: 'RD', tint: 'blue' },
  { _id: '64f200000000000000000005', name: 'Dr. Nisha Kulkarni', specialization: 'Nephrologist', hospitalId: '64f100000000000000000003', hospital: 'Carewell Heart Institute', experience: '8 years', rating: 4.7, fee: 750, slots: ['10:00 AM', '01:00 PM', '03:30 PM'], initials: 'NK', tint: 'sand' },
  { _id: '64f200000000000000000006', name: 'Dr. Arjun Reddy', specialization: 'Orthopedist', hospitalId: '64f100000000000000000005', hospital: 'Nivara Health & Wellness', experience: '10 years', rating: 4.8, fee: 650, slots: ['09:30 AM', '11:00 AM', '02:00 PM', '04:00 PM'], initials: 'AR', tint: 'mint' },
  { _id: '64f200000000000000000007', name: 'Dr. Priya Shah', specialization: 'Gastroenterologist', hospitalId: '64f100000000000000000004', hospital: 'Sanjeevani City Hospital', experience: '13 years', rating: 4.9, fee: 850, slots: ['10:00 AM', '12:30 PM', '04:30 PM'], initials: 'PS', tint: 'peach' },
  { _id: '64f200000000000000000008', name: 'Dr. Vivek Nair', specialization: 'Ophthalmologist', hospitalId: '64f100000000000000000004', hospital: 'Sanjeevani City Hospital', experience: '7 years', rating: 4.7, fee: 500, slots: ['09:00 AM', '10:30 AM', '03:00 PM'], initials: 'VN', tint: 'blue' },
  { _id: '64f200000000000000000009', name: 'Dr. Sahana Reddy', specialization: 'General Physician', hospitalId: '64f100000000000000000001', hospital: 'Aarogya Multispeciality', experience: '6 years', rating: 4.8, fee: 400, slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM'], initials: 'SR', tint: 'lilac' },
  { _id: '64f200000000000000000010', name: 'Dr. Imran Qureshi', specialization: 'Diabetologist', hospitalId: '64f100000000000000000002', hospital: 'Olive Tree Medical Centre', experience: '14 years', rating: 4.9, fee: 750, slots: ['10:00 AM', '11:30 AM', '01:30 PM', '04:00 PM'], initials: 'IQ', tint: 'sand' },
]

export const demoAppointments = [
  { _id: 'a1', patientId: '64f300000000000000000001', patientName: 'Aria Sharma', doctorId: '64f200000000000000000001', hospitalId: '64f100000000000000000001', doctor: 'Dr. Ananya Rao', specialization: 'Cardiologist', hospital: 'Aarogya Multispeciality', date: '2026-10-02', startTime: '10:30 AM', status: 'CONFIRMED', reason: 'Routine heart health consultation' },
  { _id: 'a2', patientId: '64f300000000000000000001', patientName: 'Aria Sharma', doctorId: '64f200000000000000000002', hospitalId: '64f100000000000000000002', doctor: 'Dr. Karthik Menon', specialization: 'Endocrinologist', hospital: 'Olive Tree Medical Centre', date: '2026-10-08', startTime: '11:00 AM', status: 'BOOKED', reason: 'Follow-up consultation' },
]

export const demoReports = [
  { _id: 'r1', reportType: 'Complete Blood Count', uploadDate: '2026-09-24', processingStatus: 'COMPLETED', summary: 'Most recorded values are within the reference intervals shown by this report. Hemoglobin is slightly below the configured informational interval.', recommendedSpecialist: 'General Physician', extractedParameters: [{ name: 'Hemoglobin', value: 11.4, unit: 'g/dL', status: 'LOW' }, { name: 'WBC', value: 7400, unit: '/µL', status: 'NORMAL' }, { name: 'Platelets', value: 258000, unit: '/µL', status: 'NORMAL' }] },
  { _id: 'r2', reportType: 'HbA1c', uploadDate: '2026-08-12', processingStatus: 'COMPLETED', summary: 'This report records an HbA1c result of 6.2%. Discuss the result and its context with your healthcare professional.', recommendedSpecialist: 'Endocrinologist', extractedParameters: [{ name: 'HbA1c', value: 6.2, unit: '%', status: 'HIGH' }] },
  { _id: 'r4', reportType: 'HbA1c', uploadDate: '2026-06-20', processingStatus: 'COMPLETED', summary: 'Fictional demo report: the recorded HbA1c value is 6.1%. Discuss this with a healthcare professional.', recommendedSpecialist: 'Endocrinologist', extractedParameters: [{ name: 'HbA1c', value: 6.1, unit: '%', status: 'HIGH' }] },
  { _id: 'r3', reportType: 'Lipid Profile', uploadDate: '2026-06-05', processingStatus: 'COMPLETED', summary: 'Recorded lipid values are available for review with your doctor. Reference intervals can vary by lab and personal context.', recommendedSpecialist: 'General Physician', extractedParameters: [{ name: 'Total Cholesterol', value: 186, unit: 'mg/dL', status: 'NORMAL' }, { name: 'LDL Cholesterol', value: 112, unit: 'mg/dL', status: 'NORMAL' }] },
  { _id: 'r5', reportType: 'Complete Blood Count', uploadDate: '2026-06-20', processingStatus: 'COMPLETED', summary: 'Fictional demo report: hemoglobin was recorded at 11.6 g/dL. Discuss the complete report with a healthcare professional.', recommendedSpecialist: 'General Physician', extractedParameters: [{ name: 'Hemoglobin', value: 11.6, unit: 'g/dL', status: 'LOW' }] },
  { _id: 'r6', reportType: 'HbA1c', uploadDate: '2026-04-18', processingStatus: 'COMPLETED', summary: 'Fictional demo report: the recorded HbA1c value is 6.0%. Discuss this with a healthcare professional.', recommendedSpecialist: 'Endocrinologist', extractedParameters: [{ name: 'HbA1c', value: 6.0, unit: '%', status: 'HIGH' }] },
  { _id: 'r7', reportType: 'Complete Blood Count', uploadDate: '2026-04-18', processingStatus: 'COMPLETED', summary: 'Fictional demo report: hemoglobin was recorded at 11.8 g/dL. Discuss the complete report with a healthcare professional.', recommendedSpecialist: 'General Physician', extractedParameters: [{ name: 'Hemoglobin', value: 11.8, unit: 'g/dL', status: 'LOW' }] },
  { _id: 'r8', reportType: 'HbA1c', uploadDate: '2026-03-12', processingStatus: 'COMPLETED', summary: 'Fictional demo report: the recorded HbA1c value is 5.9%. Discuss this with a healthcare professional.', recommendedSpecialist: 'Endocrinologist', extractedParameters: [{ name: 'HbA1c', value: 5.9, unit: '%', status: 'HIGH' }] },
  { _id: 'r9', reportType: 'Complete Blood Count', uploadDate: '2026-03-12', processingStatus: 'COMPLETED', summary: 'Fictional demo report: hemoglobin was recorded at 12.1 g/dL. Discuss the complete report with a healthcare professional.', recommendedSpecialist: 'General Physician', extractedParameters: [{ name: 'Hemoglobin', value: 12.1, unit: 'g/dL', status: 'NORMAL' }] },
]

export const trendData = [
  { date: 'Mar 12', HbA1c: 5.9, Hemoglobin: 12.1 },
  { date: 'Apr 18', HbA1c: 6.0, Hemoglobin: 11.8 },
  { date: 'Jun 20', HbA1c: 6.1, Hemoglobin: 11.6 },
  { date: 'Aug 12', HbA1c: 6.2, Hemoglobin: null },
  { date: 'Sep 24', HbA1c: null, Hemoglobin: 11.4 },
]


export function validateDob(dob: Date): boolean {
  if (!dob) return true; // Optional field

  const today = new Date();
  const birthDate = new Date(dob);

  // Check if date is valid
  if (isNaN(birthDate.getTime())) {
    return false;
  }

  // Check if date is not in the future
  if (birthDate > today) {
    return false;
  }

  // Check if person is not older than 150 years
  const age = today.getFullYear() - birthDate.getFullYear();
  if (age > 150) {
    return false;
  }

  return true;
}

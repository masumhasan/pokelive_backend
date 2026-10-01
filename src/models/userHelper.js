import bcrypt from 'bcryptjs';

export async function hashPassword(plainText) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function comparePassword(plainText, hashedPassword) {
  return bcrypt.compare(plainText, hashedPassword);
}

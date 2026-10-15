import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 4000;
export const DATABASE_URL = process.env.DATABASE_URL;
if (!process.env.JWT_SECRET) {
	throw new Error('JWT_SECRET must be configured');
}
export const JWT_SECRET = process.env.JWT_SECRET;

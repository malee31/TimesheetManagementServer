import dotenv from "dotenv";

dotenv.config();
export default () => {
	process.env.ADMIN_KEY = "A-Admin-Key";
}
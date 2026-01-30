import { prisma } from "../lib/prisma";
import { UserRole } from "../middlewares/auth";

async function seedAdmin() {
  try {
    console.log("🚀 Admin Seeding Started...");

    const adminData = {
      name: "Admin User",
      email: "admin@skillbridge.com",
      password: "adminpassword123", // Ensure this meets your auth complexity requirements
    };

    // 1. Check if Admin already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminData.email },
    });

    if (existingUser) {
      console.log("ℹ️ Admin already exists. Skipping seed.");
      return;
    }

    console.log("📡 Registering Admin via Better Auth...");

    // 2. Create user via Better Auth API
    // We use the sign-up endpoint so the password gets hashed correctly by the auth provider
    const authUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
    const response = await fetch(`${authUrl}/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        origin: process.env.APP_URL || "http://localhost:3000",
      },
      body: JSON.stringify(adminData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Auth API Error: ${errorData.message || response.statusText}`,
      );
    }

    // 3. Elevate Permissions & Verify in Database
    // Better Auth sign-up defaults to STUDENT role. We manually override to ADMIN.
    await prisma.user.update({
      where: { email: adminData.email },
      data: {
        role: UserRole.ADMIN,
        status: "ACTIVE",
        emailVerified: true,
      },
    });

    console.log(
      "✅ Admin created, email verified, and role elevated to ADMIN!",
    );
  } catch (error) {
    console.error("❌ Seeding Failed:", error);
  } finally {
    await prisma.$disconnect();
    process.exit();
  }
}

seedAdmin();

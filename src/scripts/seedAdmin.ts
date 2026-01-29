import { prisma } from "../lib/prisma";
import { UserRole } from "../middlewares/auth";

async function seedAdmin() {
  try {
    console.log("Admin Seeding Started...");

    const adminData = {
      name: "Admin",
      email: "admin@skillbridge.com",
      role: UserRole.ADMIN,
      password: "admin123",
    };

    // 1. Check if Admin already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminData.email },
    });

    if (existingUser) {
      console.log("Admin already exists. Skipping seed.");
      return;
    }

    // 2. Create user via Better Auth API
    const response = await fetch(
      `${process.env.BETTER_AUTH_URL}/api/auth/sign-up/email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: process.env.APP_URL!,
        },
        body: JSON.stringify(adminData),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Auth API Error: ${errorData.message || response.statusText}`,
      );
    }

    // 3. Elevate Permissions & Verify Email directly in DB
    // We do this because the sign-up API might strip the 'role' field for security
    await prisma.user.update({
      where: { email: adminData.email },
      data: {
        role: UserRole.ADMIN,
        emailVerified: true,
      },
    });

    console.log("Admin created and permissions elevated!");
    console.log("Seeding Successful!");
  } catch (error) {
    console.error("Seeding Failed:", error);
  } finally {
    await prisma.$disconnect();
    process.exit();
  }
}

seedAdmin();

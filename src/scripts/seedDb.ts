import { faker } from "@faker-js/faker";
import { prisma } from "../lib/prisma";
import { UserRole } from "../middlewares/auth";

async function main() {
  console.log("🚀 Starting Faker-powered Seeding...");

  // 1. CLEANUP (reverse order)
  console.log("🧹 Cleaning up old data...");
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.availabilitySlot.deleteMany();
  await prisma.tutorCategory.deleteMany();
  await prisma.tutorProfile.deleteMany();
  await prisma.user.deleteMany();

  // 2. Categories
  const categoryData = [
    { name: "Web Development", slug: "web-development" },
    { name: "Data Science", slug: "data-science" },
    { name: "Digital Marketing", slug: "digital-marketing" },
    { name: "Mathematics", slug: "mathematics" },
    { name: "Physics", slug: "physics" },
    { name: "Graphic Design", slug: "graphic-design" },
    { name: "English Literature", slug: "english-literature" },
  ];

  console.log("📂 Upserting Categories...");
  const categories = await Promise.all(
    categoryData.map((cat) =>
      prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      }),
    ),
  );

  // Helper: image must be valid URL or null
  const getValidAvatarUrl = () => faker.image.url({ width: 256, height: 256 });

  // 3. Students
  console.log("🎓 Generating 10 Students...");
  const students = [];

  for (let i = 0; i < 10; i++) {
    const student = await prisma.user.create({
      data: {
        name: faker.person.fullName().slice(0, 50),
        email: faker.internet.email().toLowerCase(),
        image: faker.datatype.boolean(0.9) ? getValidAvatarUrl() : null,
        role: UserRole.STUDENT,
        emailVerified: true,
        status: "ACTIVE",
      },
    });

    students.push(student);
  }

  if (students.length < 2) {
    throw new Error("❌ Not enough students created to generate reviews.");
  }

  // 4. Tutors + Profiles + Categories + Slots + Bookings + Reviews
  console.log("👨‍🏫 Generating 20 Tutors with Profiles...");

  for (let i = 0; i < 20; i++) {
    // Tutor user
    const tutorUser = await prisma.user.create({
      data: {
        name: faker.person.fullName().slice(0, 50),
        email: faker.internet.email().toLowerCase(),
        image: faker.datatype.boolean(0.9) ? getValidAvatarUrl() : null,
        role: UserRole.TUTOR,
        emailVerified: true,
        status: "ACTIVE",
      },
    });

    // Tutor profile
    const tutorProfile = await prisma.tutorProfile.create({
      data: {
        userId: tutorUser.id,
        bio: faker.lorem.paragraphs(2).slice(0, 800), // > 20 chars
        headline: faker.person.jobTitle().slice(0, 100), // max 100
        location: `${faker.location.city()}, ${faker.location.country()}`.slice(
          0,
          120,
        ),
        languages: faker.helpers.arrayElements(
          ["English", "Bengali", "Hindi", "Spanish", "French", "German"],
          { min: 1, max: 3 },
        ),
        hourlyRate: faker.number.int({ min: 0, max: 2000 }),
        experience: faker.number.int({ min: 0, max: 20 }),
        isVerified: faker.datatype.boolean(0.7),
      },
    });

    // Tutor categories
    const randomCats = faker.helpers.arrayElements(categories, {
      min: 1,
      max: 2,
    });

    for (const cat of randomCats) {
      await prisma.tutorCategory.create({
        data: {
          tutorId: tutorProfile.id,
          categoryId: cat.id,
        },
      });
    }

    // Availability slots (3)
    const createdSlots = [];

    for (let j = 0; j < 3; j++) {
      const startTime = faker.date.soon({ days: 14 });
      startTime.setMinutes(0, 0, 0);

      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 1);

      const slot = await prisma.availabilitySlot.create({
        data: {
          tutorId: tutorProfile.id,
          startTime,
          endTime,
          isBooked: false,
        },
      });

      createdSlots.push(slot);
    }

    // Ensure at least 2 slots exist
    if (createdSlots.length < 2) {
      throw new Error(
        "❌ Not enough slots created to generate bookings/reviews",
      );
    }

    // Pick exactly 2 unique students safely
    const selectedReviewers = faker.helpers.shuffle(students).slice(0, 2);

    // Create 2 bookings + 2 reviews using 2 different slots
    for (let idx = 0; idx < selectedReviewers.length; idx++) {
      const reviewer = selectedReviewers[idx];
      const slotForBooking = createdSlots[idx];

      // TS-safe guards (extra safe)
      if (!reviewer) throw new Error("❌ Reviewer is undefined");
      if (!slotForBooking) throw new Error("❌ Slot for booking is undefined");

      const note = faker.lorem.sentences({ min: 1, max: 3 }).slice(0, 450);

      const booking = await prisma.booking.create({
        data: {
          studentId: reviewer.id,
          tutorId: tutorUser.id, // Booking.tutorId = User.id (correct)
          slotId: slotForBooking.id,
          status: "COMPLETED",
          note,
          completedAt: faker.date.recent({ days: 30 }),
        },
      });

      await prisma.availabilitySlot.update({
        where: { id: slotForBooking.id },
        data: { isBooked: true },
      });

      await prisma.review.create({
        data: {
          bookingId: booking.id, // required + unique
          studentId: reviewer.id,
          tutorProfileId: tutorProfile.id,
          rating: faker.number.int({ min: 4, max: 5 }),
          comment: faker.helpers.arrayElement([
            "Highly recommended!",
            "Very patient and explains things clearly.",
            "Helped me ace my exams!",
            "Great communication and deep knowledge.",
            "Best tutor I've found so far.",
          ]),
        },
      });
    }

    // ✅ Update TutorProfile Stats
    const reviewStats = await prisma.review.aggregate({
      where: { tutorProfileId: tutorProfile.id },
      _avg: { rating: true },
      _count: { id: true },
    });

    const sessionStats = await prisma.booking.count({
      where: {
        tutorId: tutorUser.id,
        status: "COMPLETED",
      },
    });

    await prisma.tutorProfile.update({
      where: { id: tutorProfile.id },
      data: {
        avgRating: Number(reviewStats._avg.rating ?? 0),
        totalReviews: reviewStats._count.id,
        totalSessions: sessionStats,
      },
    });
  }

  console.log("✅ Seeding Successful!");
  console.log(
    `Summary: ${students.length} Students, 20 Tutors, ${categories.length} Categories.`,
  );
}

main()
  .catch((e) => {
    console.error("❌ Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

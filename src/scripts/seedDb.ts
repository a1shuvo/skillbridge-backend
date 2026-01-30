import { faker } from "@faker-js/faker";
import { prisma } from "../lib/prisma";
import { UserRole } from "../middlewares/auth";

async function main() {
  console.log("🚀 Starting Faker-powered Seeding...");

  //   1. CLEANUP: Delete existing data in reverse order of relations
  //   This ensures you don't get "Foreign Key Constraint" errors when re-seeding
  //   console.log("🧹 Cleaning up old data...");
  //   await prisma.review.deleteMany();
  //   await prisma.availabilitySlot.deleteMany();
  //   await prisma.tutorCategory.deleteMany();
  //   await prisma.tutorProfile.deleteMany();
  //   await prisma.booking.deleteMany();
  //   await prisma.user.deleteMany();
  // We keep Categories as they are usually static, but you can delete them too if you want.

  // 2. Create Categories
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

  // 3. Create 10 Real-looking Students
  console.log("🎓 Generating 10 Students...");
  const students = [];
  for (let i = 0; i < 10; i++) {
    const student = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        image: faker.image.avatar(),
        role: UserRole.STUDENT,
        emailVerified: true,
        status: "ACTIVE",
      },
    });
    students.push(student);
  }

  // 4. Create 20 Real-looking Tutors
  console.log("👨‍🏫 Generating 20 Tutors with Profiles...");
  for (let i = 0; i < 20; i++) {
    const tutorUser = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        image: faker.image.avatar(),
        role: UserRole.TUTOR,
        emailVerified: true,
        status: "ACTIVE",
      },
    });

    const tutorProfile = await prisma.tutorProfile.create({
      data: {
        userId: tutorUser.id,
        bio: faker.lorem.paragraphs(2),
        headline: faker.person.jobTitle(),
        location: `${faker.location.city()}, ${faker.location.country()}`,
        languages: [
          "English",
          faker.helpers.arrayElement([
            "Spanish",
            "French",
            "Bengali",
            "German",
          ]),
        ],
        hourlyRate: faker.number.int({ min: 15, max: 150 }) * 10,
        experience: faker.number.int({ min: 1, max: 20 }),
        isVerified: faker.datatype.boolean(0.8),
      },
    });

    // 5. Assign 1-2 random categories
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

    // 6. Generate 3 Availability Slots (Future Dates)
    for (let j = 0; j < 3; j++) {
      const startTime = faker.date.soon({ days: 14 });
      startTime.setMinutes(0, 0, 0);
      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 1);

      await prisma.availabilitySlot.create({
        data: {
          tutorId: tutorProfile.id,
          startTime,
          endTime,
        },
      });
    }

    // 7. FIX: Unique Reviews per Tutor
    // We pick 2 UNIQUE students from the pool to avoid P2002 error
    const selectedReviewers = faker.helpers.arrayElements(students, 2);

    for (const reviewer of selectedReviewers) {
      await prisma.review.create({
        data: {
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

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    // Clear existing data (in reverse order of dependencies)
    await prisma.attendanceLog.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.timeEntry.deleteMany();
    await prisma.task.deleteMany();
    await prisma.sprint.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
    await prisma.client.deleteMany();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    console.log('Creating users...');
    const users = [
      { uid: 'MGT-EXE-01', firebaseUid: 'ZHt4kVPFB0eKDdhToyGzcJVMKx43', email: 'agent01mrk@gmail.com', name: 'Mr.K', firstName: 'Mr.K', avatar: '/team/mrk.jpg', role: 'Executive', isExecutive: true, isManager: true, password: hashedPassword },
      { uid: 'MGT-EXE-02', firebaseUid: 'qndoKJJ7itZtS5QU5bXUv4hj23G3', email: 'agent02mrv@gmail.com', name: 'Mr.V', firstName: 'Mr.V', avatar: '/team/mrv.jpg', role: 'Executive', isExecutive: true, isManager: true, password: hashedPassword },
      { uid: 'MGT-DEV-02', firebaseUid: 'U6fRleHoUJMoS4KcTBqkNS5t3R33', email: 'agent05mrm@gmail.com', name: 'Mr.M', firstName: 'Mr.M', avatar: '/team/mrm.jpeg', role: 'Developer', password: hashedPassword },
      { uid: 'MGT-DEV-01', firebaseUid: '80L848uY15Wr54hF6hILQNWYkTB2', email: 'agent03mrss@gmail.com', name: 'Mrs.S', firstName: 'Mrs.S', avatar: '/team/mrss.jpg', role: 'Developer', password: hashedPassword },
      { uid: 'MGT-DES-01', firebaseUid: 'j7PJiU6ERlgKzSaa3wrCcdk6zXy2', email: 'agent04mra@gmail.com', name: 'Mr.A', firstName: 'Mr.A', avatar: '/team/mra.jpeg', role: 'Designer', password: hashedPassword },
      { uid: 'MGT-BIZ-01', firebaseUid: '4qx0BEdifiNsuJGv0o19rPDLn6D2', email: 'agent06mrz@gmail.com', name: 'Mr.Z', firstName: 'Mr.Z', avatar: '/team/mrz.jpeg', role: 'Business', password: hashedPassword }
    ];

    for (const u of users) {
      await prisma.user.create({ data: u });
    }

    console.log('Creating projects...');
    const prj1 = await prisma.project.create({
      data: {
        name: 'Alpha Redesign',
        description: 'Redesigning the main platform',
        client: 'Alpha Corp',
        status: 'Active',
        progress: 65,
        dueDate: new Date('2026-06-15'),
        members: ['MGT-EXE-01', 'MGT-DES-01', 'MGT-DEV-01'],
      }
    });

    const prj2 = await prisma.project.create({
      data: {
        name: 'Beta Launch',
        description: 'Initial launch of beta features',
        client: 'Beta LLC',
        status: 'Planning',
        progress: 10,
        dueDate: new Date('2026-07-01'),
        members: ['MGT-EXE-02', 'MGT-DEV-02'],
      }
    });

    console.log('Creating sprints and tasks...');
    const sprint1 = await prisma.sprint.create({
      data: {
        name: 'Sprint 1 - Foundations',
        projectId: prj1.id
      }
    });

    await prisma.task.createMany({
      data: [
        {
          title: 'Design system update',
          description: 'Update the main Figma file',
          status: 'In Progress',
          priority: 'High',
          assigneeId: 'MGT-DES-01',
          projectId: prj1.id,
          sprintId: sprint1.id
        },
        {
          title: 'Setup backend repo',
          description: 'Initialize Node.js and PostgreSQL',
          status: 'Done',
          priority: 'Urgent',
          assigneeId: 'MGT-DEV-01',
          projectId: prj1.id,
          sprintId: sprint1.id
        }
      ]
    });

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
    process.exit();
  }
};

seedData();

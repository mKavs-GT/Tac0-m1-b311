const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

const users = [
  { uid: 'MGT-EXE-01', firebaseUid: 'ZHt4kVPFB0eKDdhToyGzcJVMKx43', email: 'agent01mrk@gmail.com', name: 'Mr.K', firstName: 'Mr.K', avatar: '/team/mrk.jpg', role: 'Executive', isExecutive: true, isManager: true },
  { uid: 'MGT-EXE-02', firebaseUid: 'qndoKJJ7itZtS5QU5bXUv4hj23G3', email: 'agent02mrv@gmail.com', name: 'Mr.V', firstName: 'Mr.V', avatar: '/team/mrv.jpg', role: 'Executive', isExecutive: true, isManager: true },
  { uid: 'MGT-DEV-02', firebaseUid: 'U6fRleHoUJMoS4KcTBqkNS5t3R33', email: 'agent05mrm@gmail.com', name: 'Mr.M', firstName: 'Mr.M', avatar: '/team/mrm.jpeg', role: 'Developer' },
  { uid: 'MGT-DEV-01', firebaseUid: '80L848uY15Wr54hF6hILQNWYkTB2', email: 'agent03mrss@gmail.com', name: 'Mrs.S', firstName: 'Mrs.S', avatar: '/team/mrss.jpg', role: 'Developer' },
  { uid: 'MGT-DES-01', firebaseUid: 'j7PJiU6ERlgKzSaa3wrCcdk6zXy2', email: 'agent04mra@gmail.com', name: 'Mr.A', firstName: 'Mr.A', avatar: '/team/mra.jpeg', role: 'Designer' },
  { uid: 'MGT-BIZ-01', firebaseUid: '4qx0BEdifiNsuJGv0o19rPDLn6D2', email: 'agent06mrz@gmail.com', name: 'Mr.Z', firstName: 'Mr.Z', avatar: '/team/mrz.jpeg', role: 'Business' }
];

async function seedUsers() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { uid: u.uid } });
    if (!existing) {
      await prisma.user.create({ data: { ...u, password: hashedPassword } });
      console.log('Created user:', u.name);
    } else {
      console.log('User exists:', u.name);
    }
  }
}

seedUsers().catch(console.error).finally(() => prisma.$disconnect());

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Event = require('./models/Event');
const Registration = require('./models/Registration');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/college_events_hub';
const DEFAULT_PASSWORD = 'password123';

const users = [
    { name: 'Admin', email: 'admin@college.edu', role: 'admin' },
    { name: 'Demo Student', email: 'student@college.edu', role: 'student' },
    { name: 'Aarav Patil', email: 'aarav@college.edu', role: 'student' },
    { name: 'Sneha Deshmukh', email: 'sneha@college.edu', role: 'student' },
    { name: 'Rohan Kulkarni', email: 'rohan@college.edu', role: 'student' },
    { name: 'Isha Joshi', email: 'isha@college.edu', role: 'student' },
    { name: 'Karan Mehta', email: 'karan@college.edu', role: 'student' },
    { name: 'Priya Nair', email: 'priya@college.edu', role: 'student' },
    { name: 'Omkar Jadhav', email: 'omkar@college.edu', role: 'student' },
    { name: 'Tanvi Shah', email: 'tanvi@college.edu', role: 'student' }
];

const daysFromNow = (days, hour = 10) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    return d;
};

const events = [
    {
        title: 'CodeSprint 24-Hour Hackathon',
        description: 'Form teams of up to four and build a working prototype in 24 hours. Mentors from industry, midnight snacks, and prizes for the top three teams. Themes are announced at the kickoff.',
        date: daysFromNow(12, 9),
        venue: 'Main Computer Lab, Block A',
        category: 'Hackathon',
        club: 'Coding Club',
        capacity: 120,
        entryFee: 200,
        bannerUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1200'
    },
    {
        title: 'Rhythm Night – Annual Cultural Fest',
        description: 'An evening of dance, music and drama performances by student groups, followed by a DJ night. Open to all students with a valid college ID.',
        date: daysFromNow(20, 18),
        venue: 'Open Air Auditorium',
        category: 'Cultural',
        club: 'Cultural Committee',
        capacity: 500,
        entryFee: 0,
        bannerUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1200'
    },
    {
        title: 'Inter-Department Football League',
        description: 'Seven-a-side football tournament between departments. Register as a player or volunteer. Finals on the same day with the trophy ceremony.',
        date: daysFromNow(8, 7),
        venue: 'College Sports Ground',
        category: 'Sports',
        club: 'Sports Council',
        capacity: 140,
        entryFee: 100,
        bannerUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200'
    },
    {
        title: 'Hands-on Workshop: Docker & Kubernetes',
        description: 'Learn to containerize a web app, write a docker-compose file, and deploy to a local Kubernetes cluster. Bring your laptop with Docker Desktop installed.',
        date: daysFromNow(5, 11),
        venue: 'Seminar Hall 2',
        category: 'Workshop',
        club: 'IEEE Student Branch',
        capacity: 60,
        entryFee: 150,
        bannerUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=1200'
    },
    {
        title: 'Guest Lecture: Careers in Cloud Computing',
        description: 'An industry expert talks about cloud roles, certifications, and how students can prepare for placements in DevOps and cloud engineering.',
        date: daysFromNow(3, 14),
        venue: 'Central Auditorium',
        category: 'Seminar',
        club: 'Training & Placement Cell',
        capacity: 300,
        entryFee: 0,
        bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1200'
    },
    {
        title: 'RoboWars Arena',
        description: 'Build and battle remote-controlled robots in the arena. Weight limit 8 kg. Rulebook is shared after registration.',
        date: daysFromNow(26, 10),
        venue: 'Mechanical Workshop Yard',
        category: 'Technical',
        club: 'Robotics Club',
        capacity: 40,
        entryFee: 300,
        bannerUrl: 'https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?auto=format&fit=crop&q=80&w=1200'
    },
    {
        title: 'Photography Walk & Contest',
        description: 'Explore the campus with your camera or phone. Best three shots win prizes and get featured in the college magazine.',
        date: daysFromNow(15, 7),
        venue: 'Main Gate (assembly point)',
        category: 'Cultural',
        club: 'Photography Club',
        capacity: 80,
        entryFee: 50,
        bannerUrl: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&q=80&w=1200'
    },
    {
        title: 'Web Dev Bootcamp: React Basics',
        description: 'A beginner-friendly bootcamp covering components, state and routing. You will build and deploy a small project by the end of the day.',
        date: daysFromNow(-10, 10),
        venue: 'Lab 204, IT Department',
        category: 'Workshop',
        club: 'Coding Club',
        capacity: 50,
        entryFee: 0,
        bannerUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1200'
    }
];

const seed = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        await Promise.all([User.deleteMany(), Event.deleteMany(), Registration.deleteMany()]);
        console.log('Cleared users, events and registrations');

        const hashed = await bcrypt.hash(DEFAULT_PASSWORD, 10);
        const createdUsers = await User.insertMany(users.map((u) => ({ ...u, password: hashed, isVerified: true })));
        const admin = createdUsers.find((u) => u.role === 'admin');
        const students = createdUsers.filter((u) => u.role === 'student');
        console.log(`Created ${createdUsers.length} users`);

        const createdEvents = await Event.insertMany(events.map((e) => ({ ...e, seatsLeft: e.capacity, organizer: admin._id })));
        console.log(`Created ${createdEvents.length} events`);

        const registrations = [];
        for (const event of createdEvents) {
            const picked = [...students].sort(() => 0.5 - Math.random()).slice(0, 3 + Math.floor(Math.random() * 4));
            let approvedCount = 0;

            for (const student of picked) {
                const status = ['pending', 'approved', 'approved', 'cancelled'][Math.floor(Math.random() * 4)];
                if (status === 'approved') approvedCount += 1;
                registrations.push({
                    student: student._id,
                    event: event._id,
                    status,
                    entryFee: event.entryFee,
                    feeStatus: event.entryFee === 0 || status === 'approved' ? 'paid' : 'unpaid'
                });
            }

            event.seatsLeft = event.capacity - approvedCount;
            await event.save();
        }

        await Registration.insertMany(registrations);
        console.log(`Created ${registrations.length} registrations`);

        console.log('\nSeed complete');
        console.log('  Admin:   admin@college.edu');
        console.log('  Student: student@college.edu');
        console.log(`  Password (all accounts): ${DEFAULT_PASSWORD}\n`);
        process.exit(0);
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
};

seed();

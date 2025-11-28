export const activityData = {
    steps: 2540,
    stepGoal: 10000,
    distance: 1.8, // km
    calories: 120,
    flights: 4,
    sleep: "7h 20m",
    heartRate: 72,
};

export const weeklyActivity = [
    { day: 'M', steps: 4500 },
    { day: 'T', steps: 7200 },
    { day: 'W', steps: 3100 },
    { day: 'T', steps: 8900 },
    { day: 'F', steps: 5600 },
    { day: 'S', steps: 10200 },
    { day: 'S', steps: 6700 },
];

export const exercises = [
    { id: 'bench_press', name: 'Bench Press', category: 'Push' },
    { id: 'incline_dumbell_press', name: 'Incline Dumbbell Press', category: 'Push' },
    { id: 'squat', name: 'Squat', category: 'Legs' },
    { id: 'deadlift', name: 'Deadlift', category: 'Pull' },
    { id: 'pull_up', name: 'Pull Up', category: 'Pull' },
    { id: 'shoulder_press', name: 'Overhead Press', category: 'Push' },
];

import { format, subDays } from 'date-fns';

const today = new Date();
const formatDate = (date) => format(date, 'yyyy-MM-dd');

export const workoutHistory = {
    'bench_press': [
        {
            date: formatDate(subDays(today, 5)),
            startTime: '18:30',
            endTime: '19:15',
            sets: [
                { weight: 60, reps: 10, time: '18:35' },
                { weight: 60, reps: 10, time: '18:42' },
                { weight: 60, reps: 9, time: '18:50' }
            ]
        },
        {
            date: formatDate(subDays(today, 3)),
            startTime: '19:00',
            endTime: '19:45',
            sets: [
                { weight: 62.5, reps: 8, time: '19:05' },
                { weight: 62.5, reps: 8, time: '19:12' },
                { weight: 62.5, reps: 8, time: '19:20' }
            ]
        },
        {
            date: formatDate(subDays(today, 1)),
            startTime: '18:45',
            endTime: '19:30',
            sets: [
                { weight: 65, reps: 5, time: '18:50' },
                { weight: 65, reps: 5, time: '18:57' },
                { weight: 65, reps: 5, time: '19:02' },
                { weight: 65, reps: 4, time: '19:06' }
            ]
        }
    ],
    'squat': [
        {
            date: formatDate(subDays(today, 4)),
            startTime: '07:00',
            endTime: '08:00',
            sets: [
                { weight: 100, reps: 5, time: '07:15' },
                { weight: 100, reps: 5, time: '07:20' },
                { weight: 100, reps: 5, time: '07:25' }
            ]
        },
        {
            date: formatDate(subDays(today, 0)), // Today
            startTime: '07:00',
            endTime: '08:00',
            sets: [
                { weight: 105, reps: 5, time: '07:15' },
                { weight: 105, reps: 5, time: '07:20' },
                { weight: 105, reps: 5, time: '07:25' }
            ]
        }
    ]
};

import React, { useState, useEffect } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, X, Dumbbell, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { workoutHistory as initialMockData, exercises } from '../data/mockData';

const CalendarView = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [history, setHistory] = useState({});
    const [selectedDayWorkouts, setSelectedDayWorkouts] = useState([]);

    // Load history from local storage
    useEffect(() => {
        const saved = localStorage.getItem('workoutHistory');
        if (saved) {
            setHistory(JSON.parse(saved));
        } else {
            setHistory(initialMockData);
        }
    }, []);

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    // Get all workouts for a specific date
    const getWorkoutsForDate = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const workouts = [];

        Object.entries(history).forEach(([exerciseId, sessions]) => {
            sessions.forEach(session => {
                if (session.date === dateStr) {
                    const exercise = exercises.find(e => e.id === exerciseId);
                    workouts.push({
                        exerciseId,
                        exerciseName: exercise ? exercise.name : exerciseId,
                        ...session
                    });
                }
            });
        });
        return workouts;
    };

    const onDateClick = (day) => {
        const workouts = getWorkoutsForDate(day);
        setSelectedDate(day);
        setSelectedDayWorkouts(workouts);
    };

    const daysInMonth = eachDayOfInterval({
        start: startDate,
        end: endDate
    });

    // Render Calendar Grid
    const renderCells = () => {
        const rows = [];
        let days = [];

        daysInMonth.forEach((day, i) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const hasWorkout = Object.values(history).some(sessions =>
                sessions.some(s => s.date === dateStr)
            );

            days.push(
                <div
                    key={day.toString()}
                    className={`relative h-20 border-b border-r border-zinc-800/50 flex flex-col items-center justify-start pt-2 cursor-pointer transition-colors
                        ${!isSameMonth(day, monthStart) ? "text-zinc-700 bg-zinc-950/30" : "text-zinc-300"}
                        ${isSameDay(day, new Date()) ? "bg-zinc-900" : ""}
                        ${isSameDay(day, selectedDate) ? "bg-zinc-800" : "hover:bg-zinc-900/50"}
                    `}
                    onClick={() => onDateClick(day)}
                >
                    <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                        ${isSameDay(day, new Date()) ? "bg-neon-green text-black" : ""}
                    `}>
                        {format(day, dateFormat)}
                    </span>

                    {hasWorkout && (
                        <div className="mt-2 w-1.5 h-1.5 rounded-full bg-neon-green shadow-[0_0_5px_rgba(16,185,129,0.8)]"></div>
                    )}
                </div>
            );

            if ((i + 1) % 7 === 0) {
                rows.push(
                    <div className="grid grid-cols-7" key={day.toString()}>
                        {days}
                    </div>
                );
                days = [];
            }
        });
        return <div className="bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800">{rows}</div>;
    };

    const renderDays = () => {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return (
            <div className="grid grid-cols-7 mb-2">
                {days.map(day => (
                    <div className="text-center text-xs font-bold text-zinc-500 uppercase tracking-wider" key={day}>
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderHeader = () => {
        return (
            <div className="flex justify-between items-center mb-6 px-2">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <CalendarIcon className="text-neon-green" size={24} />
                    {format(currentMonth, "MMMM yyyy")}
                </h2>
                <div className="flex space-x-2">
                    <button onClick={prevMonth} className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={nextMonth} className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-cyber-black pb-24 animate-fade-in p-4">
            {renderHeader()}
            {renderDays()}
            {renderCells()}

            {/* Selected Date Details Modal */}
            {selectedDate && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
                    <div className="bg-zinc-900 w-full max-w-md rounded-3xl p-6 space-y-6 animate-slide-up border border-zinc-800 shadow-2xl max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">
                                    {format(selectedDate, "EEEE, MMMM do")}
                                </h3>
                                <p className="text-zinc-400 text-sm mt-1">
                                    {selectedDayWorkouts.length > 0
                                        ? `${selectedDayWorkouts.length} Exercises Completed`
                                        : "No workouts recorded"}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedDate(null)}
                                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-zinc-700">
                            {selectedDayWorkouts.length > 0 ? (
                                selectedDayWorkouts.map((workout, idx) => (
                                    <div key={idx} className="bg-black/50 rounded-xl p-4 border border-zinc-800/50">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center text-neon-green">
                                                    <Dumbbell size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white capitalize">
                                                        {workout.exerciseName}
                                                    </h4>
                                                    <div className="flex items-center text-xs text-zinc-500 mt-0.5">
                                                        <Clock size={12} className="mr-1" />
                                                        {workout.startTime || workout.time || "Unknown Time"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {workout.sets.map((set, sIdx) => (
                                                <div key={sIdx} className="flex justify-between items-center text-sm p-2 rounded bg-zinc-900/50">
                                                    <span className="text-zinc-500 font-mono w-6">#{sIdx + 1}</span>
                                                    <div className="flex gap-4">
                                                        <span className="text-white font-bold">{set.weight} <span className="text-zinc-600 text-xs font-normal">kg</span></span>
                                                        <span className="text-white font-bold">{set.reps} <span className="text-zinc-600 text-xs font-normal">reps</span></span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
                                    <Dumbbell size={48} className="mb-4 opacity-20" />
                                    <p>Rest Day</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default CalendarView;

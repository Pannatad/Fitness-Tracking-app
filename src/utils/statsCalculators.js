import { exercises } from '../data/mockData';

// Epley Formula: 1RM = w(1 + r/30)
export const calculateEstimated1RM = (weight, reps) => {
    if (!weight || !reps) return 0;
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30));
};

// Calculate User Level based on total lifetime volume
// 1000kg = 1 XP
// Level N requires N * 100 XP (Linear-ish progression for simplicity, or we can do exponential)
// Let's do: Level = Math.floor(Math.sqrt(XP / 10)) + 1 for a nice curve
export const calculateUserLevel = (history) => {
    let totalVolume = 0;

    Object.values(history).forEach(sessions => {
        sessions.forEach(session => {
            session.sets.forEach(set => {
                const w = parseFloat(set.weight) || 0;
                const r = parseFloat(set.reps) || 0;
                totalVolume += w * r;
            });
        });
    });

    const xp = Math.floor(totalVolume / 100); // 100kg = 1 XP (1000kg might be too slow)
    // Level formula: XP needed for level L = 50 * L * (L - 1)
    // Inverse: Level ≈ sqrt(XP / 50) + 1
    const level = Math.floor(Math.sqrt(xp / 25)) + 1;

    // XP for next level
    const nextLevel = level + 1;
    const xpForNextLevel = 25 * (nextLevel - 1) * (nextLevel - 1);
    const xpForCurrentLevel = 25 * (level - 1) * (level - 1);

    const progress = Math.min(100, Math.max(0, ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100));

    return { level, xp, totalVolume, progress, nextLevelXp: xpForNextLevel };
};

// Get Heatmap Data (Last 365 days)
export const getConsistencyData = (history) => {
    const data = {};
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    Object.values(history).forEach(sessions => {
        sessions.forEach(session => {
            const date = session.date; // YYYY-MM-DD
            if (!data[date]) data[date] = 0;

            // Calculate volume for intensity
            const vol = session.sets.reduce((acc, s) => acc + ((parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0)), 0);
            data[date] += vol;
        });
    });

    return data;
};

// Get Muscle Recovery Status
// Red: Trained < 24h ago
// Orange: Trained < 48h ago
// Green: Recovered (> 48h)
export const getMuscleRecoveryStatus = (history) => {
    const status = {}; // { chest: 'red', back: 'green' }
    const now = new Date();

    // Helper to find muscle for exercise ID
    // We need to look up exercise details. Assuming 'exercises' import has this.
    // If custom exercises, we might miss them if not passed in. 
    // For now, we'll use the imported 'exercises' mock data + we might need to pass custom ones.

    const muscleMap = {};
    exercises.forEach(ex => {
        // Map category to muscle groups (Simplified)
        if (ex.category === 'Push') muscleMap[ex.id] = ['Chest', 'Triceps', 'Shoulders'];
        if (ex.category === 'Pull') muscleMap[ex.id] = ['Back', 'Biceps'];
        if (ex.category === 'Legs') muscleMap[ex.id] = ['Quads', 'Hamstrings', 'Calves', 'Glutes'];
    });

    Object.entries(history).forEach(([exerciseId, sessions]) => {
        // Find latest session
        if (!sessions || sessions.length === 0) return;

        // Sort by date desc
        const sorted = [...sessions].sort((a, b) => new Date(b.date + 'T' + (b.endTime || '00:00')) - new Date(a.date + 'T' + (a.endTime || '00:00')));
        const lastSession = sorted[0];

        const lastDate = new Date(lastSession.date + 'T' + (lastSession.endTime || '12:00'));
        const hoursDiff = (now - lastDate) / (1000 * 60 * 60);

        let color = 'green';
        if (hoursDiff < 24) color = 'red';
        else if (hoursDiff < 48) color = 'orange';

        const muscles = muscleMap[exerciseId] || ['Other'];

        muscles.forEach(m => {
            // If muscle already has a status, keep the "most tired" one (Red > Orange > Green)
            if (!status[m] || status[m] === 'green') {
                status[m] = color;
            } else if (status[m] === 'orange' && color === 'red') {
                status[m] = color;
            }
        });
    });

    return status;
};

// Get 1RM Trend Data for a specific exercise
export const getOneRMTrend = (history, exerciseId) => {
    const sessions = history[exerciseId] || [];
    if (sessions.length === 0) return [];

    return sessions.map(session => {
        let max1RM = 0;
        session.sets.forEach(set => {
            const rm = calculateEstimated1RM(parseFloat(set.weight), parseFloat(set.reps));
            if (rm > max1RM) max1RM = rm;
        });
        return {
            date: session.date,
            value: max1RM
        };
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
};

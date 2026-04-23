export type TemplateItemType = 'habit' | 'task';

export interface TemplateItem {
  type: TemplateItemType;
  title: string;
  description?: string;
  // For Habits
  goal?: string;
  target_days?: number;
  reminder_time?: string;
  // For Tasks
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface RoutineTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  items: TemplateItem[];
}

export const PREDEFINED_TEMPLATES: RoutineTemplate[] = [
  {
    id: 'highly_effective',
    name: 'Highly Effective Routine',
    description: 'The core daily habits and tasks followed by the most successful people in the world.',
    icon: '👑',
    color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    items: [
      { type: 'task', title: 'Plan Tomorrow', description: 'Write down your Top 3 priorities for tomorrow.', priority: 'high' },
      { type: 'task', title: 'Time Blocking', description: 'Schedule your tasks into specific time blocks on your calendar.', priority: 'medium' },
      { type: 'habit', title: 'Exercise', goal: 'At least 30 mins to keep the body and mind sharp', reminder_time: '07:00' },
      { type: 'habit', title: 'Read / Learn', goal: 'Read at least 15 pages of a non-fiction book', target_days: 30 },
      { type: 'habit', title: 'Sleep 7-8 Hours', goal: 'Crucial for cognitive function and recovery', reminder_time: '22:30' }
    ]
  },
  {
    id: 'morning_miracle',
    name: 'Morning Miracle',
    description: 'Start your day right with a proven morning routine for maximum energy and focus.',
    icon: '🌅',
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    items: [
      { type: 'habit', title: 'Drink 500ml Water', goal: 'Stay hydrated', reminder_time: '07:00' },
      { type: 'habit', title: 'Meditation', goal: '10 mins of mindfulness', reminder_time: '07:15' },
      { type: 'habit', title: 'Read a Book', goal: '15 pages', reminder_time: '07:30' },
      { type: 'task', title: 'Plan the day', description: 'Review goals and prioritize top 3 tasks.', priority: 'high' }
    ]
  },
  {
    id: 'deep_work',
    name: 'Deep Work Focus',
    description: 'A structured routine to eliminate distractions and get meaningful work done.',
    icon: '💻',
    color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    items: [
      { type: 'task', title: 'Clear Desk', description: 'Remove all visual clutter from workspace.', priority: 'medium' },
      { type: 'task', title: 'Put phone in another room', description: 'Zero distractions allowed.', priority: 'high' },
      { type: 'habit', title: '2 Hours Deep Work', goal: 'No social media or email', target_days: 30 }
    ]
  },
  {
    id: 'fitness_starter',
    name: 'Fitness Starter',
    description: 'Build a consistent exercise habit with this balanced fitness routine.',
    icon: '🏋️‍♂️',
    color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    items: [
      { type: 'task', title: 'Buy Gym Equipment/Clothes', priority: 'medium' },
      { type: 'habit', title: '30m Workout', goal: 'Sweat every day', reminder_time: '17:30' },
      { type: 'habit', title: 'Drink Protein Shake', goal: 'Post-workout recovery' },
      { type: 'habit', title: 'Stretch for 10m', goal: 'Improve flexibility' }
    ]
  },
  {
    id: 'evening_wind_down',
    name: 'Evening Wind-down',
    description: 'Prepare your mind for deep sleep and set up tomorrow for success.',
    icon: '🌙',
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    items: [
      { type: 'habit', title: 'Journaling', goal: 'Write down 3 things you are grateful for', reminder_time: '21:00' },
      { type: 'habit', title: 'No Screens', goal: '1 hour before bed', reminder_time: '21:30' },
      { type: 'task', title: 'Prepare clothes for tomorrow', priority: 'medium' }
    ]
  },
  {
    id: 'monk_mode',
    name: 'Monk Mode Protocol',
    description: 'The ultimate self-mastery routine. Build iron discipline, abstain from cheap dopamine, and focus on holistic growth.',
    icon: '🧘‍♂️',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-400',
    items: [
      { type: 'habit', title: 'Join the 5 AM Club', goal: 'Wake up at 5 AM to start the day with purpose', reminder_time: '05:00' },
      { type: 'habit', title: 'Spiritual Connection', goal: '5 Daily Prayers / Namaz' },
      { type: 'habit', title: 'Energy Conservation', goal: 'Practice self-control, avoid masturbation and conserve energy' },
      { type: 'habit', title: 'Smoke-Free Day', goal: 'Protect your lungs and stay smoke-free today' },
      { type: 'habit', title: 'Physical Mastery', goal: 'Engage in any physical exercise or sports' },
      { type: 'habit', title: 'Optimal Hydration', goal: 'Drink 2-3 liters of water' },
      { type: 'habit', title: 'Deep Work Session', goal: 'Study or focus deeply for 2 uninterrupted hours' },
      { type: 'habit', title: 'Language Mastery', goal: 'Daily English practice' },
      { type: 'habit', title: 'Restorative Sleep', goal: 'Ensure 6-7 hours of quality sleep', reminder_time: '23:00' }
    ]
  }
];


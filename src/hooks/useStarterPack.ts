import { useState } from 'react';
import { useHabitStore } from '@/store/habitStore';
import { useCategoryStore } from '@/store/categoryStore';

const HABIT_BUNDLE = [
  { title: 'Join the 5 AM Club', categoryName: 'Morning & Discipline', color: '#8b5cf6', notes: 'Wake up at 5 AM to start the day with purpose.' },
  { title: 'Energy Conservation', categoryName: 'Morning & Discipline', color: '#8b5cf6', notes: 'Avoid masturbation and conserve energy.' },
  { title: 'Smoke-Free Day', categoryName: 'Health & Vitality', color: '#10b981', notes: 'Protect your lungs and stay smoke-free today.' },
  { title: 'Physical Mastery', categoryName: 'Health & Vitality', color: '#10b981', notes: 'Engage in any physical exercise or sports.' },
  { title: 'Optimal Hydration', categoryName: 'Health & Vitality', color: '#10b981', notes: 'Drink 2-3 liters of water.' },
  { title: 'Restorative Sleep', categoryName: 'Health & Vitality', color: '#10b981', notes: 'Ensure 6-7 hours of quality sleep.' },
  { title: 'Deep Work Session', categoryName: 'Growth & Intellect', color: '#3b82f6', notes: 'Study or focus deeply for 2 uninterrupted hours.' },
  { title: 'Language Mastery', categoryName: 'Growth & Intellect', color: '#3b82f6', notes: 'Daily English practice.' },
  { title: 'Spiritual Connection', categoryName: 'Mindfulness', color: '#f59e0b', notes: '5 Daily Prayers / Namaz.' },
];

export function useStarterPack() {
  const [isAddingPack, setIsAddingPack] = useState(false);
  const { addHabit } = useHabitStore();
  const { categories, addCategory } = useCategoryStore();

  const addStarterPack = async () => {
    setIsAddingPack(true);
    try {
      const categoryMap = new Map<string, string>(); // name to ID mapping

      // 1. Resolve Categories
      for (const item of HABIT_BUNDLE) {
        if (!categoryMap.has(item.categoryName)) {
          const existing = categories.find(c => c.name.toLowerCase() === item.categoryName.toLowerCase());
          if (existing) {
            categoryMap.set(item.categoryName, existing.id);
          } else {
            const newCat = await addCategory({ name: item.categoryName, color: item.color, type: 'habit' });
            categoryMap.set(item.categoryName, newCat.id);
          }
        }
      }

      // 2. Add Habits
      for (const item of HABIT_BUNDLE) {
        await addHabit({
          title: item.title,
          status: 'active',
          recurrence_rule: { type: 'daily' },
          category_id: categoryMap.get(item.categoryName) || null,
          notes: item.notes,
        });
      }

      return true;
    } catch (error) {
      console.error("Failed to add starter pack:", error);
      return false;
    } finally {
      setIsAddingPack(false);
    }
  };

  return { addStarterPack, isAddingPack };
}

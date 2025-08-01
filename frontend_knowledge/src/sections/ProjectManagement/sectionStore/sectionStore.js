import { create } from 'zustand';

const useSectionsStore = create((set) => ({
  sections: [],
  setSections: (sections) => set({ sections }),
  addSection: (section) => set((state) => ({ sections: [...state.sections, section] })),
  removeSection: (sectionId) => set((state) => ({ 
    sections: state.sections.filter(s => s.id !== sectionId) 
  })),
}));


export {useSectionsStore}
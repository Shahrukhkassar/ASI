import React from 'react';
import { Search, SlidersHorizontal, Check } from 'lucide-react';
import { TestCategory, Difficulty } from '../types';

interface TestFilterProps {
  categories: TestCategory[];
  selectedCategory: TestCategory;
  onSelectCategory: (category: TestCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedDifficulty: 'All' | Difficulty;
  onSelectDifficulty: (diff: 'All' | Difficulty) => void;
  totalMatches: number;
}

export const TestFilter: React.FC<TestFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  selectedDifficulty,
  onSelectDifficulty,
  totalMatches
}) => {
  return (
    <div className="space-y-4 mb-8">
      
      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              id={`filter-cat-${cat.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => onSelectCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/25'
                  : 'bg-white text-slate-600 hover:bg-violet-50 hover:text-violet-800 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Search & Difficulty Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        
        {/* Search input */}
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="tests-search-input"
            type="text"
            placeholder="Search by test name, chapter (e.g. Genetics, Human Physiology)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent text-slate-800 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button 
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
            >
              ×
            </button>
          )}
        </div>

        {/* Difficulty Selector */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5 text-violet-600" />
            <span className="hidden sm:inline">Difficulty:</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['All', 'Easy', 'Medium', 'Hard'] as const).map((diff) => {
              const isSelected = selectedDifficulty === diff;
              return (
                <button
                  key={diff}
                  id={`filter-diff-${diff.toLowerCase()}`}
                  onClick={() => onSelectDifficulty(diff)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-violet-800 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {diff}
                </button>
              );
            })}
          </div>

          <span className="text-xs font-medium text-slate-500 pl-2 hidden lg:inline">
            Showing <strong className="text-slate-900">{totalMatches}</strong> tests
          </span>
        </div>

      </div>

    </div>
  );
};

'use client';

import { useState } from 'react';

interface Tab {
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: number;
}

export default function Tabs({ tabs, defaultTab = 0 }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div>
      <div className="flex space-x-2 mb-6">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`pixel-button ${
              activeTab === index
                ? 'bg-orange-500 text-white dark:bg-primary dark:text-white'
                : 'bg-muted text-primary hover:bg-primary/20'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs[activeTab].content}</div>
    </div>
  );
} 
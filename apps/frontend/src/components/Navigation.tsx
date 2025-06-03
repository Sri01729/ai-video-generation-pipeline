import React from 'react';
export function Navigation() {
  return <div className="bg-gray-900 rounded-full p-1 flex items-center justify-between">
      <div className="flex items-center">
        <button className="p-2">
          {/* Left */}
        </button>
        <span className="text-sm px-2">0 / 0</span>
        <button className="p-2">
          {/* Right */}
        </button>
      </div>
      <div className="flex items-center">
        <button className="p-2">
          {/* Grid */}
        </button>
        <button className="bg-yellow-500 rounded-full p-2">
          {/* Grid Active */}
        </button>
      </div>
    </div>;
}
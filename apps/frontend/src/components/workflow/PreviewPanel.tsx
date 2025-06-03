import React from 'react';
export function PreviewPanel() {
  return <div className="bg-gray-900 rounded-3xl h-full flex flex-col">
      <div className="p-6">
        <h3 className="font-medium mb-4">Preview</h3>
        <div className="aspect-video bg-black rounded-lg w-full mb-4">
          {/* Video preview will go here */}
        </div>
        <div className="flex space-x-3">
          <button className="flex-1 bg-yellow-500 text-black font-medium py-2 px-4 rounded-lg hover:bg-yellow-400 transition-colors">
            Generate Video
          </button>
          <button className="flex-1 bg-gray-800 font-medium py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
            Download
          </button>
        </div>
      </div>
    </div>;
}
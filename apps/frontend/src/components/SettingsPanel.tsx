export function SettingsPanel() {
  return <div className="bg-gray-900 rounded-3xl p-6 flex-1 flex flex-col">
      {/* Seed section */}
      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-1">Seed</div>
        <div className="flex items-center justify-between">
          <div className="text-lg">53147</div>
          <button className="p-1">
            {/* CopyIcon */}
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Seed is unlocked to give your outputs more variety
        </div>
      </div>
      {/* Dropdowns */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-sm text-gray-400 mb-1">Model</div>
          <button className="bg-gray-800 rounded-lg py-2 px-3 w-full flex items-center justify-between">
            <span>Best quality</span>
          </button>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Aspect ratio</div>
          <button className="bg-gray-800 rounded-lg py-2 px-3 w-full flex items-center justify-between">
            <span>Landscape (16:9)</span>
          </button>
        </div>
      </div>
      {/* Powered by */}
      <div className="flex items-center text-xs text-gray-400 mb-auto">
        {/* InfoIcon */}
        <span>Powered by Imagen 3</span>
      </div>
      {/* Settings footer */}
      <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
        <div className="font-medium text-yellow-400">Settings</div>
        <button className="bg-gray-800 rounded-full p-1">
          {/* XIcon */}
        </button>
      </div>
    </div>;
}
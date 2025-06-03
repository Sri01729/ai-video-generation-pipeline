
export function Footer() {
  return <footer className="flex items-center justify-between px-6 py-4">
      <div className="text-sm text-gray-500">
        Disclaimer: iFX tools can make mistakes, so double-check them
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex space-x-2">
          {[1, 2, 3, 4].map(i => <div key={i} className="w-8 h-8 bg-gray-800 rounded-md"></div>)}
        </div>
        <div className="flex space-x-4 text-sm text-gray-400">
          <button className="hover:text-gray-200">Privacy</button>
          <button className="hover:text-gray-200">Terms of Service</button>
        </div>
      </div>
    </footer>;
}
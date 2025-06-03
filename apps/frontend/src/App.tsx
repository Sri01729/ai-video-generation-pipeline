import { useState } from "react";

import { Sidebar } from "./components/layout/Sidebar";
import { MainContent } from "./components/layout/MainContent";
// import { Footer } from "./components/Footer";

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  return (
    <div className="flex flex-col w-full min-h-screen bg-background text-text transition-colors">
      {/* <Header /> */}
      <div className="flex flex-row items-stretch flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} setVideoUrl={setVideoUrl} />
        <main className="flex-1 bg-panel shadow-panel rounded-lg m-4 overflow-hidden transition-colors">
          <MainContent videoUrl={videoUrl} />
        </main>
      </div>
    </div>
  );
};

export default App;
import { UserAvatar } from '@/components/UserAvatar';
import { NotesApp } from '@/components/notes/NotesApp';

const Index = () => {
  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full px-6 flex h-16 items-center justify-between md:justify-between">
          {/* Mobile: Hidden spacer for centering */}
          <div className="md:hidden w-10"></div>
          
          {/* Logo - centered on mobile, left on desktop */}
          <div className="flex items-center space-x-3 md:flex-none">
            <img src="/logo.webp" alt="BrightScribe Logo" className="h-8 w-8" />
            <h1 className="text-xl text-gradient font-normal">BrightScribe</h1>
          </div>
          
          {/* User Avatar - always on the right */}
          <div className="flex items-center gap-4">
            <UserAvatar />
          </div>
        </div>
      </header>

      {/* Notes App */}
      <div className="flex-1 overflow-hidden">
        <NotesApp />
      </div>
    </div>
  );
};

export default Index;
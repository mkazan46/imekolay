import React from 'react';
import LoginForm from '@/components/LoginForm';

const Index = () => {
  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <LoginForm />
        </div>
      </main>
      
      <footer className="py-4 text-center text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: '1s' }}>
      </footer>
    </div>
  );
};

export default Index;

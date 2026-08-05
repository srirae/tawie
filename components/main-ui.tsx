"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MainUI({ language }: { language: string }) {
  const [greeting, setGreeting] = useState("");
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [url, setUrl] = useState("");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    let timeGreeting = "Hello";
    if (hour < 12) timeGreeting = "Good Morning";
    else if (hour < 18) timeGreeting = "Good Afternoon";
    else timeGreeting = "Good Evening";

    const greetings: Record<string, Record<string, string>> = {
      English: { "Good Morning": "Good Morning", "Good Afternoon": "Good Afternoon", "Good Evening": "Good Evening", "Hello": "Hello" },
      Spanish: { "Good Morning": "Buenos días", "Good Afternoon": "Buenas tardes", "Good Evening": "Buenas noches", "Hello": "Hola" },
      French: { "Good Morning": "Bonjour", "Good Afternoon": "Bon après-midi", "Good Evening": "Bonsoir", "Hello": "Salut" },
      German: { "Good Morning": "Guten Morgen", "Good Afternoon": "Guten Tag", "Good Evening": "Guten Abend", "Hello": "Hallo" },
      Japanese: { "Good Morning": "おはようございます", "Good Afternoon": "こんにちは", "Good Evening": "こんばんは", "Hello": "こんにちは" }
    };

    const langGreetings = greetings[language] || greetings["English"];
    setGreeting(langGreetings[timeGreeting] || langGreetings["Hello"]);
  }, [language]);

  const handleLaunch = async (browser: string) => {
    if (!url) return;
    setStarting(true);
    if (typeof window !== 'undefined' && window.systemAPI) {
       try {
          // First ensure the browser is pulled if not already
          await window.systemAPI.dockerPull(`lscr.io/linuxserver/${browser.toLowerCase()}`);
       } catch (err) {
          console.warn(`Failed to pull ${browser} docker image. Is Docker running?`);
       }
       // In a real app, this would start the docker container and open the connection.
       alert(`Starting ${browser} sandbox for ${url} (Limit: ${timeLimit ? timeLimit + ' mins' : 'None'})`);
    }
    setStarting(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 transition-colors bg-background relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

      <div className="w-full max-w-2xl text-center mb-8 relative z-10">
         <h1 className="font-heading text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400 animate-in fade-in slide-in-from-bottom-4">
           {greeting}!
         </h1>
         <p className="mt-4 text-lg text-muted-foreground animate-in fade-in slide-in-from-bottom-5 delay-75 fill-mode-both">
           Enter a URL to safely browse in a disposable sandbox.
         </p>
      </div>
      
      <div className="w-full max-w-2xl relative animate-in fade-in slide-in-from-bottom-6 delay-150 fill-mode-both z-10">
         <div className="rounded-3xl glass-panel p-3 flex flex-col gap-3 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
            
            <textarea 
               value={url}
               onChange={(e) => setUrl(e.target.value)}
               placeholder="https://example.com" 
               className="w-full resize-none bg-transparent outline-none text-foreground placeholder:text-muted-foreground p-4 text-xl"
               rows={2}
               autoFocus
            />
            
            <div className="flex items-center justify-between border-t border-white/10 pt-3 px-2">
                <div className="flex items-center gap-2">
                   <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 hover:bg-white/10 h-10 px-4 text-muted-foreground border border-white/5 bg-black/20">
                         <Clock className="w-4 h-4" />
                         {timeLimit ? `${timeLimit} mins` : "Set Limit"}
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="glass-panel border-white/10 rounded-xl">
                         <DropdownMenuItem onClick={() => setTimeLimit(5)} className="hover:bg-white/10 cursor-pointer rounded-lg">5 mins</DropdownMenuItem>
                         <DropdownMenuItem onClick={() => setTimeLimit(7)} className="hover:bg-white/10 cursor-pointer rounded-lg">7 mins</DropdownMenuItem>
                         <DropdownMenuItem onClick={() => setTimeLimit(12)} className="hover:bg-white/10 cursor-pointer rounded-lg">12 mins</DropdownMenuItem>
                         <DropdownMenuItem onClick={() => setTimeLimit(null)} className="hover:bg-white/10 cursor-pointer rounded-lg">Custom (No Limit)</DropdownMenuItem>
                      </DropdownMenuContent>
                   </DropdownMenu>
                </div>

                <div className="flex items-center gap-3">
                    <Button 
                       variant="default" 
                       size="lg" 
                       disabled={!url || starting} 
                       onClick={() => handleLaunch('Chromium')}
                       className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
                    >
                        {starting ? 'Starting...' : 'Launch Chromium'}
                    </Button>
                    <Button 
                       variant="secondary" 
                       size="lg" 
                       disabled={!url || starting} 
                       onClick={() => handleLaunch('Firefox')}
                       className="gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-foreground border border-white/10 backdrop-blur-md"
                    >
                        {starting ? 'Starting...' : 'Launch Firefox'}
                    </Button>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
}

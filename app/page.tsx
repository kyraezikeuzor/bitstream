'use client'
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

interface FileData {
  deployedUrl: string;
  file: string;
  sha: string;
  size: number;
}

interface CDNResponse {
  files: FileData[];
  cdnBase: string;
}

const SLACK_CLIENT_ID = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID;
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI;
const HACKCLUB_TOKEN = process.env.NEXT_PUBLIC_HACKCLUB_TOKEN;
const HACKCLUB_TEAM_ID = "T0266FRGM";

export default function Home() {
  const [data, setData] = useState<CDNResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [slackToken, setSlackToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const storedToken = localStorage.getItem('slack_token');
    
    if (code) handleOAuthCallback(code);
    if (storedToken) setSlackToken(storedToken);
  }, []);

  const handleOAuthCallback = async (code: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: SLACK_CLIENT_ID!,
          client_secret: process.env.SLACK_CLIENT_SECRET!,
          code,
          redirect_uri: REDIRECT_URI!,
        }),
      });

      const { ok, authed_user } = await response.json();
      if (ok) {
        setSlackToken(authed_user.access_token);
        localStorage.setItem('slack_token', authed_user.access_token);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error('OAuth Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File | undefined) => {
    if (!file || !slackToken) return;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('channels', '@me');

      const slackResponse = await fetch('https://slack.com/api/files.upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${slackToken}` },
        body: formData
      });

      const { ok, file: slackFile } = await slackResponse.json();
      if (!ok) throw new Error('Slack upload failed');

      const cdnResponse = await fetch("https://cdn.hackclub.com/api/v3/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${HACKCLUB_TOKEN}`
        },
        body: JSON.stringify([slackFile.url_private])
      });

      setData(await cdnResponse.json());
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSlackLogin = () => {
    const scope = 'files:write,files:read,chat:write';
    const slackUrl = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&user_scope=${scope}&redirect_uri=${encodeURIComponent(REDIRECT_URI as string)}&team=${HACKCLUB_TEAM_ID}`;
    window.location.href = slackUrl;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 space-y-4 flex-1 container mx-auto max-w-[680px] p-5">
      <h1 className="text-4xl font-bold text-center mb-8">Hack Club CDN</h1>

      {isLoading ? (
        <div className="text-center">Loading...</div>
      ) : !slackToken ? (
        <button
          onClick={handleSlackLogin}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Login with Hack Club Slack
          {slackToken} {isLoading}
        </button>
      ) : (
        <div className="space-y-4">
          <Input 
            type="file" 
            accept="image/*"
            onChange={(e) => handleFileUpload(e.target.files?.[0])} 
          />
          
          {data?.files.map((file, index) => (
            <div key={index} className="border p-4 rounded-lg space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="font-medium">Deployed URL:</span>
                <button 
                  onClick={() => copyToClipboard(file.deployedUrl)}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p 
                onClick={() => copyToClipboard(file.deployedUrl)}
                className="text-sm break-all text-blue-500 hover:text-blue-600 cursor-pointer"
              >
                {file.deployedUrl}
              </p>
              
              {copied && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full">
                  <div className="bg-black text-white px-3 py-1 rounded text-sm animate-fade-out">
                    Copied to clipboard!
                  </div>
                </div>
              )}
              
              <div className="text-sm text-gray-600">
                <p>File: {file.file}</p>
                <p>SHA: {file.sha}</p>
                <p>Size: {file.size} bytes</p>
              </div>

              <img src={file.deployedUrl} alt="Uploaded Image" className="w-full h-auto mt-4 rounded-lg" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Add this to your globals.css
// @keyframes fadeOut {
//   0% { opacity: 1; }
//   50% { opacity: 1; }
//   100% { opacity: 0; }
// }
// 
// .animate-fade-out {
//   animation: fadeOut 2s ease-in-out forwards;
// }

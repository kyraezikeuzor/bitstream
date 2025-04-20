'use client'
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

// Use environment variables
const SLACK_CLIENT_ID = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID;
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI;
const HACKCLUB_TOKEN = process.env.NEXT_PUBLIC_HACKCLUB_TOKEN;

// Hack Club Workspace ID (you'll get this from your Slack App settings)
const HACKCLUB_TEAM_ID = "T0266FRGM";

if (!SLACK_CLIENT_ID || !REDIRECT_URI || !HACKCLUB_TOKEN) {
  throw new Error('Missing required environment variables');
}

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [slackToken, setSlackToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userWorkspace, setUserWorkspace] = useState('');

  useEffect(() => {
    // Check for OAuth code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (error === 'access_denied') {
      alert('Please authorize in the Hack Club workspace');
      return;
    }
    
    if (code) {
      handleOAuthCallback(code);
    }

    // Check stored token
    const storedToken = localStorage.getItem('slack_token');
    if (storedToken) {
      setSlackToken(storedToken);
      checkWorkspace(storedToken);
    }
  }, []);

  const checkWorkspace = async (token: string) => {
    try {
      const response = await fetch('https://slack.com/api/auth.test', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.ok && data.team_id === HACKCLUB_TEAM_ID) {
        setUserWorkspace(data.team);
      } else {
        // Wrong workspace
        handleLogout();
        alert('Please login with your Hack Club workspace account');
      }
    } catch (error) {
      console.error('Workspace check failed:', error);
    }
  };

  const uploadToSlackAndGetUrl = async (file: File) => {
    // First upload to Slack's files.upload API
    const formData = new FormData();
    formData.append('file', file);
    formData.append('channels', '@me'); // DM to self

    const slackResponse = await fetch('https://slack.com/api/files.upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${slackToken}`,
      },
      body: formData
    });

    const slackData = await slackResponse.json();
    
    if (slackData.ok) {
      // Get the file URL from Slack's response
      const fileUrl = slackData.file.url_private;
      
      // Now feed this URL to Hack Club's CDN
      const cdnResponse = await fetch("https://cdn.hackclub.com/api/v3/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${HACKCLUB_TOKEN}`
        },
        body: JSON.stringify([fileUrl])
      });
      
      return await cdnResponse.json();
    } else {
      throw new Error('Slack upload failed');
    }
  };

  const handleFileUpload = async (file: File | undefined) => {
    if (!file) return;
    
    try {
      if (!slackToken) {
        // You'd need to implement Slack OAuth flow here
        alert('Please login to Slack first');
        return;
      }

      const data = await uploadToSlackAndGetUrl(file);
      setData(data);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleSlackLogin = () => {
    const scope = 'files:write,files:read,chat:write';
    const slackUrl = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&user_scope=${scope}&redirect_uri=${encodeURIComponent(REDIRECT_URI as string)}&team=${HACKCLUB_TEAM_ID}`;
    window.location.href = slackUrl;
  };

  const handleLogout = () => {
    setSlackToken('');
    setUserWorkspace('');
    localStorage.removeItem('slack_token');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOAuthCallback = async (code: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: SLACK_CLIENT_ID!,
          client_secret: process.env.SLACK_CLIENT_SECRET!,
          code,
          redirect_uri: REDIRECT_URI!,
        }),
      });

      const data = await response.json();
      if (data.ok) {
        const token = data.authed_user.access_token;
        setSlackToken(token);
        localStorage.setItem('slack_token', token);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error('OAuth Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4 flex-1 container mx-auto max-w-[680px] p-5">
      <h1 className="text-4xl font-bold text-center mb-8">
        Hack Club CDN
      </h1>

      {isLoading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <>
          {!slackToken ? (
            <button
              onClick={handleSlackLogin}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Login with Hack Club Slack
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Connected to {userWorkspace}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Logout
                </button>
              </div>
              <Input 
                type="file" 
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files?.[0])} 
              />
            </div>
          )}
        </>
      )}
      
      {data && data.files && data.files.map((file: any, index: number) => (
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

'use client'
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState('');
  const [permanentUrl, setPermanentUrl] = useState('');

  const handleUrlUpload = async () => {
    if (!url) return;
    
    try {
      console.log(url)
      const response = await fetch("https://cdn.hackclub.com/api/v3/new", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer beans` },
        body: JSON.stringify([url])
      });
      
      const data = await response.json();
      console.log(data.files[0].deployedUrl)
      setPermanentUrl(data.files[0].deployedUrl);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleClear = () => {
    setUrl('');
    setPermanentUrl('');
  };

  return (
    <div className="p-4 max-w-[680px] mx-auto py-[12vh]">
      <h1 className="text-4xl font-bold text-center mb-8">Hack Club CDN</h1>
      
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-gray-700">
            Upload any file URL to get a permanent link that will last for thousands of years.
          </p>
        </div>

        <div className="flex gap-2">
          <Input 
            type="text" 
            placeholder="Enter a URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            onClick={handleUrlUpload}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Upload
          </button>
          {(url || permanentUrl) && (
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Clear
            </button>
          )}
        </div>
        
        {permanentUrl && (
          <div className="border p-4 rounded-lg">
            <p className="text-sm break-all text-blue-500">
              {permanentUrl}
            </p>
            {permanentUrl.match(/\.(jpg|jpeg|png|gif)$/i) && (
              <img src={permanentUrl} alt="Uploaded Image" className="w-full h-auto mt-4 rounded-lg" />
            )}
          </div>
        )}
      </div>
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

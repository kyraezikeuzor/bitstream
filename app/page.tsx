"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useCopyToClipboard } from "@/lib/utils";
import { toast } from "sonner";
import { Upload, Delete } from "lucide-react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [permanentUrl, setPermanentUrl] = useState("");
  const { copyToClipboard, copied } = useCopyToClipboard();

  if (copied) {
    toast.success("Copied to clipboard");
  }

  const handleUrlUpload = async () => {
    if (!url) return;

    try {
      console.log(url);
      const response = await fetch("https://cdn.hackclub.com/api/v3/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer beans`,
        },
        body: JSON.stringify([url]),
      });

      const data = await response.json();
      console.log(data.files[0].deployedUrl);
      setPermanentUrl(data.files[0].deployedUrl);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleClear = () => {
    setUrl("");
    setPermanentUrl("");
  };

  return (
    <div className="max-w-[680px] mx-auto my-auto min-h-screen px-6 py-[16vh]">
      <h1 className="text-4xl lg:text-5xl font-semibold text-left mb-4">
        Bitstream
      </h1>
      <p className=" text-muted-foreground text-left mb-6">
        Using <a href="https://hackclub.com/cdn">Hack Club</a>
        &apos;s CDN to store files on the cloud forever, for free. Input a
        temporary file URL (image, video, etc) & get a permanent link.
      </p>

      <div className="space-y-6 mt-10">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter a URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button onClick={handleUrlUpload}>
            Upload <Upload className="w-4 h-4" />
          </Button>
          {(url || permanentUrl) && (
            <Button onClick={handleClear}>
              Clear <Delete className="w-4 h-4" />
            </Button>
          )}
        </div>

        {permanentUrl && (
          <div className="card">
            <span
              className="text-md break-all font-medium text-blue-500 cursor-pointer"
              onClick={() => copyToClipboard(permanentUrl)}
            >
              {copied ? "Copied!" : permanentUrl}
            </span>
          </div>
        )}

        {permanentUrl && (
          <div className="card">
            <img
              src={url}
              alt="Uploaded Image"
              className="w-full h-auto mt-4 rounded-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
}

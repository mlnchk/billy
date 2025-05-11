import { Button } from "@/components/ui/button";

import { retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { ClipboardIcon } from "lucide-react";

export const DebugInfo = () => {
  const launchParams = retrieveLaunchParams();
  if (!launchParams.tgWebAppData) {
    return null;
  }

  const data = JSON.stringify(
    Object.entries(launchParams.tgWebAppData),
    null,
    2,
  );

  return (
    <div>
      <pre>{data}</pre>
      <Button
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={() => {
          navigator.clipboard
            .writeText(data)
            .then(() => {
              // Optional: Add some visual feedback that copy was successful
              console.log("Launch params copied to clipboard");
            })
            .catch((err) => {
              console.error("Failed to copy launch params:", err);
            });
        }}
      >
        <ClipboardIcon className="w-4 h-4" />
      </Button>
    </div>
  );
};

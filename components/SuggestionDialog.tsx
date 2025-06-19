import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/useApi";

export default function SuggestionDialog({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const { post } = useApi();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      await post("/suggestion", { message });
      setSuccess(true);
      setMessage("");
    } catch (err) {
      setError("Could not send suggestion. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suggest a Feature or Improvement</DialogTitle>
          <DialogDescription>
            We value your feedback! Please share any suggestions or improvements you would like to see.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            className="w-full min-h-[100px] border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Type your suggestion here..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
            disabled={loading}
          />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">Thank you for your suggestion!</div>}
          <DialogFooter className="px-4 sm:px-0">
            <Button type="submit" disabled={loading || !message.trim()} className="w-full">
              {loading ? "Sending..." : "Send Suggestion"}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="ghost" className="w-full">
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
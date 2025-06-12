"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, Mail, Camera } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useApi } from "@/hooks/useApi";

export default function EditProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const api = useApi();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
  });

  if (!session?.user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.put("/user", formData);
      await update({ name: formData.name });
      toast.success("Profile updated successfully");
      router.push("/dashboard/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">Edit Profile</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-8 shadow-lg border-t-4 border-t-blue-500">
          {/* Profile Picture Section */}
          <div className="flex items-center gap-6 pb-6 mb-6 border-b border-gray-100">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "Profile"}
                className="w-24 h-24 rounded-full ring-4 ring-blue-50"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center ring-4 ring-blue-50">
                <User className="w-12 h-12 text-blue-400" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-medium mb-1 text-gray-900">Profile Picture</h3>
              <p className="text-sm text-gray-500 mb-3">
                Your profile picture will be visible to other users
              </p>
              <Button
                variant="outline"
                className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                disabled
              >
                <Camera className="w-4 h-4" />
                Change Picture
              </Button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-blue-400" />
                <Input
                  id="name"
                  placeholder="Enter your name"
                  className="pl-10 border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-blue-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10 bg-gray-50 border-gray-200 text-gray-500"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  disabled
                />
              </div>
              <p className="text-sm text-gray-500">
                Email cannot be changed. Contact support if you need to update
                your email.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
            <Link href="/dashboard/profile">
              <Button variant="outline" className="hover:bg-gray-50 hover:text-gray-900 transition-colors">
                Cancel
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}

"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Bell, 
  Moon, 
  Sun, 
  Globe, 
  Shield, 
  Mail,
  Clock,
  Trash2,
  AlertCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSettings } from "@/hooks/useSettings";

interface UserSettings {
  emailNotifications: boolean;
  reviewReminders: boolean;
  publicProfile: boolean;
  shareStatistics: boolean;
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { getSettings, updateSettings, deleteAccount } = useSettings();

  const [settings, setSettings] = useState<UserSettings>({
    emailNotifications: false,
    reviewReminders: false,
    publicProfile: false,
    shareStatistics: false,
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getSettings();
        setSettings(data);
      } catch (error) {
        console.error('Error loading settings:', error);
        toast.error('Failed to load settings');
      }
    };
    loadSettings();
  }, []); // Empty dependency array - only run once on mount

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateSettings(settings);
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      toast.success("Account deleted successfully");
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error("Failed to delete account");
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleSettingChange = (key: keyof UserSettings) => (checked: boolean) => {
    setSettings(prev => ({ ...prev, [key]: checked }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
          Settings
        </h1>
        <Button 
          onClick={handleSave} 
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Appearance Settings */}
        <Card className="p-8 shadow-lg border-t-4 border-t-blue-500 dark:border-t-blue-400">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Sun className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            Appearance
          </h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base dark:text-gray-100">Theme</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Switch between light and dark theme
                </p>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="p-8 shadow-lg border-t-4 border-t-indigo-500 dark:border-t-indigo-400">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Bell className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            Notifications
          </h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base dark:text-gray-100">Email Notifications</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Receive email notifications for important updates
                </p>
              </div>
              <Switch 
                checked={settings.emailNotifications}
                onCheckedChange={handleSettingChange('emailNotifications')}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base dark:text-gray-100">Review Reminders</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get reminded when it's time to review your cards
                </p>
              </div>
              <Switch 
                checked={settings.reviewReminders}
                onCheckedChange={handleSettingChange('reviewReminders')}
              />
            </div>
          </div>
        </Card>

        {/* Privacy Settings */}
        <Card className="p-8 shadow-lg border-t-4 border-t-purple-500 dark:border-t-purple-400">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Shield className="w-5 h-5 text-purple-500 dark:text-purple-400" />
            Privacy
          </h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base dark:text-gray-100">Public Profile</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Allow others to see your profile and progress
                </p>
              </div>
              <Switch 
                checked={settings.publicProfile}
                onCheckedChange={handleSettingChange('publicProfile')}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base dark:text-gray-100">Share Statistics</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Share your learning statistics publicly
                </p>
              </div>
              <Switch 
                checked={settings.shareStatistics}
                onCheckedChange={handleSettingChange('shareStatistics')}
              />
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-8 shadow-lg border-t-4 border-t-red-500 dark:border-t-red-400">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
            Danger Zone
          </h2>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <Label className="text-base text-red-600 dark:text-red-400">Delete Account</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                className="bg-red-600 hover:bg-red-700 transition-colors"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription className="space-y-3">
              <p>Are you sure you want to delete your account? This action cannot be undone.</p>
              <div className="bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200 px-4 py-3 rounded-lg text-sm">
                <p className="font-medium">The following data will be permanently deleted:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Your profile information</li>
                  <li>All your word lists and cards</li>
                  <li>Your learning progress and statistics</li>
                  <li>Review history and schedules</li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex items-center gap-3 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
              onClick={handleDeleteAccount}
            >
              {isDeleting ? (
                "Deleting..."
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

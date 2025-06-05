
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Smartphone, Hand, Power } from "lucide-react";

interface PublicModeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
}

const PublicModeDialog: React.FC<PublicModeDialogProps> = ({
  isOpen,
  onClose,
  onStart,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-purple-600">
            <Eye className="w-6 h-6" />
            Public Mode
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="text-center text-gray-600 mb-6">
            <p className="font-medium">Discrete counting for public spaces</p>
            <p className="text-sm text-gray-500">बस, ट्रेन में गुप्त जाप के लिए</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
              <Smartphone className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Screen will turn completely black</p>
                <p className="text-xs text-gray-500">Phone will appear completely off to others</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
              <Hand className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Double tap anywhere to count mantras</p>
                <p className="text-xs text-gray-500">Two quick taps within 500ms</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
              <Power className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Press power button to exit</p>
                <p className="text-xs text-gray-500">Turn screen off then on to return</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="text-amber-500 mt-0.5">🔔</div>
              <div>
                <p className="font-medium text-sm text-amber-700 dark:text-amber-300">
                  Continuous alarm when target is completed
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Alarm will ring until you manually stop it
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onStart}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
          >
            Start Public Mode
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PublicModeDialog;

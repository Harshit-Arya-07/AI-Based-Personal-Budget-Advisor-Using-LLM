'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Camera, Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { Card, Avatar, VerifiedBadge, Button } from '@/components/ui/shared';
import { cn } from '@/lib/utils';

interface UserProfileCardProps {
  mode?: 'view' | 'edit';
  onSave?: (data: { name: string; photoURL: string }) => Promise<void>;
  className?: string;
  showBadge?: boolean;
}

export default function UserProfileCard({
  mode = 'view',
  onSave,
  className,
  showBadge = true,
}: UserProfileCardProps) {
  const user = auth.currentUser;
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    photoURL: user?.photoURL || '',
  });

  useEffect(() => {
    setFormData({
      name: user?.displayName || '',
      photoURL: user?.photoURL || '',
    });
  }, [user]);

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(formData);
      if (mode === 'view') {
        setIsEditing(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <Card className={className}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Profile Header */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative">
          <Avatar
            src={isEditing ? formData.photoURL : user.photoURL}
            name={isEditing ? formData.name : user.displayName || 'User'}
            size="lg"
          />
          {isEditing && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-[#4F6EF7] flex items-center justify-center text-white hover:bg-[#3D5BD9] transition-colors shadow-lg"
            >
              <Camera className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your name"
              className="w-full text-xl font-semibold text-foreground bg-transparent border-b border-border focus:border-[#4F6EF7] focus:outline-none pb-1 transition-colors"
            />
          ) : (
            <h2 className="text-xl font-semibold text-foreground truncate">
              {user.displayName || 'User'}
            </h2>
          )}

          <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{user.email}</span>
          </div>

          {isEditing && (
            <p className="text-xs text-muted-foreground mt-1">
              Email managed by Google Sign-In
            </p>
          )}
        </div>

        {/* Badge or Edit Button */}
        <div className="flex-shrink-0">
          {!isEditing && showBadge && <VerifiedBadge />}
          {mode === 'view' && onSave && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="ml-2"
            >
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Edit Actions */}
      {isEditing && onSave && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex gap-3 mt-6 pt-4 border-t border-border"
        >
          {mode === 'view' && (
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  name: user.displayName || '',
                  photoURL: user.photoURL || '',
                });
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleSave}
            loading={isSaving}
            className="flex-1"
          >
            Save Changes
          </Button>
        </motion.div>
      )}
    </Card>
  );
}

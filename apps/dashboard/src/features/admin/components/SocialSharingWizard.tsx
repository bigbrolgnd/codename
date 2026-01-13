import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Twitter, Linkedin, Facebook, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface SocialSharingWizardProps {
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const SocialSharingWizard = ({ tenantId, isOpen, onClose }: SocialSharingWizardProps) => {
  const [copied, setCopied] = useState(false);
  const referralLink = `znapsite.com/?ref=social_${tenantId}`;

  useEffect(() => {
    if (isOpen) {
      // Trigger confetti when opened (celebration)
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = (platform: 'twitter' | 'linkedin' | 'facebook') => {
    const text = encodeURIComponent("Check out my new site built with ZnapSite!");
    const url = encodeURIComponent(referralLink);
    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share your new site!</DialogTitle>
          <DialogDescription>
            Your site is live! Share it with the world and earn rewards when friends sign up.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-6 py-4">
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full hover:text-blue-400 hover:border-blue-400"
              onClick={() => handleShare('twitter')}
              aria-label="Share on Twitter"
            >
              <Twitter className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full hover:text-blue-700 hover:border-blue-700"
              onClick={() => handleShare('linkedin')}
              aria-label="Share on LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full hover:text-blue-600 hover:border-blue-600"
              onClick={() => handleShare('facebook')}
              aria-label="Share on Facebook"
            >
              <Facebook className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="link" className="sr-only">
              Referral Link
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                id="link"
                defaultValue={referralLink}
                readOnly
                className="flex-1"
              />
              <Button type="button" size="sm" className="px-3" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="ml-2">{copied ? 'Copied' : 'Copy Link'}</span>
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-center">
          <Button type="button" variant="secondary" onClick={onClose}>
            Maybe later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
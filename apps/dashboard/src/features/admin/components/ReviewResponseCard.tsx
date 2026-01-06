import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Send, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewResponseCardProps {
  reviewId: string;
  authorName: string;
  rating: number;
  content: string;
  initialDraft?: string;
  onPost: (reviewId: string, response: string) => Promise<void>;
  onClose: () => void;
}

export const ReviewResponseCard: React.FC<ReviewResponseCardProps> = ({
  reviewId,
  authorName,
  rating,
  content,
  initialDraft = '',
  onPost,
  onClose
}) => {
  const [response, setResponse] = useState(initialDraft);
  const [isPosting, setIsPosting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePost = async () => {
    setIsPosting(true);
    setError(null);
    try {
      await onPost(reviewId, response);
      setIsSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (err: any) {
      console.error('Failed to post response:', err);
      setError(err.message || 'Failed to post response. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="border-emerald-500 bg-emerald-500/5">
        <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
          <CheckCircle2 size={48} className="text-emerald-500" />
          <h3 className="text-xl font-bold">Response Posted!</h3>
          <p className="text-zinc-400">Your reply is now live on Google Business.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-950 border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="border-b border-zinc-900 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <MessageSquare size={14} className="text-emerald-500" /> Review Detail
          </CardTitle>
          <Badge variant="outline" className="font-mono text-[10px] bg-zinc-900 border-zinc-800">
            ID: {reviewId.substring(0, 8)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Original Review */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-lg">{authorName}</h4>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < rating ? "text-amber-400" : "text-zinc-800"}>★</span>
              ))}
            </div>
          </div>
          <p className="text-zinc-300 italic leading-relaxed">"{content}"</p>
        </div>

        {/* AI Draft Section */}
        <div className="space-y-3 pt-4 border-t border-zinc-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-500">
              <Sparkles size={14} /> AI Suggested Draft
            </div>
            <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-tighter">Tone: Professional</span>
          </div>
          
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            className="w-full h-32 bg-zinc-900/50 border-zinc-800 text-sm text-zinc-200 resize-none"
            placeholder="Write your response here..."
          />
          
          {error && (
            <div className="flex items-center gap-2 text-rose-500 text-xs mt-2 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 flex gap-3">
        <Button 
          variant="outline" 
          onClick={onClose}
          className="flex-1 border-zinc-800 text-zinc-400 hover:text-white"
        >
          Cancel
        </Button>
        <Button 
          onClick={handlePost}
          disabled={!response.trim() || isPosting}
          className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2 shadow-lg shadow-emerald-900/20"
        >
          <Send size={16} /> {isPosting ? 'Posting...' : 'Approve & Post'}
        </Button>
      </CardFooter>
    </Card>
  );
};
